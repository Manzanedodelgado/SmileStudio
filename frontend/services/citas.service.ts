// ─────────────────────────────────────────────────────────────────
//  services/citas.service.ts
//  Lectura de citas de agenda desde Supabase FDW (subquery sobre DCitas).
//  Los campos llegan ya transformados por la subquery SQL Server:
//    Fecha='YYYY-MM-DD', Hora='HH:MM', EstadoCita/Tratamiento/Odontologo=texto.
// ─────────────────────────────────────────────────────────────────
import { Cita, EstadoCita, TratamientoCategoria } from '../types';
import { dbSelect, dbFetch, dbInsert, dbUpdate, dbDelete, isDbConfigured, generateId } from './db';
import { logAudit } from './audit.service';
import { logger } from './logger';

/** Row que devuelve el FDW con subquery (ya transformado por SQL Server) */
interface CitaRow {
    Registro?: string;      // IdCita → varchar
    NumPac?: string;        // NumPac (columna FDW — case-sensitive)
    Apellidos?: string;     // Extraído de Texto (antes de la coma)
    Nombre?: string;        // Extraído de Texto (después de la coma)
    TelMovil?: string;      // Movil
    Movil?: string;         // Campo directo Movil de DCitas
    Contacto?: string;      // Campo Contacto (nombre visible en GELITE)
    Texto?: string;         // Campo Texto (APELLIDOS, Nombre en GELITE)
    Fecha: string;          // 'YYYY-MM-DD'
    Hora?: string;          // 'HH:MM'
    EstadoCita?: string;    // 'Planificada' | 'Anulada' | 'Finalizada' | ...
    Tratamiento?: string;   // 'Control' | 'Urgencia' | 'Endodoncia' | ...
    Odontologo?: string;    // 'Dr. Mario Rubio' | 'Dra. Irene Garcia' | ...
    Notas?: string;
    Duracion?: number;      // minutos (ya convertido desde segundos)
    NOTAS?: string;         // Campo NOTAS directo de DCitas
    IdSitC?: number;        // Estado numérico de la cita
}

// ── Mapeo estado texto → enum interno ────────────────────────────
const estadoTextToEnum = (estado?: string): EstadoCita => {
    switch (estado) {
        case 'Planificada': return 'planificada';
        case 'Anulada': return 'anulada';
        case 'Finalizada': return 'finalizada';
        case 'Confirmada': return 'confirmada';
        case 'Cancelada': return 'cancelada';
        default: return 'planificada';
    }
};

// ── Mapeo tratamiento texto → categoría UI ───────────────────────
const tratamientoToCategoria = (tto?: string): TratamientoCategoria => {
    switch (tto) {
        case 'Control':
        case 'Primera Visita':
        case 'Estudio Ortodoncia':
        case 'Rx/escaner':
            return 'Diagnostico';
        case 'Urgencia': return 'Urgencia';
        case 'Protesis Fija':
        case 'Protesis Removible':
        case 'Ajuste Prot/tto': return 'Protesis';
        case 'Cirugia/Injerto':
        case 'Exodoncia': return 'Cirugía';
        case 'Retirar Ortodoncia':
        case 'Colocacion Ortodoncia':
        case 'Mensualidad Ortodoncia': return 'Ortodoncia';
        case 'Periodoncia': return 'Periodoncia';
        case 'Cirugia de Implante': return 'Implante';
        case 'Higiene Dental': return 'Higiene';
        case 'Endodoncia': return 'Endodoncia';
        case 'Reconstruccion': return 'Conservadora';
        default: return 'Diagnostico';
    }
};

