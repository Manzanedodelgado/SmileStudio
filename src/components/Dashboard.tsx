import { useState } from 'react';
import {
    Shield, AlertTriangle, CheckCircle, XCircle, Clock,
    Activity, Zap, Play, Pause, Trash2, Eye, ChevronDown,
    ChevronUp, Search, Filter, Server, Cpu, Database,
    Radio, ArrowUpRight, BarChart3
} from 'lucide-react';
import { useCentinela } from '../hooks/useCentinela';
import type { CentinelaError, ProcessHealth, ErrorSeverity, SmileStudioModule } from '../centinela/types';
import { SEVERITY_CONFIG, MODULE_LABELS } from '../centinela/types';
import ErrorDetail from './ErrorDetail';

// ─── Helpers ──────────────────────────────────────────

function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    if (diff < 1000) return 'ahora';
    if (diff < 60000) return `hace ${Math.floor(diff / 1000)}s`;
    if (diff < 3600000) return `hace ${Math.floor(diff / 60000)}min`;
    return `hace ${Math.floor(diff / 3600000)}h`;
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'healthy': return <CheckCircle size={16} />;
        case 'degraded': return <AlertTriangle size={16} />;
        case 'failing': return <XCircle size={16} />;
        default: return <Server size={16} />;
    }
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'healthy': return 'var(--success-500)';
        case 'degraded': return 'var(--warning-500)';
        case 'failing': return 'var(--danger-500)';
        default: return 'var(--gray-400)';
    }
}

// ─── KPI Card ─────────────────────────────────────────

function KpiCard({ label, value, icon, color, subtitle, pulse }: {
    label: string; value: number | string; icon: React.ReactNode;
    color: string; subtitle?: string; pulse?: boolean;
}) {
    return (
        <div className="kpi-card" style={{ '--kpi-color': color } as React.CSSProperties}>
            <div className={`kpi-card__icon ${pulse ? 'kpi-card__icon--pulse' : ''}`}>
                {icon}
            </div>
            <div className="kpi-card__content">
                <span className="kpi-card__value">{value}</span>
                <span className="kpi-card__label">{label}</span>
                {subtitle && <span className="kpi-card__subtitle">{subtitle}</span>}
            </div>
        </div>
    );
}

// ─── System Status Bar ────────────────────────────────

