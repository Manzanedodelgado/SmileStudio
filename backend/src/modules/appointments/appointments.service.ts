// ─── Appointments Service — DCitas (GELITE) ─────────────
import prisma from '../../config/database.js';

// ── Helpers: GELITE integer date/time ↔ ISO ──────────────
// GELITE guarda Fecha como entero YYYYMMDD y Hora como segundos desde medianoche

const geliteDateToISO = (d: number | null | undefined): string | null => {
    if (!d) return null;
    const s = String(d);
    if (s.length !== 8) return null;
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
};

const isoToGeliteDate = (iso: string): number => {
    return parseInt(iso.replace(/-/g, ''), 10);
};

const geliteTimeToHHMM = (secs: number | null | undefined): string => {
    if (!secs && secs !== 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// ── Status mapping: GELITE IdSitC → string ───────────────
const STATUS_MAP: Record<number, string> = {
    0: 'scheduled',     // Planificada
    1: 'confirmed',     // Confirmada
    2: 'waiting',       // En sala espera
    3: 'in_progress',   // En consulta
    4: 'completed',     // Finalizada
    5: 'no_show',       // No presentado
    6: 'cancelled',     // Anulada
    7: 'cancelled',     // Cancelada
};

// ── Transform DCitas row → API response ──────────────────
const transformCita = (row: any) => {
    // Extraer nombre del campo Texto (formato "APELLIDOS, Nombre")
    let apellidos = '';
    let nombre = '';
    if (row.Texto) {
        const parts = row.Texto.split(',');
        apellidos = (parts[0] ?? '').trim();
        nombre = (parts[1] ?? '').trim();
    } else if (row.Contacto) {
        apellidos = row.Contacto.trim();
    }

    return {
        id: `${row.IdUsu}-${row.IdOrden}`,
        numPac: row.NUMPAC ?? '',
        apellidos,
        nombre,
        nombreCompleto: [nombre, apellidos].filter(Boolean).join(' ').toUpperCase() || 'PACIENTE',
        fecha: geliteDateToISO(row.Fecha),
        hora: geliteTimeToHHMM(row.Hora),
        duracion: row.Duracion ? Math.round(row.Duracion / 60) : 30,    // GELITE guarda en segundos
        estado: STATUS_MAP[row.IdSitC ?? 0] ?? 'scheduled',
        tratamiento: '',    // Se resolverá con el IdOpc/IdTipoEspec si necesario
        notas: row.NOTAS ?? '',
        movil: row.Movil ?? '',
        doctor: row.IdCol ?? null,
        gabinete: row.IdUsu === 1 ? 'G1' : 'G2',
        box: row.BOX ?? '',
        idCol: row.IdCol,
        idSitC: row.IdSitC,
        idOpc: row.IdOpc,
        contacto: row.Contacto ?? '',
    };
};

export class AppointmentsService {
    /**
     * Lista citas de DCitas con filtros.
     * Soporta: date (YYYY-MM-DD), from/to (rango), page, limit
     */
    static async findAll(query: {
        date?: string;
        from?: string;
        to?: string;
        page?: string;
        limit?: string;
    }) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '200');
        const skip = (page - 1) * limit;
        const where: any = {};

        if (query.date) {
            // Filtrar por día exacto
            where.Fecha = isoToGeliteDate(query.date);
        } else if (query.from && query.to) {
            // Filtrar por rango de fechas
            where.Fecha = {
                gte: isoToGeliteDate(query.from),
                lte: isoToGeliteDate(query.to),
            };
        }

        const [data, total] = await Promise.all([
            prisma.dcitas.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ Fecha: 'asc' }, { Hora: 'asc' }],
            }),
            prisma.dcitas.count({ where }),
        ]);

        return {
            data: data.map(transformCita),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }

    static async findById(idUsu: number, idOrden: number) {
        const row = await prisma.dcitas.findUnique({
            where: { IdUsu_IdOrden: { IdUsu: idUsu, IdOrden: idOrden } },
        });
        if (!row) throw new Error('Cita no encontrada');
        return transformCita(row);
    }
}
