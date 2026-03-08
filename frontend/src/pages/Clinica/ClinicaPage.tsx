import {
    operatories, waitingRoom, todayAppointments,
    pendingMessages, pendingDocuments, clinicalAlerts
} from '../../data/mockData';
import { clinicConfig } from '../../config/clinic.config';
import {
    Activity, Clock, Users, MessageCircle, FileWarning, AlertTriangle,
    ArrowRight, Phone, Mail, CheckCircle2, XCircle, Timer,
    Stethoscope, Armchair, Sparkles
} from 'lucide-react';
import type { OperatoryState, Appointment, PendingMessage, PendingDocument, ClinicalAlert } from '../../types';
import './ClinicaPage.css';

// ─── Helpers ──────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const now = new Date('2026-03-07T09:42:00');
    const then = new Date(dateStr);
    const mins = Math.floor((now.getTime() - then.getTime()) / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(firstName: string, lastName: string): string {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

// ─── Widget: Gabinetes ────────────────────────────────

function OperatoriesWidget({ data }: { data: OperatoryState[] }) {
    return (
        <section className="widget widget--operatories animate-fade-in-up">
            <div className="widget__header">
                <div className="widget__header-left">
                    <div className="widget__icon widget__icon--primary">
                        <Stethoscope size={18} />
                    </div>
                    <div>
                        <h2 className="widget__title">Gabinetes</h2>
                        <p className="widget__subtitle">Estado en tiempo real</p>
                    </div>
                </div>
                <div className="widget__live-badge">
                    <span className="widget__live-dot" />
                    EN VIVO
                </div>
            </div>
            <div className="operatories-grid">
                {data.map((op) => (
                    <div
                        key={op.id}
                        className={`operatory-card operatory-card--${op.status}`}
                        style={{ '--op-color': op.color } as React.CSSProperties}
                    >
                        <div className="operatory-card__header">
                            <span className="operatory-card__name">{op.name}</span>
                            <span className={`operatory-card__status-badge operatory-card__status-badge--${op.status}`}>
                                {op.status === 'occupied' ? 'Ocupado' : op.status === 'free' ? 'Libre' : op.status === 'cleaning' ? 'Limpieza' : 'Bloqueado'}
                            </span>
                        </div>
                        {op.status === 'occupied' && op.currentAppointment ? (
                            <div className="operatory-card__details">
                                <div className="operatory-card__patient">
                                    <div className="avatar avatar--sm" style={{ background: op.color }}>
                                        {getInitials(op.currentAppointment.patient.firstName, op.currentAppointment.patient.lastName)}
                                    </div>
                                    <div>
                                        <span className="operatory-card__patient-name">
                                            {op.currentAppointment.patient.firstName} {op.currentAppointment.patient.lastName}
                                        </span>
                                        <span className="operatory-card__treatment">
                                            {op.currentAppointment.treatment}
                                        </span>
                                    </div>
                                </div>
                                <div className="operatory-card__meta">
                                    <div className="operatory-card__doctor">
                                        <Stethoscope size={12} />
                                        {op.currentAppointment.doctor.name}
                                    </div>
                                    <div className="operatory-card__time">
                                        <Timer size={12} />
                                        <span className={op.elapsedMinutes && op.elapsedMinutes > 50 ? 'text-danger' : ''}>
                                            {op.elapsedMinutes} min
                                        </span>
                                    </div>
                                </div>
                                {op.elapsedMinutes && op.elapsedMinutes > 0 && (
                                    <div className="operatory-card__progress">
                                        <div
                                            className="operatory-card__progress-bar"
                                            style={{
                                                width: `${Math.min(100, (op.elapsedMinutes / 60) * 100)}%`,
                                                background: op.elapsedMinutes > 50 ? 'var(--danger-500)' : op.color,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="operatory-card__empty">
                                <Sparkles size={24} className="operatory-card__empty-icon" />
                                <span>Disponible</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Widget: Sala de espera ───────────────────────────

function WaitingRoomWidget({ data }: { data: Appointment[] }) {
    return (
        <section className="widget widget--waiting animate-fade-in-up" style={{ animationDelay: '60ms' }}>
            <div className="widget__header">
                <div className="widget__header-left">
                    <div className="widget__icon widget__icon--accent">
                        <Armchair size={18} />
                    </div>
                    <div>
                        <h2 className="widget__title">Sala de Espera</h2>
                        <p className="widget__subtitle">{data.length} paciente{data.length !== 1 ? 's' : ''} esperando</p>
                    </div>
                </div>
                {data.length > 0 && <span className="widget__count">{data.length}</span>}
            </div>
            <div className="widget__list">
                {data.length === 0 ? (
                    <div className="widget__empty">
                        <Users size={32} />
                        <span>Sala de espera vacía</span>
                    </div>
                ) : (
                    data.map((apt) => {
                        const waitMins = apt.arrivalTime
                            ? Math.floor((new Date('2026-03-07T09:42:00').getTime() - new Date(apt.arrivalTime).getTime()) / 60000)
                            : 0;
                        return (
                            <div key={apt.id} className="waiting-item">
                                <div className="avatar avatar--md">
                                    {getInitials(apt.patient.firstName, apt.patient.lastName)}
                                </div>
                                <div className="waiting-item__info">
                                    <span className="waiting-item__name">
                                        {apt.patient.firstName} {apt.patient.lastName}
                                    </span>
                                    <span className="waiting-item__treatment">{apt.treatment}</span>
                                    <span className="waiting-item__meta">
                                        <Clock size={11} />
                                        Cita {formatTime(apt.startTime)} · {apt.doctor.name}
                                    </span>
                                </div>
                                <div className={`waiting-item__wait ${waitMins > 15 ? 'waiting-item__wait--long' : ''}`}>
                                    <Timer size={14} />
                                    <span>{waitMins} min</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}

// ─── Widget: Próximas citas ───────────────────────────

function UpcomingWidget({ data }: { data: Appointment[] }) {
    const upcoming = data.filter(a => a.status === 'scheduled').slice(0, 5);
    return (
        <section className="widget widget--upcoming animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <div className="widget__header">
                <div className="widget__header-left">
                    <div className="widget__icon widget__icon--success">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h2 className="widget__title">Próximas Citas</h2>
                        <p className="widget__subtitle">Hoy quedan {upcoming.length} citas</p>
                    </div>
                </div>
                <button className="widget__view-all">
                    Ver agenda <ArrowRight size={14} />
                </button>
            </div>
            <div className="widget__list">
                {upcoming.map((apt) => (
                    <div key={apt.id} className="upcoming-item">
                        <div className="upcoming-item__time">
                            <span className="upcoming-item__hour">{formatTime(apt.startTime)}</span>
                            <span className="upcoming-item__duration">
                                {Math.floor((new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / 60000)} min
                            </span>
                        </div>
                        <div className="upcoming-item__line" />
                        <div className="upcoming-item__info">
                            <span className="upcoming-item__name">
                                {apt.patient.firstName} {apt.patient.lastName}
                            </span>
                            <span className="upcoming-item__treatment">{apt.treatment}</span>
                            <span className="upcoming-item__meta">
                                {apt.doctor.name} · {clinicConfig.operatories.find(o => o.id === apt.operatoryId)?.name}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Widget: Mensajes pendientes ──────────────────────

function MessagesWidget({ data }: { data: PendingMessage[] }) {
    const sorted = [...data].sort((a, b) => {
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    return (
        <section className="widget widget--messages animate-fade-in-up" style={{ animationDelay: '180ms' }}>
            <div className="widget__header">
                <div className="widget__header-left">
                    <div className="widget__icon widget__icon--warning">
                        <MessageCircle size={18} />
                    </div>
                    <div>
                        <h2 className="widget__title">Mensajes Pendientes</h2>
                        <p className="widget__subtitle">{data.length} sin contestar</p>
                    </div>
                </div>
                {data.some(m => m.urgency === 'high') && (
                    <span className="widget__urgent-badge">
                        {data.filter(m => m.urgency === 'high').length} urgente{data.filter(m => m.urgency === 'high').length > 1 ? 's' : ''}
                    </span>
                )}
            </div>
            <div className="widget__list">
                {sorted.map((msg) => (
                    <div key={msg.id} className={`message-item message-item--${msg.urgency}`}>
                        <div className="message-item__avatar">
                            <div className="avatar avatar--sm">
                                {getInitials(msg.patient.firstName, msg.patient.lastName)}
                            </div>
                            <span className={`message-item__channel message-item__channel--${msg.channel}`}>
                                {msg.channel === 'whatsapp' ? <Phone size={10} /> : <Mail size={10} />}
                            </span>
                        </div>
                        <div className="message-item__content">
                            <div className="message-item__top">
                                <span className="message-item__name">
                                    {msg.patient.firstName} {msg.patient.lastName}
                                </span>
                                <span className="message-item__time">{timeAgo(msg.receivedAt)}</span>
                            </div>
                            <p className="message-item__preview">{msg.preview}</p>
                        </div>
                        {msg.unreadCount > 1 && (
                            <span className="message-item__count">{msg.unreadCount}</span>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Widget: Documentos pendientes ────────────────────

function DocumentsWidget({ data }: { data: PendingDocument[] }) {
    // Group by patient
    const byPatient = data.reduce((acc, doc) => {
        const key = doc.patientId;
        if (!acc[key]) acc[key] = { patient: doc.patient, docs: [] };
        acc[key].docs.push(doc);
        return acc;
    }, {} as Record<string, { patient: PendingDocument['patient']; docs: PendingDocument[] }>);

    return (
        <section className="widget widget--documents animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            <div className="widget__header">
                <div className="widget__header-left">
                    <div className="widget__icon widget__icon--danger">
                        <FileWarning size={18} />
                    </div>
                    <div>
                        <h2 className="widget__title">Documentos Pendientes</h2>
                        <p className="widget__subtitle">{data.length} documento{data.length !== 1 ? 's' : ''} por completar</p>
                    </div>
                </div>
            </div>
            <div className="widget__list">
                {Object.entries(byPatient).map(([patientId, { patient, docs }]) => (
                    <div key={patientId} className="doc-group">
                        <div className="doc-group__header">
                            <div className="avatar avatar--sm">
                                {getInitials(patient.firstName, patient.lastName)}
                            </div>
                            <span className="doc-group__name">
                                {patient.firstName} {patient.lastName}
                            </span>
                            <span className="doc-group__count">{docs.length}</span>
                        </div>
                        <div className="doc-group__items">
                            {docs.map((doc) => (
                                <div key={doc.id} className={`doc-item doc-item--${doc.status}`}>
                                    {doc.status === 'expired' ? (
                                        <XCircle size={14} className="doc-item__icon doc-item__icon--expired" />
                                    ) : doc.status === 'signed' ? (
                                        <CheckCircle2 size={14} className="doc-item__icon doc-item__icon--signed" />
                                    ) : (
                                        <FileWarning size={14} className="doc-item__icon" />
                                    )}
                                    <span className="doc-item__label">{doc.documentLabel}</span>
                                    <span className={`doc-item__status doc-item__status--${doc.status}`}>
                                        {doc.status === 'pending' ? 'Pendiente' : doc.status === 'sent' ? 'Enviado' : doc.status === 'expired' ? 'Caducado' : 'Firmado'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Widget: Alertas clínicas ─────────────────────────

function AlertsWidget({ data }: { data: ClinicalAlert[] }) {
    const sorted = [...data].sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return (
        <section className="widget widget--alerts animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="widget__header">
                <div className="widget__header-left">
                    <div className="widget__icon widget__icon--danger">
                        <AlertTriangle size={18} />
                    </div>
                    <div>
                        <h2 className="widget__title">Alertas Clínicas</h2>
                        <p className="widget__subtitle">{data.length} alerta{data.length !== 1 ? 's' : ''} activa{data.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>
            <div className="widget__list">
                {sorted.map((alert) => (
                    <div key={alert.id} className={`alert-item alert-item--${alert.severity}`}>
                        <div className={`alert-item__indicator alert-item__indicator--${alert.severity}`} />
                        <div className="alert-item__content">
                            <div className="alert-item__top">
                                <span className="alert-item__patient">
                                    {alert.patient.firstName} {alert.patient.lastName}
                                </span>
                                <span className={`alert-item__severity alert-item__severity--${alert.severity}`}>
                                    {alert.severity === 'critical' ? 'Crítico' : alert.severity === 'warning' ? 'Atención' : 'Info'}
                                </span>
                            </div>
                            <p className="alert-item__message">{alert.message}</p>
                            <p className="alert-item__detail">{alert.detail}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Page: Clínica ────────────────────────────────────

export default function ClinicaPage() {
    const now = new Date('2026-03-07T09:42:00');
    const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 20 ? 'Buenas tardes' : 'Buenas noches';
    const totalToday = todayAppointments.length;
    const completed = todayAppointments.filter(a => a.status === 'completed').length;
    const inProgress = todayAppointments.filter(a => a.status === 'in-progress').length;

    return (
        <div className="clinica-page">
            {/* Hero */}
            <div className="clinica-hero">
                <div className="clinica-hero__text">
                    <h1 className="clinica-hero__greeting">
                        {greeting}, <span className="clinica-hero__name">{clinicConfig.shortName}</span>
                    </h1>
                    <p className="clinica-hero__summary">
                        Hoy tienes <strong>{totalToday} citas</strong> programadas ·{' '}
                        {inProgress > 0 && <><strong>{inProgress} en curso</strong> · </>}
                        <strong>{completed} completadas</strong>
                    </p>
                </div>
                <div className="clinica-hero__stats">
                    <div className="hero-stat">
                        <span className="hero-stat__value">{totalToday}</span>
                        <span className="hero-stat__label">Citas hoy</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value hero-stat__value--active">{inProgress}</span>
                        <span className="hero-stat__label">En curso</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value">{waitingRoom.length}</span>
                        <span className="hero-stat__label">En espera</span>
                    </div>
                    <div className="hero-stat">
                        <span className="hero-stat__value hero-stat__value--messages">{pendingMessages.length}</span>
                        <span className="hero-stat__label">Mensajes</span>
                    </div>
                </div>
            </div>

            {/* Widgets Grid */}
            <div className="clinica-grid">
                <OperatoriesWidget data={operatories} />
                <WaitingRoomWidget data={waitingRoom} />
                <UpcomingWidget data={todayAppointments} />
                <MessagesWidget data={pendingMessages} />
                <DocumentsWidget data={pendingDocuments} />
                <AlertsWidget data={clinicalAlerts} />
            </div>
        </div>
    );
}
