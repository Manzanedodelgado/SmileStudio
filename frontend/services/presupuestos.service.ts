// ─────────────────────────────────────────────────────────────────
//  services/presupuestos.service.ts
//  Lee presupuestos de GELITE FDW.
//
//  ESTRUCTURA REAL DE GELITE:
//  - dbo.PresuTTo (→ FDW: PRESUTTO) = LÍNEAS del presupuesto.
//    El campo Id_Presu agrupa todas las líneas de un mismo presupuesto.
//    No hay tabla de cabecera separada en el FDW actual.
//    StaTto: 0=Pendiente, 1=En tratamiento, 2=Finalizado, 5=Anulado
//    Diente: pieza dental en formato FDI o texto
//
//  - La aceptación/rechazo se registra en Supabase nativa
//    (presupuestos_estados_web) porque GELITE FDW es READ ONLY.
// ─────────────────────────────────────────────────────────────────
import { dbSelect, dbInsert, isDbConfigured, generateId } from './db';
import { logAudit } from './audit.service';
import { logger } from './logger';

// ── Tipos FDW GELITE — Columnas reales de dbo.PresuTTo ───────────

interface PresupuestoLineaRow {
    Ident: string;            // ID único de la línea (PK)
    Id_Presu: string;         // ID del presupuesto agrupador
    IdPac: string;            // FK Pacientes.IdPac
    Orden?: string;           // Orden de la línea
    IdTto?: string;           // FK catálogo tratamientos GELITE
    StaTto?: string;          // 0=Pendiente, 1=En tto, 2=Finalizado, 5=Anulado
    FecIni?: string;          // Fecha inicio
    IdTratamiento?: string;   // ID tipo tratamiento
    IdColabo?: string;        // FK TColabos — doctor
    Diente?: string;          // Pieza dental (FDI o texto)
    ImportePre?: string;      // Precio presupuestado
    Importe?: string;         // Importe cobrado
    Notas?: string;
    BaseImponible?: string;
    TpcIVA?: string;
    ImporteIVA?: string;
}

// ── Tipo tabla de estados web (Supabase nativa) ───────────────────

interface EstadoWebRow {
    id: string;
    id_pre: number;
    num_pac: string;
    estado: string;
    fecha_aceptacion?: string;
    aceptado_por?: string;
    created_at?: string;
}

// ── Tipos públicos ────────────────────────────────────────────────

export interface LineaPresupuesto {
    id: string;               // Ident
    idPre: number;            // Id_Presu convertido a number
    descripcion: string;      // Notas o IdTto como fallback
    pieza?: string;           // Diente (FDI o texto, ej: "26", "Arcada sup")
    precioPresupuesto: number;
    importeCobrado: number;
    estado: 'Pendiente' | 'En tratamiento' | 'Finalizado' | 'Anulado';
    fecha?: string;
}

export interface Presupuesto {
    id: number;               // Id_Presu
    idPac: string;            // IdPac de GELITE
    lineas: LineaPresupuesto[];
    importeTotal: number;     // Suma de ImportePre de las líneas
    importeCobrado: number;   // Suma de Importe cobrado
    importePendiente: number;
    lineasPendientes: number;
    lineasFinalizadas: number;
    estado: 'Pendiente' | 'Aceptado' | 'En curso' | 'Finalizado' | 'Rechazado' | 'Caducado';
    estadoWeb?: string;       // Override desde presupuestos_estados_web
    fechaInicio?: string;     // FecIni de la primera línea
}

// ── Helpers ───────────────────────────────────────────────────────

const staToEstado = (sta?: string): LineaPresupuesto['estado'] => {
    switch (sta) {
        case '1': return 'En tratamiento';
        case '2': return 'Finalizado';
        case '5': return 'Anulado';
        default: return 'Pendiente';
    }
};

const parseEstado = (e?: string): Presupuesto['estado'] => {
    switch (e) {
        case 'Aceptado': return 'Aceptado';
        case 'En curso': return 'En curso';
        case 'Finalizado': return 'Finalizado';
        case 'Rechazado': return 'Rechazado';
        case 'Caducado': return 'Caducado';
        default: return 'Pendiente';
    }
};