function SystemStatusBar({ health, uptime }: { health: string; uptime: number }) {
    const statusText = health === 'healthy' ? 'Sistema Saludable' :
        health === 'degraded' ? 'Sistema Degradado' : 'Sistema Crítico';
    const statusEmoji = health === 'healthy' ? '🟢' : health === 'degraded' ? '🟡' : '🔴';

    return (
        <div className={`status-bar status-bar--${health}`}>
            <div className="status-bar__left">
                <span className="status-bar__indicator">{statusEmoji}</span>
                <span className="status-bar__text">{statusText}</span>
                <span className="status-bar__separator">·</span>
                <span className="status-bar__uptime">
                    <Activity size={14} />
                    Uptime: {uptime}%
                </span>
            </div>
            <div className="status-bar__right">
                <Clock size={14} />
                <span>{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
        </div>
    );
}

// ─── Process Health Grid ──────────────────────────────

function ProcessHealthGrid({ processes }: { processes: ProcessHealth[] }) {
    return (
        <div className="process-grid">
            <div className="section-header">
                <div className="section-header__left">
                    <Cpu size={18} />
                    <h2>Salud de Procesos</h2>
                </div>
                <span className="section-header__count">
                    {processes.filter(p => p.status === 'healthy').length}/{processes.length} OK
                </span>
            </div>
            <div className="process-grid__items">
                {processes.map((proc) => (
                    <div key={proc.module} className={`process-card process-card--${proc.status}`}>
                        <div className="process-card__header">
                            <span className="process-card__icon">{proc.icon}</span>
                            <span className="process-card__name">{proc.label}</span>
                            <span className="process-card__status-icon" style={{ color: getStatusColor(proc.status) }}>
                                {getStatusIcon(proc.status)}
                            </span>
                        </div>
                        <div className="process-card__bar">
                            <div
                                className="process-card__bar-fill"
                                style={{
                                    width: `${proc.uptime}%`,
                                    background: getStatusColor(proc.status),
                                }}
                            />
                        </div>
                        <div className="process-card__meta">
                            <span className="process-card__uptime">{proc.uptime}%</span>
                            {proc.errorsLast5Min > 0 && (
                                <span className="process-card__errors">
                                    {proc.errorsLast5Min} err
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Error List ───────────────────────────────────────

function ErrorList({ errors, onSelect, onMarkHandled }: {
    errors: CentinelaError[];
    onSelect: (error: CentinelaError) => void;
    onMarkHandled: (id: string) => void;
}) {
    const [filter, setFilter] = useState<ErrorSeverity | 'all'>('all');
    const [moduleFilter, setModuleFilter] = useState<SmileStudioModule | 'all'>('all');
    const [search, setSearch] = useState('');
    const [showHandled, setShowHandled] = useState(true);

    const filtered = errors.filter(e => {
        if (filter !== 'all' && e.severity !== filter) return false;
        if (moduleFilter !== 'all' && e.module !== moduleFilter) return false;
        if (!showHandled && e.handled) return false;
        if (search && !e.message.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="error-list">
            <div className="section-header">
                <div className="section-header__left">
                    <Database size={18} />
                    <h2>Registro de Errores</h2>
                    <span className="section-header__badge">{filtered.length}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="error-list__filters">
                <div className="error-list__search">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="Buscar error..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="error-list__filter-group">
                    <Filter size={14} />
                    <select value={filter} onChange={e => setFilter(e.target.value as ErrorSeverity | 'all')}>
                        <option value="all">Todas las severidades</option>
                        <option value="critical">🔴 Crítico</option>
                        <option value="error">🟠 Error</option>
                        <option value="warning">🟡 Aviso</option>
                        <option value="info">🔵 Info</option>
                    </select>
                    <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value as SmileStudioModule | 'all')}>
                        <option value="all">Todos los módulos</option>
                        {Object.entries(MODULE_LABELS).map(([key, val]) => (
                            <option key={key} value={key}>{val.icon} {val.label}</option>
                        ))}
                    </select>
                    <label className="error-list__toggle">
                        <input
                            type="checkbox"
                            checked={showHandled}
                            onChange={e => setShowHandled(e.target.checked)}
                        />
                        <span>Mostrar gestionados</span>
                    </label>
                </div>
            </div>

            {/* Error Items */}
            <div className="error-list__items">
                {filtered.length === 0 ? (
                    <div className="error-list__empty">
                        <Shield size={40} />
                        <span>Sin errores registrados</span>
                        <p>El Centinela está vigilando. Todo está en orden.</p>
                    </div>
                ) : (
                    filtered.map((error) => (
                        <div
                            key={error.id}
                            className={`error-item error-item--${error.severity} ${error.handled ? 'error-item--handled' : ''}`}
                            onClick={() => onSelect(error)}
                        >
                            <div
                                className="error-item__severity-bar"
                                style={{ background: SEVERITY_CONFIG[error.severity].color }}
                            />
                            <div className="error-item__content">
                                <div className="error-item__top">
                                    <span className={`error-item__badge error-item__badge--${error.severity}`}>
                                        {SEVERITY_CONFIG[error.severity].label}
                                    </span>
                                    <span className="error-item__module">
                                        {MODULE_LABELS[error.module].icon} {MODULE_LABELS[error.module].label}
                                    </span>
                                    <span className="error-item__time">{timeAgo(error.lastSeen)}</span>
                                    {error.occurrences > 1 && (
                                        <span className="error-item__occurrences">×{error.occurrences}</span>
                                    )}
                                </div>
                                <p className="error-item__message">{error.message}</p>
                                <div className="error-item__bottom">
                                    <span className="error-item__source">{error.source}</span>
                                    {error.handled ? (
                                        <span className="error-item__handled-badge">
                                            <CheckCircle size={12} /> Gestionado
                                        </span>
                                    ) : (
                                        <button
                                            className="error-item__action"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMarkHandled(error.id);
                                            }}
                                        >
                                            <Eye size={12} /> Marcar gestionado
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Simulation Controls ──────────────────────────────

function SimulationControls({ running, onStart, onStop, onBurst, onClear, onMarkAll }: {
    running: boolean;
    onStart: () => void;
    onStop: () => void;
    onBurst: () => void;
    onClear: () => void;
    onMarkAll: () => void;
}) {
    return (
        <div className="sim-controls">
            <div className="sim-controls__label">
                <Radio size={14} />
                <span>Simulación</span>
            </div>
            <div className="sim-controls__buttons">
                {running ? (
                    <button className="sim-btn sim-btn--pause" onClick={onStop}>
                        <Pause size={14} /> Pausar
                    </button>
                ) : (
                    <button className="sim-btn sim-btn--play" onClick={onStart}>
                        <Play size={14} /> Iniciar
                    </button>
                )}
                <button className="sim-btn sim-btn--burst" onClick={onBurst}>
                    <Zap size={14} /> Ráfaga
                </button>
                <span className="sim-controls__divider" />
                <button className="sim-btn sim-btn--mark" onClick={onMarkAll}>
                    <CheckCircle size={14} /> Gestionar todo
                </button>
                <button className="sim-btn sim-btn--clear" onClick={onClear}>
                    <Trash2 size={14} /> Limpiar
                </button>
            </div>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────

export default function Dashboard() {
    const {
        errors, stats,
        markHandled, markAllHandled, clearAll,
        simulatorRunning, startSimulation, stopSimulation, emitBurst,
    } = useCentinela();

    const [selectedError, setSelectedError] = useState<CentinelaError | null>(null);
    const [processesExpanded, setProcessesExpanded] = useState(true);

    const processes = Object.values(stats.moduleHealthMap);

    return (
        <div className="dashboard">
            {/* System Status Bar */}
            <SystemStatusBar health={stats.systemHealth} uptime={stats.uptimePercent} />

            {/* Simulation Controls */}
            <SimulationControls
                running={simulatorRunning}
                onStart={startSimulation}
                onStop={stopSimulation}
                onBurst={() => emitBurst(5)}
                onClear={clearAll}
                onMarkAll={markAllHandled}
            />

            {/* KPI Cards */}
            <div className="kpi-grid">
                <KpiCard
                    label="Total Errores"
                    value={stats.totalErrors}
                    icon={<BarChart3 size={20} />}
                    color="var(--primary-500)"
                    subtitle="Acumulados"
                />
                <KpiCard
                    label="Críticos"
                    value={stats.criticalCount}
                    icon={<AlertTriangle size={20} />}
                    color="var(--danger-500)"
                    subtitle="Requieren acción"
                    pulse={stats.criticalCount > 0}
                />
                <KpiCard
                    label="Sin Gestionar"
                    value={stats.unhandledCount}
                    icon={<XCircle size={20} />}
                    color="var(--warning-500)"
                    subtitle="Pendientes de revisión"
                    pulse={stats.unhandledCount > 5}
                />
                <KpiCard
                    label="Errores/min"
                    value={stats.errorsPerMinute}
                    icon={<ArrowUpRight size={20} />}
                    color="var(--accent-500)"
                    subtitle="Última ventana"
                />
            </div>

            {/* Process Health */}
            <div className="dashboard__section">
                <button
                    className="dashboard__section-toggle"
                    onClick={() => setProcessesExpanded(!processesExpanded)}
                >
                    {processesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>Procesos SmileStudio</span>
                </button>
                {processesExpanded && <ProcessHealthGrid processes={processes} />}
            </div>

            {/* Error List */}
            <ErrorList
                errors={errors}
                onSelect={setSelectedError}
                onMarkHandled={markHandled}
            />

            {/* Error Detail Modal */}
            {selectedError && (
                <ErrorDetail
                    error={selectedError}
                    onClose={() => setSelectedError(null)}
                    onMarkHandled={markHandled}
                />
            )}
        </div>
    );
}
