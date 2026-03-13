// ═══════════════════════════════════════════════════════
//  Centinela — Types
//  Sistema de monitorización de errores para SmileStudio
// ═══════════════════════════════════════════════════════

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

export type ProcessStatus = 'healthy' | 'degraded' | 'failing' | 'offline';

export type SmileStudioModule =
    | 'agenda'
    | 'pacientes'
    | 'facturacion'
    | 'contabilidad'
    | 'whatsapp'
    | 'ia'
    | 'imagen'
    | 'auth'
    | 'sistema';

export interface CentinelaError {
    id: string;
    timestamp: number;
    severity: ErrorSeverity;
    module: SmileStudioModule;
    message: string;
    stack?: string;
    context?: Record<string, unknown>;
    source: 'runtime' | 'promise' | 'console' | 'network' | 'simulated';
    handled: boolean;
    occurrences: number;
    firstSeen: number;
    lastSeen: number;
    fingerprint: string;
}

export interface ProcessHealth {
    module: SmileStudioModule;
    label: string;
    icon: string;
    status: ProcessStatus;
    uptime: number;           // percentage 0-100
    errorsLast5Min: number;
    lastError?: string;
    lastChecked: number;
    responseTime?: number;    // ms
}

export interface CentinelaStats {
    totalErrors: number;
    criticalCount: number;
    unhandledCount: number;
    errorsPerMinute: number;
    systemHealth: ProcessStatus;
    uptimePercent: number;
    moduleHealthMap: Record<SmileStudioModule, ProcessHealth>;
}

export interface CentinelaConfig {
    maxErrors: number;
    deduplicateWindow: number;  // ms
    autoMarkHandledAfter: number; // ms, 0 = never
    severityWeights: Record<ErrorSeverity, number>;
}

export const MODULE_LABELS: Record<SmileStudioModule, { label: string; icon: string }> = {
    agenda: { label: 'Agenda', icon: '📅' },
    pacientes: { label: 'Pacientes', icon: '🧑‍⚕️' },
    facturacion: { label: 'Facturación', icon: '🧾' },
    contabilidad: { label: 'Contabilidad', icon: '📊' },
    whatsapp: { label: 'WhatsApp', icon: '💬' },
    ia: { label: 'IA Asistente', icon: '🤖' },
    imagen: { label: 'Imagen Médica', icon: '🏥' },
    auth: { label: 'Autenticación', icon: '🔐' },
    sistema: { label: 'Sistema', icon: '⚙️' },
};

export const SEVERITY_CONFIG: Record<ErrorSeverity, { label: string; color: string; weight: number }> = {
    critical: { label: 'Crítico', color: '#ef4444', weight: 100 },
    error: { label: 'Error', color: '#f97316', weight: 50 },
    warning: { label: 'Aviso', color: '#eab308', weight: 10 },
    info: { label: 'Info', color: '#3b82f6', weight: 1 },
};
