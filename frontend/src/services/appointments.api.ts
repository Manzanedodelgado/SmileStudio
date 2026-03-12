// ─── Frontend API Client — Appointments ─────────────────
// Llama al backend Express /api/appointments
// Producción: gestion.smilestudio.io | Dev: localhost:3000
// ─────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ── Auth helper: incluir JWT si existe ──
function getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

export interface CitaAPI {
    id: string;
    registro: number | null;
    numPac: string;
    apellidos: string;
    nombre: string;
    nombreCompleto: string;
    fecha: string | null;        // 'YYYY-MM-DD'
    hora: string;                // 'HH:MM'
    duracion: number;            // minutos
    estado: string;              // 'Planificada' | 'Anulada' | 'Finalizada' | 'Confirmada' | 'Cancelada'
    tratamiento: string;         // 'Higiene Dental' | 'Endodoncia' | etc.
    odontologo: string;          // 'Dr. Mario Rubio' | etc.
    notas: string;
    movil: string;
    contacto: string;
    gabinete: number;
    box: string;
    fechaAlta: string | null;
    citMod: string | null;
    idCol: number | null;
    idSitC: number | null;
    idIcono: number | null;
    idOpc: string | null;
}

interface AppointmentsResponse {
    success: boolean;
    data: CitaAPI[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

/**
 * Obtiene citas de un día concreto via backend API.
 */
export async function getCitasByDate(fecha: string): Promise<CitaAPI[]> {
    try {
        const res = await fetch(`${API_BASE}/appointments?date=${fecha}&limit=500`, {
            headers: getAuthHeaders(),
        });
        if (!res.ok) {
            console.warn(`[API] Error ${res.status} obteniendo citas`);
            return [];
        }
        const json: AppointmentsResponse = await res.json();
        return json.data ?? [];
    } catch (err) {
        console.error('[API] Error de red obteniendo citas:', err);
        return [];
    }
}

/**
 * Obtiene citas en un rango de fechas (para ventana 6 meses → futuro).
 * Usa paginación para obtener todas.
 */
export async function getCitasRango(from: string, to: string): Promise<CitaAPI[]> {
    const all: CitaAPI[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const res = await fetch(
                `${API_BASE}/appointments?from=${from}&to=${to}&page=${page}&limit=500`,
                { headers: getAuthHeaders() }
            );
            if (!res.ok) break;
            const json: AppointmentsResponse = await res.json();
            all.push(...(json.data ?? []));
            hasMore = page < json.pagination.pages;
            page++;
        } catch {
            break;
        }
    }
    return all;
}

/**
 * Carga la ventana de citas: 6 meses atrás → 1 año futuro.
 */
export async function getCitasVentana(): Promise<CitaAPI[]> {
    const from = new Date();
    from.setMonth(from.getMonth() - 6);
    const to = new Date();
    to.setFullYear(to.getFullYear() + 1);

    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);

    return getCitasRango(fromStr, toStr);
}

/**
 * Formatea un Date como 'YYYY-MM-DD'.
 */
export function dateToISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