// ── Conversión row → Cita ────────────────────────────────────────
const rowToCita = (row: CitaRow): Cita => {
    // Extraer nombre: priorizar Texto (formato "APELLIDOS, Nombre"), luego Contacto
    let apellidos = row.Apellidos ?? '';
    let nombre = row.Nombre ?? '';
    if (!apellidos && !nombre && row.Texto) {
        const parts = row.Texto.split(',');
        apellidos = (parts[0] ?? '').trim();
        nombre = (parts[1] ?? '').trim();
    }
    if (!apellidos && !nombre && row.Contacto) {
        apellidos = row.Contacto.trim();
    }
    const nombreCompleto = [nombre, apellidos].filter(Boolean).join(' ').trim().toUpperCase() || 'PACIENTE';

    // Doctores (Dr./Dra.) → G1, Sanitarios (Tc., higienistas, etc.) → G2
    const gabinete = row.Odontologo?.startsWith('Dr') ? 'G1' : 'G2';

    // Teléfono móvil: priorizar Movil, luego TelMovil
    const movil = row.Movil ?? row.TelMovil ?? '';

    // Notas: priorizar Notas (transformado), luego NOTAS (directo)
    const notas = row.Notas ?? row.NOTAS ?? '';

    return {
        id: row.Registro || generateId(),
        pacienteNumPac: row.NumPac ?? row.Contacto ?? '',
        nombrePaciente: nombreCompleto,
        apellidos,
        nombre,
        gabinete,
        horaInicio: row.Hora ?? '00:00',
        duracionMinutos: row.Duracion ?? 30,
        tratamiento: row.Tratamiento ?? 'Sin especificar',
        categoria: tratamientoToCategoria(row.Tratamiento),
        estado: estadoTextToEnum(row.EstadoCita),
        doctor: row.Odontologo ?? 'Odontologo',
        alertasMedicas: [],
        alertasLegales: [],
        alertasFinancieras: false,
        notas,
        movil,
        fecha: row.Fecha,
    };
};

/** Formatea un Date como 'YYYY-MM-DD' para filtrar la FDW */
export const dateToISO = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/** Obtiene TODAS las citas de un día concreto — paginado para superar el límite de 1000 de PostgREST */
export const getCitasByFecha = async (fecha: Date): Promise<Cita[]> => {
    if (!isDbConfigured()) { logger.warn('[CITAS] DB no configurada'); return []; }
    const fechaStr = dateToISO(fecha);

    // 1. Leer citas GELITE (FDW — solo lectura) — paginado
    const PAGE_SIZE = 1000;
    let geliteRows: CitaRow[] = [];
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
        const page = await dbSelect<CitaRow>('DCitas', {
            Fecha: `eq.${fechaStr}`,
            order: 'Hora.asc',
            limit: String(PAGE_SIZE),
            offset: String(offset),
        });
        geliteRows.push(...page);
        hasMore = page.length === PAGE_SIZE;
        offset += PAGE_SIZE;
    }
    const geliteCitas = geliteRows.map(rowToCita);

    // 2. Leer citas web (nativas Supabase — lectura/escritura)
    const webCitas = await getCitasWeb(fecha);

    // 3. Leer overrides web sobre citas GELITE
    const webOverrides = await dbSelect<any>('citas_web', {
        fecha: `eq.${fechaStr}`,
        select: 'id_cita_gelite,deleted',
    });
    const deletedGelite = new Set(
        webOverrides.filter((o: any) => o.deleted && o.id_cita_gelite).map((o: any) => o.id_cita_gelite)
    );
    const overriddenGelite = new Set(
        webOverrides.filter((o: any) => o.id_cita_gelite).map((o: any) => o.id_cita_gelite)
    );

    // 4. Merge: GELITE (sin eliminadas ni sobreescritas) + web
    const merged = [
        ...geliteCitas.filter(c => !deletedGelite.has(c.id) && !overriddenGelite.has(c.id)),
        ...webCitas,
    ].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

    logger.debug(`[CITAS] Merge ${fechaStr}: ${geliteCitas.length} GELITE + ${webCitas.length} web = ${merged.length}`);
    return merged;
};

/**
 * getCitasVentana — Carga citas desde hace 6 meses hasta sin límite en el futuro.
 * Usada por el grid de agenda. Datos fuera de esta ventana permanecen en BBDD.
 * Paginado para superar el límite de 1000 de PostgREST.
 */
