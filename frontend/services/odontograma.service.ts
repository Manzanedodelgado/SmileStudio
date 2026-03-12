// ─────────────────────────────────────────────────────────────────
//  services/odontograma.service.ts
//  Persistencia del odontograma en Supabase (tabla odontograma_web).
//  V-009 FIX: Antes el estado se perdía al refrescar.
//  SEC-C01 FIX: Sin credenciales hardcodeadas — solo dbFetch de db.ts.
// ─────────────────────────────────────────────────────────────────
import { dbSelect, dbFetch, isDbConfigured } from './db';
import { logAudit } from './audit.service';

interface OdontogramaRow {
    id: string;
    num_pac: string;
    datos: any;    // JSONB — DienteData[]
    updated_at: string;
}

/**
 * Carga el odontograma de un paciente desde Supabase.
 * Devuelve null si no existe (el componente usará estado por defecto).
 */
export const getOdontograma = async (numPac: string): Promise<any[] | null> => {
    if (!isDbConfigured() || !numPac) return null;

    try {
        const rows = await dbSelect<OdontogramaRow>('odontograma_web', {
            num_pac: `eq.${numPac}`,
            limit: '1',
        });
        if (rows.length > 0 && rows[0].datos) {
            return rows[0].datos;
        }
    } catch (e) {
        console.warn('[Odontograma] Error cargando:', e);
    }
    return null;
};

/**
 * Guarda el odontograma de un paciente.
 * VLN-002 FIX: Usa RPC upsert_odontograma (ON CONFLICT DO UPDATE atómico).
 * Elimina la race condition SELECT-then-INSERT.
 */
export const saveOdontograma = async (numPac: string, datos: any[]): Promise<boolean> => {
    if (!isDbConfigured() || !numPac) return false;

    try {
        // SEC-C01 FIX: Eliminadas credenciales hardcodeadas — usando dbFetch
        // Upsert atómico via RPC — evita race condition entre SELECT e INSERT
        const res = await dbFetch('rpc/upsert_odontograma', {
            method: 'POST',
            body: JSON.stringify({ p_num_pac: numPac, p_datos: datos }),
        });

        if (!res.ok) {
            console.error('[Odontograma] upsert RPC error:', res.status);
            return false;
        }

        logAudit({ action: 'SAVE_ODONTOGRAMA', entity_type: 'paciente', entity_id: numPac });
        return true;
    } catch (e) {
        console.error('[Odontograma] Error guardando:', e);
        return false;
    }
};

