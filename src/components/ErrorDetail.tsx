import { X, CheckCircle, Copy, Clock, Layers, Tag, Hash, Eye } from 'lucide-react';
import type { CentinelaError } from '../centinela/types';
import { SEVERITY_CONFIG, MODULE_LABELS } from '../centinela/types';

interface ErrorDetailProps {
    error: CentinelaError;
    onClose: () => void;
    onMarkHandled: (id: string) => void;
}

export default function ErrorDetail({ error, onClose, onMarkHandled }: ErrorDetailProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch(() => { });
    };

    return (
        <div className="error-detail-overlay" onClick={onClose}>
            <div className="error-detail" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="error-detail__header">
                    <div className="error-detail__title-group">
                        <span
                            className={`error-detail__severity-badge error-detail__severity-badge--${error.severity}`}
                            style={{ background: SEVERITY_CONFIG[error.severity].color }}
                        >
                            {SEVERITY_CONFIG[error.severity].label}
                        </span>
                        <h2 className="error-detail__title">Detalle del Error</h2>
                    </div>
                    <button className="error-detail__close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Metadata */}
                <div className="error-detail__meta">
                    <div className="error-detail__meta-item">
                        <Tag size={14} />
                        <span className="error-detail__meta-label">Módulo</span>
                        <span className="error-detail__meta-value">
                            {MODULE_LABELS[error.module].icon} {MODULE_LABELS[error.module].label}
                        </span>
                    </div>
                    <div className="error-detail__meta-item">
                        <Clock size={14} />
                        <span className="error-detail__meta-label">Primera vez</span>
                        <span className="error-detail__meta-value">
                            {new Date(error.firstSeen).toLocaleString('es-ES')}
                        </span>
                    </div>
                    <div className="error-detail__meta-item">
                        <Clock size={14} />
                        <span className="error-detail__meta-label">Última vez</span>
                        <span className="error-detail__meta-value">
                            {new Date(error.lastSeen).toLocaleString('es-ES')}
                        </span>
                    </div>
                    <div className="error-detail__meta-item">
                        <Layers size={14} />
                        <span className="error-detail__meta-label">Ocurrencias</span>
                        <span className="error-detail__meta-value">{error.occurrences}</span>
                    </div>
                    <div className="error-detail__meta-item">
                        <Hash size={14} />
                        <span className="error-detail__meta-label">Fuente</span>
                        <span className="error-detail__meta-value">{error.source}</span>
                    </div>
                    <div className="error-detail__meta-item">
                        <Eye size={14} />
                        <span className="error-detail__meta-label">Estado</span>
                        <span className={`error-detail__meta-value ${error.handled ? 'text-success' : 'text-warning'}`}>
                            {error.handled ? '✅ Gestionado' : '⚠️ Sin gestionar'}
                        </span>
                    </div>
                </div>

                {/* Message */}
                <div className="error-detail__section">
                    <h3 className="error-detail__section-title">Mensaje</h3>
                    <div className="error-detail__message-box">
                        <p>{error.message}</p>
                        <button
                            className="error-detail__copy-btn"
                            onClick={() => copyToClipboard(error.message)}
                            title="Copiar mensaje"
                        >
                            <Copy size={14} />
                        </button>
                    </div>
                </div>

                {/* Stack Trace */}
                {error.stack && (
                    <div className="error-detail__section">
                        <h3 className="error-detail__section-title">Stack Trace</h3>
                        <div className="error-detail__stack">
                            <pre>{error.stack}</pre>
                            <button
                                className="error-detail__copy-btn"
                                onClick={() => copyToClipboard(error.stack || '')}
                                title="Copiar stack trace"
                            >
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Context */}
                {error.context && Object.keys(error.context).length > 0 && (
                    <div className="error-detail__section">
                        <h3 className="error-detail__section-title">Contexto</h3>
                        <div className="error-detail__context">
                            <pre>{JSON.stringify(error.context, null, 2)}</pre>
                        </div>
                    </div>
                )}

                {/* Fingerprint */}
                <div className="error-detail__section">
                    <h3 className="error-detail__section-title">Fingerprint</h3>
                    <code className="error-detail__fingerprint">{error.fingerprint}</code>
                </div>

                {/* Actions */}
                <div className="error-detail__actions">
                    {!error.handled && (
                        <button
                            className="error-detail__action-btn error-detail__action-btn--primary"
                            onClick={() => {
                                onMarkHandled(error.id);
                                onClose();
                            }}
                        >
                            <CheckCircle size={16} /> Marcar como gestionado
                        </button>
                    )}
                    <button className="error-detail__action-btn" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