export const getCitasVentana = async (): Promise<Cita[]> => {
    if (!isDbConfigured()) { logger.warn('[CITAS] DB no configurada'); return []; }

    const desde = new Date();
    desde.setMonth(desde.getMonth() - 6);
    const desdeStr = dateToISO(desde);

    const PAGE_SIZE = 1000;
    let allRows: CitaRow[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const page = await dbSelect<CitaRow>('DCitas', {
            Fecha: `gte.${desdeStr}`,
            order: 'Fecha.asc,Hora.asc',
            limit: String(PAGE_SIZE),
            offset: String(offset),
        });
        allRows.push(...page);
        hasMore = page.length === PAGE_SIZE;
        offset += PAGE_SIZE;
    }

    logger.debug(`[CITAS] Ventana cargada: ${allRows.length} citas desde ${desdeStr}`);
    return allRows.map(rowToCita);
};

/** Obtiene citas de un paciente — solo últimos 6 meses, paginado */
export const getCitasByPaciente = async (numPac: string): Promise<Cita[]> => {
    if (!isDbConfigured()) return [];
    // Filtro 6 meses atrás desde hoy
    const desde = new Date();
    desde.setMonth(desde.getMonth() - 6);
    const desdeStr = dateToISO(desde);

    const PAGE_SIZE = 1000;
    let all: CitaRow[] = [];
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
        const page = await dbSelect<CitaRow>('DCitas', {
            NUMPAC: `eq.${numPac}`,
            Fecha: `gte.${desdeStr}`,
            order: 'Fecha.desc,Hora.asc',
            limit: String(PAGE_SIZE),
            offset: String(offset),
        });
        all.push(...page);
        hasMore = page.length === PAGE_SIZE;
        offset += PAGE_SIZE;
    }
    return all.map(rowToCita);
};

/**
 * Crea una nueva cita usando RPC reserve_slot (pessimistic locking).
 * VLN-001 FIX: Evita doble booking mediante UNIQUE constraint + SELECT FOR UPDATE en el servidor.
 */
export const createCita = async (cita: Omit<Cita, 'id'>, fecha: Date): Promise<Cita | null> => {
    if (!isDbConfigured()) return { ...cita, id: generateId() } as Cita;

    const fechaStr = dateToISO(fecha);

    // SEC-C01 FIX: Eliminar credenciales hardcodeadas — usar dbFetch
    // Llamar RPC reserve_slot — el servidor hace SELECT FOR UPDATE + INSERT atómico
    const response = await dbFetch('rpc/reserve_slot', {
        method: 'POST',
        body: JSON.stringify({
            p_num_pac: cita.pacienteNumPac || null,
            p_nombre: cita.nombrePaciente || 'Paciente',
            p_fecha: fechaStr,
            p_hora: cita.horaInicio + ':00',
            p_duracion: cita.duracionMinutos || 30,
            p_tratamiento: cita.tratamiento || 'Control',
            p_doctor: cita.doctor || '',
            p_gabinete: cita.gabinete || 'G1',
            p_notas: cita.notas || '',
        }),
    });

    if (!response.ok) {
        logger.error('[CITAS] reserve_slot error:', response.status);
        return null;
    }

    const result = await response.json();

    // El servidor devuelve { error: 'Slot ya reservado' } si hay conflicto
    if (result.error) {
        logger.warn('[CITAS] Slot ya reservado:', result);
        throw new Error(result.error);
    }

    logAudit({ action: 'CREATE_CITA', entity_type: 'cita', entity_id: result.id, details: { fecha: fechaStr, gabinete: cita.gabinete } });

    return { ...cita, id: result.id } as Cita;
};

/** Actualiza una cita — si es de citas_web (uuid) escribe directo,
 *  si es de GELITE (numérico) crea override en citas_web */
