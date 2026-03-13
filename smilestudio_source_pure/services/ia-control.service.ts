// ─────────────────────────────────────────────────────────────────
//  services/ia-control.service.ts
//  Control del agente IA por conversación de WhatsApp.
//  Lee/escribe en la tabla ia_whatsapp_control de Supabase.
// ─────────────────────────────────────────────────────────────────

import { dbSelect, dbUpsert, isDbConfigured } from './db';

const PAUSE_MINUTES = 5;

export interface IAControlStatus {
    iaActive: boolean;
    pausedAt: string | null;
    autoResumeAt: string | null;
    minutesLeft: number | null; // Minutos restantes para auto-reanudación
}

/**
 * Obtiene el estado actual del agente IA para una conversación.
 * Si no hay registro en BD, se considera IA activa por defecto.
 */
export const getIAStatus = async (conversationId: string | number): Promise<IAControlStatus> => {
    if (!isDbConfigured()) return { iaActive: true, pausedAt: null, autoResumeAt: null, minutesLeft: null };

    try {
        const rows = await dbSelect<{ ia_active: boolean; paused_at: string | null; auto_resume_at: string | null }>('ia_whatsapp_control', {
            conversation_id: `eq.${conversationId}`,
            select: 'ia_active,paused_at,auto_resume_at',
        });

        if (!rows || rows.length === 0) return { iaActive: true, pausedAt: null, autoResumeAt: null, minutesLeft: null };

        const row = rows[0] as { ia_active: boolean; paused_at: string | null; auto_resume_at: string | null };

        let minutesLeft: number | null = null;
        let iaActive = row.ia_active;

        // Si está pausada, calcular tiempo restante o auto-reanudar
        if (!iaActive && row.auto_resume_at) {
            const resumeTime = new Date(row.auto_resume_at).getTime();
            const now = Date.now();
            if (resumeTime <= now) {
                // Ya pasaron los 5 min → reactivar
                await resumeIA(String(conversationId));
                iaActive = true;
            } else {
                minutesLeft = Math.ceil((resumeTime - now) / 60000);
            }
        }

        return { iaActive, pausedAt: row.paused_at, autoResumeAt: row.auto_resume_at, minutesLeft };
    } catch {
        return { iaActive: true, pausedAt: null, autoResumeAt: null, minutesLeft: null };
    }
};

/**
 * Pausa el agente IA para una conversación durante PAUSE_MINUTES minutos.
 * Pasado ese tiempo, la Edge Function lo reactivará automáticamente.
 */
export const pauseIA = async (conversationId: string | number, pausedBy?: string): Promise<boolean> => {
    if (!isDbConfigured()) return false;

    const now = new Date();
    const autoResumeAt = new Date(now.getTime() + PAUSE_MINUTES * 60 * 1000);

    try {
        const result = await dbUpsert('ia_whatsapp_control', {
            conversation_id: String(conversationId),
            ia_active: false,
            paused_at: now.toISOString(),
            paused_by: pausedBy ?? 'manual',
            auto_resume_at: autoResumeAt.toISOString(),
            updated_at: now.toISOString(),
        }, 'conversation_id');
        return result !== null;
    } catch {
        return false;
    }
};

/**
 * Reactiva el agente IA para una conversación (manual o automático).
 */
export const resumeIA = async (conversationId: string | number): Promise<boolean> => {
    if (!isDbConfigured()) return false;

    try {
        const result = await dbUpsert('ia_whatsapp_control', {
            conversation_id: String(conversationId),
            ia_active: true,
            paused_at: null,
            paused_by: null,
            auto_resume_at: null,
            updated_at: new Date().toISOString(),
        }, 'conversation_id');
        return result !== null;
    } catch {
        return false;
    }
};
