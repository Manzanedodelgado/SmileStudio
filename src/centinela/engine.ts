// ═══════════════════════════════════════════════════════
//  CentinelaEngine — Motor principal de captura de errores
// ═══════════════════════════════════════════════════════

import type {
    CentinelaError, CentinelaStats, CentinelaConfig,
    ProcessHealth, SmileStudioModule, ErrorSeverity, ProcessStatus
} from './types';
import { MODULE_LABELS, SEVERITY_CONFIG } from './types';

type Listener = (errors: CentinelaError[], stats: CentinelaStats) => void;

let idCounter = 0;
function genId(): string {
    return `err-${Date.now()}-${++idCounter}`;
}

function generateFingerprint(message: string, module: SmileStudioModule): string {
    const clean = message.replace(/\d+/g, 'N').replace(/0x[a-f0-9]+/gi, '0xN').trim();
    return `${module}::${clean}`.slice(0, 120);
}

const DEFAULT_CONFIG: CentinelaConfig = {
    maxErrors: 500,
    deduplicateWindow: 5000,
    autoMarkHandledAfter: 0,
    severityWeights: { critical: 100, error: 50, warning: 10, info: 1 },
};

export class CentinelaEngine {
    private static instance: CentinelaEngine | null = null;

    private errors: CentinelaError[] = [];
    private listeners: Set<Listener> = new Set();
    private config: CentinelaConfig;
    private processHealth: Map<SmileStudioModule, ProcessHealth> = new Map();
    private errorTimestamps: number[] = [];
    private originalConsoleError: typeof console.error;
    private installed = false;

    private constructor(config: Partial<CentinelaConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.originalConsoleError = console.error.bind(console);
        this.initProcessHealth();
        this.loadFromStorage();
    }

    static getInstance(config?: Partial<CentinelaConfig>): CentinelaEngine {
        if (!CentinelaEngine.instance) {
            CentinelaEngine.instance = new CentinelaEngine(config);
        }
        return CentinelaEngine.instance;
    }

    // ─── Interceptors ─────────────────────────────────

    install(): void {
        if (this.installed) return;
        this.installed = true;

        // Global error handler
        window.onerror = (message, _source, _lineno, _colno, error) => {
            this.captureError({
                message: String(message),
                stack: error?.stack,
                severity: 'error',
                module: 'sistema',
                source: 'runtime',
            });
        };

        // Unhandled promise rejections
        window.onunhandledrejection = (event) => {
            const reason = event.reason;
            this.captureError({
                message: reason instanceof Error ? reason.message : String(reason),
                stack: reason instanceof Error ? reason.stack : undefined,
                severity: 'error',
                module: 'sistema',
                source: 'promise',
            });
        };

        // Patch console.error
        console.error = (...args: unknown[]) => {
            this.originalConsoleError(...args);
            const message = args.map((a) =>
                a instanceof Error ? a.message : typeof a === 'string' ? a : JSON.stringify(a)
            ).join(' ');
            this.captureError({
                message,
                stack: args.find(a => a instanceof Error)?.stack,
                severity: 'warning',
                module: 'sistema',
                source: 'console',
            });
        };
    }

    uninstall(): void {
        if (!this.installed) return;
        this.installed = false;
        window.onerror = null;
        window.onunhandledrejection = null;
        console.error = this.originalConsoleError;
    }

    // ─── Error Capture ────────────────────────────────

    captureError(opts: {
        message: string;
        stack?: string;
        severity: ErrorSeverity;
        module: SmileStudioModule;
        source: CentinelaError['source'];
        context?: Record<string, unknown>;
    }): CentinelaError {
        const now = Date.now();
        const fingerprint = generateFingerprint(opts.message, opts.module);

        // Deduplicate
        const existing = this.errors.find(
            (e) => e.fingerprint === fingerprint && (now - e.lastSeen) < this.config.deduplicateWindow
        );

        if (existing) {
            existing.occurrences++;
            existing.lastSeen = now;
            this.updateProcessHealth(opts.module, opts.severity);
            this.notifyListeners();
            this.saveToStorage();
            return existing;
        }

        const error: CentinelaError = {
            id: genId(),
            timestamp: now,
            severity: opts.severity,
            module: opts.module,
            message: opts.message,
            stack: opts.stack,
            context: opts.context,
            source: opts.source,
            handled: false,
            occurrences: 1,
            firstSeen: now,
            lastSeen: now,
            fingerprint,
        };

        this.errors.unshift(error);
        this.errorTimestamps.push(now);

        // Trim buffer
        if (this.errors.length > this.config.maxErrors) {
            this.errors = this.errors.slice(0, this.config.maxErrors);
        }

        // Trim recent timestamps (keep last 5 min)
        const fiveMinAgo = now - 300000;
        this.errorTimestamps = this.errorTimestamps.filter(t => t > fiveMinAgo);

        this.updateProcessHealth(opts.module, opts.severity);
        this.notifyListeners();
        this.saveToStorage();

        return error;
    }