const rowToLinea = (r: PresupuestoLineaRow): LineaPresupuesto => ({
    id: r.Ident,
    idPre: Number(r.Id_Presu),
    descripcion: r.Notas?.trim() || r.IdTratamiento || r.IdTto || `Tratamiento ${r.Ident}`,
    pieza: r.Diente ?? undefined,
    precioPresupuesto: parseFloat(r.ImportePre ?? '0') || 0,
    importeCobrado: parseFloat(r.Importe ?? '0') || 0,
    estado: staToEstado(r.StaTto),
    fecha: r.FecIni,
});

const agruparEnPresupuesto = (
    lineas: LineaPresupuesto[],
    estadoOverride?: string,
): Presupuesto => {
    const idPre = lineas[0]?.idPre ?? 0;
    const total = lineas.reduce((s, l) => s + l.precioPresupuesto, 0);
    const cobrado = lineas.reduce((s, l) => s + l.importeCobrado, 0);
    const pendientes = lineas.filter(l => l.estado === 'Pendiente').length;
    const finalizadas = lineas.filter(l => l.estado === 'Finalizado').length;
    const todasFinalizadas = finalizadas === lineas.length && lineas.length > 0;
    const algunaEnTto = lineas.some(l => l.estado === 'En tratamiento');

    let estado: Presupuesto['estado'];
    if (estadoOverride) {
        estado = parseEstado(estadoOverride);
    } else if (todasFinalizadas) {
        estado = 'Finalizado';
    } else if (algunaEnTto) {
        estado = 'En curso';
    } else {
        estado = 'Pendiente';
    }

    return {
        id: idPre,
        idPac: lineas[0] ? (lineas[0] as unknown as PresupuestoLineaRow & { _idPac: string })._idPac ?? '' : '',
        lineas,
        importeTotal: total,
        importeCobrado: cobrado,
        importePendiente: total - cobrado,
        lineasPendientes: pendientes,
        lineasFinalizadas: finalizadas,
        estado,
        estadoWeb: estadoOverride,
        fechaInicio: lineas[0]?.fecha,
    };
};

// ── API pública ───────────────────────────────────────────────────

/**
 * Carga los presupuestos de un paciente desde GELITE FDW.
 * Filtra por IdPac (GELITE usa IdPac, no NumPac en PRESUTTO).
 * Agrupa las líneas por Id_Presu para construir presupuestos.
 */
export const getPresupuestosByPaciente = async (
    numPac: string,
    idPac?: string,   // Si se conoce el IdPac de GELITE, más eficiente
): Promise<Presupuesto[]> => {
    if (!isDbConfigured() || !numPac) return [];

    try {
        // R3 FIX: Si no hay idPac, resolverlo primero desde la tabla Pacientes.
        // NumPac y IdPac son valores DISTINTOS en GELITE — nunca pueden intercambiarse.
        let idPacResuelto = idPac;
        if (!idPacResuelto) {
            type PacRow = { IdPac?: number };
            const pac = await dbSelect<PacRow>('Pacientes', {
                NumPac: `eq.${numPac}`,
                select: 'IdPac',
                limit: '1',
            }).catch(() => [] as PacRow[]);
            const found = pac[0]?.IdPac;
            if (found) {
                idPacResuelto = String(found);
                logger.info(`[Presupuestos] NumPac=${numPac} → IdPac=${idPacResuelto}`);
            } else {
                logger.warn(`[Presupuestos] No se encontró IdPac para NumPac=${numPac}`);
                return [];
            }
        }
        const filtro = { IdPac: `eq.${idPacResuelto}` };

        const [todasLineas, estadosWeb] = await Promise.all([
            dbSelect<PresupuestoLineaRow>('PRESUTTO', { ...filtro, order: 'Id_Presu.asc,Orden.asc' }),
            dbSelect<EstadoWebRow>('presupuestos_estados_web', { num_pac: `eq.${numPac}` })
                .catch(() => [] as EstadoWebRow[]),
        ]);

        if (todasLineas.length === 0) return [];

        // Mapa de overrides de estado web
        const overrides = new Map<number, string>();
        for (const e of estadosWeb) overrides.set(e.id_pre, e.estado);

        // Agrupar líneas por Id_Presu
        const grupos = new Map<number, LineaPresupuesto[]>();
        const idpacByPresu = new Map<number, string>();

        for (const r of todasLineas) {
            const idPre = Number(r.Id_Presu);
            if (!grupos.has(idPre)) grupos.set(idPre, []);
            const linea = rowToLinea(r);
            grupos.get(idPre)!.push(linea);
            idpacByPresu.set(idPre, r.IdPac);
        }

        // Construir presupuestos
        const presupuestos: Presupuesto[] = [];
        for (const [idPre, lineas] of grupos) {
            const p = agruparEnPresupuesto(lineas, overrides.get(idPre));
            p.idPac = idpacByPresu.get(idPre) ?? '';
            presupuestos.push(p);
        }

        // Más recientes primero
        return presupuestos.sort((a, b) => b.id - a.id);

    } catch (e) {
        logger.error('[Presupuestos] getPresupuestosByPaciente error:', e);
        return [];
    }
};