export const updateCita = async (
    id: string,
    updates: Partial<Cita>,
    nuevaFecha?: Date
): Promise<Cita | null> => {
    if (!isDbConfigured()) return { id, ...updates } as Cita;

    const isUuid = id.includes('-');
    if (isUuid) {
        // Cita creada desde web — actualizar directamente
        const body: any = {};
        if (updates.nombrePaciente) body.nombre = updates.nombrePaciente;
        if (updates.horaInicio) body.hora = updates.horaInicio + ':00';
        if (updates.duracionMinutos) body.duracion_min = updates.duracionMinutos;
        if (updates.tratamiento) body.tratamiento = updates.tratamiento;
        if (updates.doctor) body.doctor = updates.doctor;
        if (updates.estado) body.estado = updates.estado;
        if (updates.gabinete) body.gabinete = updates.gabinete;
        if (updates.notas !== undefined) body.notas = updates.notas;
        if (nuevaFecha) body.fecha = dateToISO(nuevaFecha);

        const row = await dbUpdate<any>('citas_web', id, body);
        if (row) logAudit({ action: 'UPDATE_CITA', entity_type: 'cita', entity_id: id, details: body });
        return row ? { id, ...updates } as Cita : null;
    } else {
        // Cita GELITE — crear override en citas_web
        const body: any = {
            id_cita_gelite: id,
            nombre: updates.nombrePaciente || '',
            fecha: nuevaFecha ? dateToISO(nuevaFecha) : dateToISO(new Date()),
            hora: (updates.horaInicio || '00:00') + ':00',
            duracion_min: updates.duracionMinutos || 30,
            tratamiento: updates.tratamiento || '',
            doctor: updates.doctor || '',
            estado: updates.estado || 'planificada',
            gabinete: updates.gabinete || 'G1',
            notas: updates.notas || '',
        };
        const row = await dbInsert<any>('citas_web', body);
        return row ? { id, ...updates } as Cita : null;
    }
};

/** Actualiza solo el estado de una cita */
export const updateEstadoCita = async (id: string, estado: EstadoCita): Promise<boolean> => {
    if (!isDbConfigured()) return true;

    const isUuid = id.includes('-');
    if (isUuid) {
        const row = await dbUpdate<any>('citas_web', id, { estado });
        return !!row;
    } else {
        // Para citas GELITE, crear/actualizar override
        const existing = await dbSelect<any>('citas_web', {
            id_cita_gelite: `eq.${id}`, limit: '1'
        });
        if (existing.length > 0) {
            await dbUpdate<any>('citas_web', existing[0].id, { estado });
        } else {
            await dbInsert<any>('citas_web', {
                id_cita_gelite: id,
                fecha: dateToISO(new Date()),
                hora: '00:00:00',
                estado,
            });
        }
        logAudit({ action: 'UPDATE_ESTADO_CITA', entity_type: 'cita', entity_id: id, details: { estado } });
        return true;
    }
};

/** Soft-delete de una cita */
export const deleteCita = async (id: string): Promise<boolean> => {
    if (!isDbConfigured()) return true;

    const isUuid = id.includes('-');
    if (isUuid) {
        const row = await dbUpdate<any>('citas_web', id, { deleted: true });
        return !!row;
    } else {
        // Para citas GELITE, marcar como eliminada via override
        const existing = await dbSelect<any>('citas_web', {
            id_cita_gelite: `eq.${id}`, limit: '1'
        });
        if (existing.length > 0) {
            await dbUpdate<any>('citas_web', existing[0].id, { deleted: true });
        } else {
            await dbInsert<any>('citas_web', {
                id_cita_gelite: id,
                fecha: dateToISO(new Date()),
                hora: '00:00:00',
                deleted: true,
            });
        }
        logAudit({ action: 'DELETE_CITA', entity_type: 'cita', entity_id: id });
        return true;
    }
};