    markHandled(errorId: string): void {
        const error = this.errors.find(e => e.id === errorId);
        if (error) {
            error.handled = true;
            this.notifyListeners();
            this.saveToStorage();
        }
    }

    markAllHandled(): void {
        this.errors.forEach(e => { e.handled = true; });
        this.notifyListeners();
        this.saveToStorage();
    }

    clearAll(): void {
        this.errors = [];
        this.errorTimestamps = [];
        this.initProcessHealth();
        this.notifyListeners();
        this.saveToStorage();
    }

    // ─── Process Health ───────────────────────────────

    private initProcessHealth(): void {
        const modules: SmileStudioModule[] = [
            'agenda', 'pacientes', 'facturacion', 'contabilidad',
            'whatsapp', 'ia', 'imagen', 'auth', 'sistema'
        ];

        modules.forEach(mod => {
            const info = MODULE_LABELS[mod];
            this.processHealth.set(mod, {
                module: mod,
                label: info.label,
                icon: info.icon,
                status: 'healthy',
                uptime: 100,
                errorsLast5Min: 0,
                lastChecked: Date.now(),
            });
        });
    }

    private updateProcessHealth(module: SmileStudioModule, severity: ErrorSeverity): void {
        const health = this.processHealth.get(module);
        if (!health) return;

        const now = Date.now();
        const recentErrors = this.errors.filter(
            e => e.module === module && (now - e.lastSeen) < 300000
        );
        health.errorsLast5Min = recentErrors.length;
        health.lastChecked = now;
        health.lastError = recentErrors[0]?.message;

        // Determine status based on recent error severity
        const criticals = recentErrors.filter(e => e.severity === 'critical').length;
        const errors = recentErrors.filter(e => e.severity === 'error').length;

        if (criticals > 0) {
            health.status = 'failing';
            health.uptime = Math.max(0, 100 - criticals * 20);
        } else if (errors > 2) {
            health.status = 'degraded';
            health.uptime = Math.max(30, 100 - errors * 10);
        } else if (recentErrors.length > 5) {
            health.status = 'degraded';
            health.uptime = Math.max(50, 100 - recentErrors.length * 5);
        } else {
            health.status = severity === 'critical' ? 'failing' : 'healthy';
            health.uptime = Math.max(70, 100 - recentErrors.length * 3);
        }

        this.processHealth.set(module, health);
    }

    // ─── Stats ────────────────────────────────────────

    getStats(): CentinelaStats {
        const now = Date.now();
        const recentTimestamps = this.errorTimestamps.filter(t => t > now - 60000);
        const errorsPerMinute = recentTimestamps.length;

        const moduleHealthMap = {} as Record<SmileStudioModule, ProcessHealth>;
        this.processHealth.forEach((health, key) => {
            moduleHealthMap[key] = { ...health };
        });

        const statuses = Array.from(this.processHealth.values()).map(h => h.status);
        let systemHealth: ProcessStatus = 'healthy';
        if (statuses.includes('failing')) systemHealth = 'failing';
        else if (statuses.filter(s => s === 'degraded').length >= 2) systemHealth = 'degraded';

        const totalUptime = Array.from(this.processHealth.values())
            .reduce((sum, h) => sum + h.uptime, 0) / this.processHealth.size;

        return {
            totalErrors: this.errors.length,
            criticalCount: this.errors.filter(e => e.severity === 'critical').length,
            unhandledCount: this.errors.filter(e => !e.handled).length,
            errorsPerMinute,
            systemHealth,
            uptimePercent: Math.round(totalUptime),
            moduleHealthMap,
        };
    }

    getErrors(): CentinelaError[] {
        return [...this.errors];
    }

    getProcessHealthList(): ProcessHealth[] {
        return Array.from(this.processHealth.values());
    }

    // ─── Listeners ────────────────────────────────────

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        listener(this.getErrors(), this.getStats());
        return () => { this.listeners.delete(listener); };
    }

    private notifyListeners(): void {
        const errors = this.getErrors();
        const stats = this.getStats();
        this.listeners.forEach(fn => fn(errors, stats));
    }

    // ─── Persistence ──────────────────────────────────

    private saveToStorage(): void {
        try {
            const data = this.errors.slice(0, 100); // Only persist last 100
            localStorage.setItem('centinela_errors', JSON.stringify(data));
        } catch {
            // localStorage full or unavailable
        }
    }

    private loadFromStorage(): void {
        try {
            const data = localStorage.getItem('centinela_errors');
            if (data) {
                this.errors = JSON.parse(data);
            }
        } catch {
            // Ignore parsing errors
        }
    }
}
