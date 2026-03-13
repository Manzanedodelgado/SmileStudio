// ─────────────────────────────────────────────────────────────────
//  services/audit.service.ts
//  V-005 FIX: Audit Trail para cumplimiento RGPD (Art. 30).
//  Registra accesos, modificaciones y eliminaciones de datos clínicos.
// ─────────────────────────────────────────────────────────────────
import { dbInsert, dbSelect, isDbConfigured } from './db';

// ── Tipos de acción ───────────────────────────────────────────────
export type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'VIEW_PATIENT'
    | 'SEARCH_PATIENT'
    | 'CREATE_CITA'
    | 'UPDATE_CITA'
    | 'DELETE_CITA'
    | 'UPDATE_ESTADO_CITA'
    | 'SAVE_ODONTOGRAMA'
    | 'CREATE_SOAP_NOTE'
    | 'UPDATE_SOAP_NOTE'
    | 'SAVE_CONFIG'
    | 'UPDATE_STOCK'           // B-06 FIX: acción semántica propia para ajustes de stock
    | 'ADD_ALLERGY'
    | 'DELETE_ALLERGY'
    | 'ADD_MEDICATION'
    | 'DELETE_MEDICATION'
    | 'AI_QUERY'
    | 'AI_ANALYZE_ODONTOGRAMA'
    | 'EXPORT_DATA'
    | 'VIEW_GESTORIA'
    | 'VIEW_HISTORIA_CLINICA'
    // ── SPRINT 3: Documentos y consentimientos (RGPD Art. 30) ─────────
    | 'GENERATE_DOCUMENT'      // Profesional crea un nuevo documento para paciente
    | 'SIGN_DOCUMENT'          // Paciente/tutor firma un documento de consentimiento
    | 'VIEW_DOCUMENT'          // Profesional visualiza un documento firmado
    | 'REVOKE_CONSENT';        // Paciente revoca su consentimiento (RGPD Art. 7.3)

export interface AuditEntry {
    action: AuditAction;
    entity_type?: string;
    entity_id?: string;
    details?: Record<string, any>;
}

interface AuditRow {
    id: string;
    user_id: string;
    user_email: string;
    user_role: string;
    action: string;
    entity_type: string;
    entity_id: string;
    details: any;
    created_at: string;
}

// ── Contexto del usuario actual ───────────────────────────────────
let currentUser: { id: string; email: string; role: string } | null = null;

export const setAuditUser = (user: { id: string; email: string; role: string }) => {
    currentUser = user;
};

export const clearAuditUser = () => {
    currentUser = null;
};

// ── Registrar acción ──────────────────────────────────────────────
/**
 * Registra una acción en el audit log.
 * Fire-and-forget: no bloquea ni lanza errores al caller.
 */
export const logAudit = (entry: AuditEntry): void => {
    if (!isDbConfigured()) return;

    // No await — fire-and-forget para no bloquear la UI
    dbInsert<AuditRow>('audit_log', {
        user_id: currentUser?.id ?? 'anonymous',
        user_email: currentUser?.email ?? 'unknown',
        user_role: currentUser?.role ?? 'unknown',
        action: entry.action,
        entity_type: entry.entity_type ?? '',
        entity_id: entry.entity_id ?? '',
        details: entry.details ?? {},
    } as any).catch(e => {
        console.warn('[Audit] Error logging:', e);
    });
};

// ── Consultas (para panel admin) ──────────────────────────────────

/**
 * Obtiene los últimos N registros del audit log.
 */
export const getAuditLog = async (limit: number = 50): Promise<AuditRow[]> => {
    if (!isDbConfigured()) return [];
    try {
        return await dbSelect<AuditRow>('audit_log', {
            order: 'created_at.desc',
            limit: String(limit),
        });
    } catch {
        return [];
    }
};

/**
 * Obtiene el audit log filtrado por paciente.
 */
export const getAuditByPatient = async (numPac: string): Promise<AuditRow[]> => {
    if (!isDbConfigured()) return [];
    try {
        return await dbSelect<AuditRow>('audit_log', {
            entity_type: 'eq.paciente',
            entity_id: `eq.${numPac}`,
            order: 'created_at.desc',
            limit: '100',
        });
    } catch {
        return [];
    }
};