/** Lee citas creadas/editadas desde web para una fecha */
export const getCitasWeb = async (fecha: Date): Promise<Cita[]> => {
    if (!isDbConfigured()) return [];
    const fechaStr = dateToISO(fecha);
    const rows = await dbSelect<any>('citas_web', {
        fecha: `eq.${fechaStr}`,
        deleted: 'eq.false',
        order: 'hora.asc',
    });
    return rows.map((r: any): Cita => ({
        id: r.id,
        pacienteNumPac: r.num_pac ?? '',
        nombrePaciente: r.nombre ?? 'Paciente',
        gabinete: r.gabinete ?? 'G1',
        horaInicio: (r.hora ?? '00:00').substring(0, 5),
        duracionMinutos: r.duracion_min ?? 30,
        tratamiento: r.tratamiento ?? 'Control',
        categoria: tratamientoToCategoria(r.tratamiento),
        estado: r.estado ?? 'planificada',
        doctor: r.doctor ?? '',
        alertasMedicas: [],
        alertasLegales: [],
        alertasFinancieras: false,
        notas: r.notas ?? '',
    }));
};


// ─── TtosMed — Entradas Médicas reales de GELITE ─────────────────────────────
interface TtosMedRow {
    IdPac?: number;
    NumTto?: number;
    IdTto?: number;
    StaTto?: number;        // 5 = realizado
    FecIni?: string;        // ISO date string
    FecFin?: string;
    IdCol?: number;         // ID colaborador/doctor
    IdUser?: number;
    Notas?: string;         // nota clínica real
    Importe?: string | number;  // text from FDW CAST
    PiezasAdu?: number;     // pieza dental adultos
    IdTipoEspec?: number;   // categoría especialidad
    CId?: string;           // 'EntradaMedicaTratamiento' | 'EntradaMedicaEconomica'
}

// IdCol → nombre doctor (extraído de GELITE.mdf TColabos — página 277)
const DOCTOR_MAP: Record<number, string> = {
    1: 'Lucia Guillén',      // 001 LUCIA GUILLEN ABASOLO
    2: 'Dr. Mario Rubio',    // 002 MARIO RUBIO GARCIA  ← Dr. principal
    3: 'Dra. Irene García',  // 003 IRENE GARCIA SANZ   ← Dra. principal
    4: 'Lydia Abalos',       // 004
    5: 'Águeda Díaz',        // 005
    6: 'Primeras Visitas',   // 006
    7: 'José Manuel Rizo',   // 007
    8: 'María Manzano',      // 008
    9: 'Fátima Regodon',     // 009
    10: 'Juan Antonio',       // 010 JUAN ANTONIO MANZANEDO
    11: 'Vivian Martínez',    // 011 VIVIAN MARTINEZ PEREZ
    12: 'Carolina Nieto',     // 012
    13: 'Marta Pérez',        // 013
    14: 'Patricia López',     // 014
    15: 'Yolanda Ballesteros',// 015
    16: 'Virginia Tresgallo', // 016
    17: 'Ignacio Ferrero',    // 017
    18: 'Miriam Carrasco',    // 018
    21: 'Borja Galera',       // 021
    22: 'Alicia',             // 022
    23: 'Tatiana Martín',     // 023
    24: 'Daniel González',    // 024
};

/** Caché dinámica de colaboradores cargados de Supabase */
let _colabosCache: Record<number, string> | null = null;

/**
 * Obtiene el nombre del colaborador buscando primero en TColabos (Supabase),
 * luego en el mapa estático extraído del MDF.
 */
export const getColaboradorNombre = async (idCol?: number): Promise<string> => {
    if (!idCol) return 'Sin asignar';

    // Cargar caché si aún no existe
    if (!_colabosCache && isDbConfigured()) {
        try {
            const rows = await dbSelect<{ IdCol: number; Alias: string; Nombre: string; Apellidos: string }>('TColabos', {
                select: 'IdCol,Alias,Nombre,Apellidos',
                order: 'IdCol.asc',
                limit: '100',
            });
            _colabosCache = {};
            for (const r of rows) {
                const nombre = [r.Nombre, r.Apellidos].filter(Boolean).join(' ').trim() || r.Alias || '';
                if (nombre) _colabosCache[r.IdCol] = nombre;
            }
        } catch {
            _colabosCache = {};
        }
    }

    if (_colabosCache && _colabosCache[idCol]) return _colabosCache[idCol];
    return DOCTOR_MAP[idCol] ?? `Col. ${idCol}`;
};


