// ─────────────────────────────────────────────────────────────────
//  services/agenda-config.service.ts
//  Carga dinámica de tratamientos, estados y doctores de agenda
//  desde las FDWs: IconoTratAgenda, TSitCita, TUsuAgd + TColabos.
//
//  V-010 FIX: Reemplaza datos hardcoded en Agenda.tsx y SQL CASEs.
// ─────────────────────────────────────────────────────────────────
import { dbSelect, isDbConfigured } from './db';

// ── Tipos ─────────────────────────────────────────────────────────

export interface TratamientoAgenda {
    idIcono: number;
    descripcion: string;
}

export interface EstadoCitaAgenda {
    idSitC: number;
    descripcion: string;
    color: number;
    esAnulada: boolean;
}

export interface DoctorAgenda {
    idUsu: number;
    idCol: number;
    nombre: string;
    nombreCompleto: string;
    color: number;
}

// ── Fallbacks estáticos (solo se usan si la FDW falla) ────────────

const TRATAMIENTOS_FALLBACK: TratamientoAgenda[] = [
    { idIcono: 1, descripcion: 'Control' },
    { idIcono: 2, descripcion: 'Urgencia' },
    { idIcono: 3, descripcion: 'Endodoncia' },
    { idIcono: 4, descripcion: 'Reconstruccion' },
    { idIcono: 5, descripcion: 'Protesis Fija' },
    { idIcono: 6, descripcion: 'Protesis Removible' },
    { idIcono: 7, descripcion: 'Cirugia/Injerto' },
    { idIcono: 8, descripcion: 'Exodoncia' },
    { idIcono: 9, descripcion: 'Periodoncia' },
    { idIcono: 10, descripcion: 'Higiene Dental' },
    { idIcono: 11, descripcion: 'Cirugia de Implante' },
    { idIcono: 12, descripcion: 'Primera Visita' },
    { idIcono: 13, descripcion: 'Ajuste Prot/tto' },
    { idIcono: 14, descripcion: 'Retirar Ortodoncia' },
    { idIcono: 15, descripcion: 'Colocacion Ortodoncia' },
    { idIcono: 16, descripcion: 'Mensualidad Ortodoncia' },
    { idIcono: 17, descripcion: 'Estudio Ortodoncia' },
    { idIcono: 18, descripcion: 'Blanqueamiento' },
    { idIcono: 19, descripcion: 'Rx/escaner' },
];

const ESTADOS_FALLBACK: EstadoCitaAgenda[] = [
    { idSitC: 0, descripcion: 'Planificada', color: 0, esAnulada: false },
    { idSitC: 1, descripcion: 'Anulada', color: 0, esAnulada: true },
    { idSitC: 5, descripcion: 'Finalizada', color: 0, esAnulada: false },
    { idSitC: 7, descripcion: 'Confirmada', color: 0, esAnulada: false },
    { idSitC: 8, descripcion: 'Cancelada', color: 0, esAnulada: true },
];

const DOCTORES_FALLBACK: DoctorAgenda[] = [
    { idUsu: 1, idCol: 2, nombre: 'Dr. Mario Rubio', nombreCompleto: 'Dr. Mario Rubio García', color: 0 },
    { idUsu: 2, idCol: 3, nombre: 'Dra. Irene García', nombreCompleto: 'Dra. Irene García Sanz', color: 0 },
    { idUsu: 3, idCol: 11, nombre: 'Dra. Vivian Martínez', nombreCompleto: 'Dra. Vivian Martínez Pérez', color: 0 },
    { idUsu: 4, idCol: 17, nombre: 'Dr. Ignacio Ferrero', nombreCompleto: 'Dr. Ignacio Ferrero', color: 0 },
    { idUsu: 5, idCol: 1, nombre: 'Lucía Guillén', nombreCompleto: 'Lucía Guillén Abasolo', color: 0 },
    { idUsu: 6, idCol: 18, nombre: 'Miriam Carrasco', nombreCompleto: 'Miriam Carrasco', color: 0 },
];

// ── Caché en memoria ──────────────────────────────────────────────

let _tratamientosCache: TratamientoAgenda[] | null = null;
let _estadosCache: EstadoCitaAgenda[] | null = null;
let _doctoresCache: DoctorAgenda[] | null = null;

// ── Funciones públicas de carga ───────────────────────────────────

/**
 * Carga tratamientos de agenda desde IconoTratAgenda FDW.
 * Resultado cacheado en memoria para evitar llamadas repetidas.
 */
