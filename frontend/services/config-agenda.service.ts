// ─────────────────────────────────────────────────────────────────
//  services/config-agenda.service.ts
//  Persistencia de configuración de agenda (doctores, horarios,
//  tratamientos) en Supabase tabla config_agenda_web (JSONB).
//  V-007 FIX
// ─────────────────────────────────────────────────────────────────
import { dbSelect, dbInsert, dbUpdate, isDbConfigured } from './db';

interface ConfigAgendaRow {
    id: string;
    clinic_id: string;
    doctores: any[];
    horarios: any[];
    tratamientos: any[];
    updated_at: string;
}

export interface AgendaConfig {
    doctores: any[];
    horarios: any[];
    tratamientos: any[];
}

const CLINIC_ID = 'default';

/**
 * Carga la configuración de agenda guardada.
 * Devuelve null si no hay datos (el componente usará defaults).
 */
export const getConfigAgenda = async (): Promise<AgendaConfig | null> => {
    if (!isDbConfigured()) return null;
    try {
        const rows = await dbSelect<ConfigAgendaRow>('config_agenda_web', {
            clinic_id: `eq.${CLINIC_ID}`,
            limit: '1',
        });
        if (rows.length > 0) {
            return {
                doctores: rows[0].doctores ?? [],
                horarios: rows[0].horarios ?? [],
                tratamientos: rows[0].tratamientos ?? [],
            };
        }
    } catch (e) {
        console.warn('[ConfigAgenda] Error cargando:', e);
    }
    return null;
};

/**
 * Guarda la configuración de agenda (upsert).
 */
export const saveConfigAgenda = async (config: AgendaConfig): Promise<boolean> => {
    if (!isDbConfigured()) return false;
    try {
        const existing = await dbSelect<ConfigAgendaRow>('config_agenda_web', {
            clinic_id: `eq.${CLINIC_ID}`,
            select: 'id',
            limit: '1',
        });
        if (existing.length > 0) {
            const result = await dbUpdate<ConfigAgendaRow>(
                'config_agenda_web', existing[0].id,
                { doctores: config.doctores, horarios: config.horarios, tratamientos: config.tratamientos } as any
            );
            return !!result;
        } else {
            const result = await dbInsert<ConfigAgendaRow>('config_agenda_web', {
                clinic_id: CLINIC_ID,
                doctores: config.doctores,
                horarios: config.horarios,
                tratamientos: config.tratamientos,
            } as any);
            return !!result;
        }
    } catch (e) {
        console.error('[ConfigAgenda] Error guardando:', e);
        return false;
    }
};