// IdTipoEspec → especialidad
const ESPEC_MAP: Record<number, string> = {
    1: 'Odontología General', 2: 'Ortodoncia', 3: 'Implantología',
    4: 'Periodoncia', 5: 'Endodoncia', 6: 'Cirugía Oral', 7: 'Estética Dental',
    8: 'Radiología', 9: 'Prostodoncia', 10: 'Higiene Dental',
    19: 'Odontología General', 42: 'Urgencia',
};

const isoToLabel = (iso?: string): string => {
    if (!iso) return 'Fecha desconocida';
    try {
        return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return iso; }
};

/**
 * LOG-01 FIX: normalizar DATETIME de GELITE (hora local española CET/CEST) a UTC.
 * SQL Server guarda DATETIME en hora local sin timezone info.
 * Sin esto, notas escritas tras medianoche aparecen en el día anterior en la UI.
 */
const geliteToUTC = (fechaGelite?: string): string => {
    if (!fechaGelite) return '';
    const d = new Date(fechaGelite);
    if (isNaN(d.getTime())) return fechaGelite;
    const month = d.getMonth(); // 0-indexed
    const isSummer = month >= 2 && month <= 9; // CEST=UTC+2, CET=UTC+1
    d.setHours(d.getHours() - (isSummer ? 2 : 1));
    return d.toISOString();
};

/**
 * Lee las entradas médicas clínicas reales (TtosMed) de un paciente por IdPac.
 * Solo devuelve EntradaMedicaTratamiento, no las económicas.
 */
export const getEntradasMedicas = async (
    idPac: number
): Promise<import('../types').SOAPNote[]> => {
    if (!isDbConfigured() || !idPac) return [];
    // VLN-009 AUDIT: registrar acceso a historial clínico (dato de salud Art.9 RGPD)
    logAudit({ action: 'VIEW_HISTORIA_CLINICA', entity_type: 'TtosMed', entity_id: String(idPac) });
    try {
        const rows = await dbSelect<TtosMedRow>('TtosMed', {
            IdPac: `eq.${idPac}`,
            order: 'FecIni.desc',
            limit: '200',
        });

        // Solo entradas clínicas, no económicas
        const clinicas = rows.filter(r =>
            r.CId === 'EntradaMedicaTratamiento' || (!r.CId && !!r.Notas)
        );

        return clinicas.map((r, idx): import('../types').SOAPNote => ({
            id: `ttomed-${r.NumTto ?? idx}`,
            fecha: isoToLabel(r.FecIni),
            doctor: DOCTOR_MAP[r.IdCol ?? 0] ?? `Dr. Col.${r.IdCol ?? '?'}`,
            especialidad: ESPEC_MAP[r.IdTipoEspec ?? 0] ?? 'Odontología General',
            // Tratamiento = nombre de la especialidad/tipo de procedimiento
            tratamiento_nombre: ESPEC_MAP[r.IdTipoEspec ?? 0] ?? undefined,
            // LOG-01: tratamiento_id permite deduplicar correctamente contra soap_notes
            tratamiento_id: r.NumTto ?? undefined,
            // Subjetivo = campo libre de observaciones clínicas (Notas de GELITE)
            subjetivo: r.Notas ?? '',
            objetivo: r.PiezasAdu ? `Pieza ${r.PiezasAdu}` : '',
            analisis: '',
            plan: r.Importe ? `Importe: ${parseFloat(String(r.Importe)).toFixed(2)}€` : '',
            pieza: r.PiezasAdu ?? undefined,
            firmada: r.StaTto === 5,
            eva: 0,
            // LOG-01 FIX: normalizar a UTC para ordenación correcta en la UI
            timestamp: geliteToUTC(r.FecIni),
            alertasDetectadas: [],
        }));
    } catch { return []; }
};