export const getTratamientosAgenda = async (): Promise<TratamientoAgenda[]> => {
    if (_tratamientosCache) return _tratamientosCache;
    if (!isDbConfigured()) return TRATAMIENTOS_FALLBACK;

    try {
        const rows = await dbSelect<{ IdIcono: number; Descripcion: string }>(
            'IconoTratAgenda',
            { select: 'IdIcono,Descripcion', order: 'IdIcono.asc', limit: '50' }
        );
        if (rows.length > 0) {
            _tratamientosCache = rows.map(r => ({
                idIcono: r.IdIcono,
                descripcion: r.Descripcion?.trim() || `Tratamiento ${r.IdIcono}`,
            }));
            return _tratamientosCache;
        }
    } catch (e) {
        console.warn('[AgendaConfig] No se pudo cargar IconoTratAgenda:', e);
    }
    _tratamientosCache = TRATAMIENTOS_FALLBACK;
    return _tratamientosCache;
};

/**
 * Carga estados de cita desde TSitCita FDW.
 */
export const getEstadosCita = async (): Promise<EstadoCitaAgenda[]> => {
    if (_estadosCache) return _estadosCache;
    if (!isDbConfigured()) return ESTADOS_FALLBACK;

    try {
        const rows = await dbSelect<{
            IdSitC: number; Descripcio: string; Color: number;
            FlgAnulada: string; Orden: number;
        }>(
            'TSitCita',
            { select: 'IdSitC,Descripcio,Color,FlgAnulada,Orden', order: 'Orden.asc', limit: '30' }
        );
        if (rows.length > 0) {
            _estadosCache = rows.map(r => ({
                idSitC: r.IdSitC,
                descripcion: r.Descripcio?.trim() || `Estado ${r.IdSitC}`,
                color: r.Color ?? 0,
                esAnulada: r.FlgAnulada === 'S',
            }));
            return _estadosCache;
        }
    } catch (e) {
        console.warn('[AgendaConfig] No se pudo cargar TSitCita:', e);
    }
    _estadosCache = ESTADOS_FALLBACK;
    return _estadosCache;
};

/**
 * Carga doctores de agenda desde TUsuAgd + TColabos FDWs.
 */
export const getDoctoresAgenda = async (): Promise<DoctorAgenda[]> => {
    if (_doctoresCache) return _doctoresCache;
    if (!isDbConfigured()) return DOCTORES_FALLBACK;

    try {
        // Paso 1: Obtener asignaciones de TUsuAgd
        // FDW FIX: 'Nombre' no existe en SQL Server TUsuAgd → solo IdUsu, IdCol, Color, Visible
        const usuAgd = await dbSelect<{
            IdUsu: number; IdCol: number; Color: number; Visible: string;
        }>('TUsuAgd', { select: 'IdUsu,IdCol,Color,Visible', order: 'IdUsu.asc', limit: '30' });

        // Paso 2: Obtener nombres completos de TColabos
        const colabos = await dbSelect<{
            IdCol: number; Alias: string; Nombre: string; Apellidos: string;
        }>('TColabos', { select: 'IdCol,Alias,Nombre,Apellidos', order: 'IdCol.asc', limit: '50' });

        const colMap = new Map<number, string>();
        for (const c of colabos) {
            colMap.set(c.IdCol, [c.Nombre, c.Apellidos].filter(Boolean).join(' ').trim() || c.Alias || '');
        }

        if (usuAgd.length > 0) {
            _doctoresCache = usuAgd
                .filter(u => u.Visible !== 'N')
                .map(u => ({
                    idUsu: u.IdUsu,
                    idCol: u.IdCol,
                    nombre: colMap.get(u.IdCol) || `Doctor ${u.IdUsu}`,
                    nombreCompleto: colMap.get(u.IdCol) || `Doctor ${u.IdUsu}`,
                    color: u.Color ?? 0,
                }));
            return _doctoresCache;
        }
    } catch (e) {
        console.warn('[AgendaConfig] No se pudo cargar TUsuAgd/TColabos:', e);
    }
    _doctoresCache = DOCTORES_FALLBACK;
    return _doctoresCache;
};

/** Invalida toda la caché (útil tras cambios de configuración) */
export const invalidateAgendaConfigCache = (): void => {
    _tratamientosCache = null;
    _estadosCache = null;
    _doctoresCache = null;
};

/**
 * Carga los 3 catálogos en paralelo para inicialización rápida.
 */
export const loadAgendaConfig = async (): Promise<{
    tratamientos: TratamientoAgenda[];
    estados: EstadoCitaAgenda[];
    doctores: DoctorAgenda[];
}> => {
    const [tratamientos, estados, doctores] = await Promise.all([
        getTratamientosAgenda(),
        getEstadosCita(),
        getDoctoresAgenda(),
    ]);
    return { tratamientos, estados, doctores };
};