/**
 * Resumen económico del paciente para los KPIs de Economica.tsx
 */
export const getResumenEconomico = async (numPac: string, idPac?: string) => {
    const pres = await getPresupuestosByPaciente(numPac, idPac);
    const activos = pres.filter(p => p.estado !== 'Rechazado' && p.estado !== 'Caducado');

    return {
        deudaPendiente: activos.reduce((s, p) => s + p.importePendiente, 0),
        totalPresupuestado: activos.reduce((s, p) => s + p.importeTotal, 0),
        totalCobrado: activos.reduce((s, p) => s + p.importeCobrado, 0),
        presupuestosCount: activos.length,
    };
};

/**
 * Acepta un presupuesto: guarda override en presupuestos_estados_web + audit trail.
 * NOTA: No escribe en GELITE (FDW read-only).
 */
export const aceptarPresupuesto = async (
    idPre: number,
    numPac: string,
    usuarioEmail: string,
): Promise<boolean> => {
    if (!isDbConfigured()) {
        logger.warn('[Presupuestos] BD no configurada — aceptación solo en memoria');
        return false;
    }

    try {
        await dbInsert<EstadoWebRow>('presupuestos_estados_web', {
            id: generateId(),
            id_pre: idPre,
            num_pac: numPac,
            estado: 'Aceptado',
            fecha_aceptacion: new Date().toISOString().split('T')[0],
            aceptado_por: usuarioEmail,
        });

        logAudit({
            action: 'SIGN_DOCUMENT',
            entity_type: 'presupuesto',
            entity_id: String(idPre),
            details: { numPac, accion: 'Aceptado', usuario: usuarioEmail },
        });

        return true;
    } catch (e) {
        logger.error('[Presupuestos] aceptarPresupuesto error:', e);
        return false;
    }
};

/**
 * Rechaza un presupuesto: override en presupuestos_estados_web.
 */
export const rechazarPresupuesto = async (
    idPre: number,
    numPac: string,
    usuarioEmail: string,
): Promise<boolean> => {
    if (!isDbConfigured()) return false;

    try {
        await dbInsert<EstadoWebRow>('presupuestos_estados_web', {
            id: generateId(),
            id_pre: idPre,
            num_pac: numPac,
            estado: 'Rechazado',
            aceptado_por: usuarioEmail,
        });

        logAudit({
            action: 'SIGN_DOCUMENT',
            entity_type: 'presupuesto',
            entity_id: String(idPre),
            details: { numPac, accion: 'Rechazado', usuario: usuarioEmail },
        });

        return true;
    } catch (e) {
        logger.error('[Presupuestos] rechazarPresupuesto error:', e);
        return false;
    }
};