/**
 * INTERVENCIÓN-005 FIX (Tarea 2 Fase 3B)
 * Resuelve NumPac → IdPac consultando la tabla Pacientes del FDW antes
 * de llamar a getEntradasMedicas(idPac).
 *
 * El frontend trabaja con NumPac (NUMPAC visible). TtosMed usa IdPac
 * (clave interna de GELITE). Este puente hace la conversión automática.
 *
 * @param numPac — el NumPac visible en frontend (ej: '4095')
 */
export const getEntradasMedicasByNumPac = async (
    numPac: string
): Promise<import('../types').SOAPNote[]> => {
    if (!isDbConfigured() || !numPac) return [];

    try {
        // Paso 1: Resolver NumPac → IdPac desde la tabla Pacientes (FDW)
        type PacRow = { IdPac?: number; NumPac?: string };
        const pacRows = await dbSelect<PacRow>('Pacientes', {
            NumPac: `eq.${numPac}`,
            select: 'IdPac,NumPac',
            limit: '1',
        });

        const idPac = pacRows?.[0]?.IdPac;
        if (!idPac) {
            logger.warn(`[Citas] getEntradasMedicasByNumPac: no se encontró IdPac para NumPac=${numPac}`);
            return [];
        }

        // Paso 2: Llamar a la función normal con el IdPac resuelto
        return getEntradasMedicas(idPac);
    } catch (e) {
        logger.error('[Citas] getEntradasMedicasByNumPac error:', e);
        return [];
    }
};

/**
 * Alias por compatibilidad con código anterior.
 * INTERVENCIÓN-005 FIX: ahora usa getEntradasMedicasByNumPac cuando
 * idPac no está disponible, en lugar de devolver [] silenciosamente.
 */
export const getHistorialCitasPaciente = async (
    _apellidos: string,
    _nombre: string,
    idPac?: number,
    numPac?: string
): Promise<import('../types').SOAPNote[]> => {
    if (idPac) return getEntradasMedicas(idPac);
    if (numPac) return getEntradasMedicasByNumPac(numPac);
    logger.warn('[Citas] getHistorialCitasPaciente llamado sin idPac ni numPac — retornando []');
    return [];
};

/** Presupuestos (PRESUTTO) agrupados por Id_Presu — para la vista económica */
interface PresuRow {
    IdPac?: number; Id_Presu?: number; FecIni?: string;
    IdTto?: number; StaTto?: number; ImportePre?: string | number; Notas?: string;
}

export const getTratamientosPaciente = async (
    idPac: number
): Promise<{ id: number; fecha: string; tratamientos: string[]; total: number; estado: string }[]> => {
    if (!isDbConfigured() || !idPac) return [];
    try {
        const rows = await dbSelect<PresuRow>('PRESUTTO', {
            IdPac: `eq.${idPac}`, order: 'FecIni.desc', limit: '200',
        });
        const byPresu = new Map<number, { fecha: string; tratamientos: string[]; total: number; estado: string }>();
        for (const r of rows) {
            const pid = r.Id_Presu ?? 0;
            const fecha = r.FecIni ? isoToLabel(r.FecIni.slice(0, 10)) : 'Fecha desconocida';
            const entry = byPresu.get(pid) ?? { fecha, tratamientos: [], total: 0, estado: r.StaTto === 7 ? 'Realizado' : 'Planificado' };
            if (r.Notas) entry.tratamientos.push(r.Notas);
            entry.total += parseFloat(String(r.ImportePre ?? 0)) || 0;
            byPresu.set(pid, entry);
        }
        return Array.from(byPresu.entries()).map(([id, v]) => ({ id, ...v }));
    } catch { return []; }
};

export { isDbConfigured };
