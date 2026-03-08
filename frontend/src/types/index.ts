// ─── SmileStudio Core Types ──────────────────────────────

export type UserRole = 'admin' | 'doctor' | 'hygienist' | 'reception' | 'accounting' | 'auxiliary';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    avatar?: string;
    specialty?: string;
}

// ─── Pacientes ───────────────────────────────────────────

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    avatar?: string;
    dateOfBirth: string;
    lastVisit?: string;
    lastRx?: string;
    registeredAt: string;
}

// ─── Citas ───────────────────────────────────────────────

export type AppointmentStatus = 'scheduled' | 'waiting' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';

export interface Appointment {
    id: string;
    patientId: string;
    patient: Patient;
    doctorId: string;
    doctor: User;
    operatoryId: string;
    startTime: string;
    endTime: string;
    treatment: string;
    status: AppointmentStatus;
    notes?: string;
    arrivalTime?: string; // when patient checked in
}

// ─── Gabinetes ───────────────────────────────────────────

export type OperatoryStatus = 'free' | 'occupied' | 'cleaning' | 'blocked';

export interface OperatoryState {
    id: string;
    name: string;
    color: string;
    status: OperatoryStatus;
    currentAppointment?: Appointment;
    elapsedMinutes?: number;
}

// ─── Mensajes ────────────────────────────────────────────

export type MessageUrgency = 'high' | 'medium' | 'low';
export type MessageChannel = 'whatsapp' | 'email' | 'phone' | 'internal';

export interface PendingMessage {
    id: string;
    patientId: string;
    patient: Patient;
    channel: MessageChannel;
    preview: string;
    receivedAt: string;
    urgency: MessageUrgency;
    unreadCount: number;
}

// ─── Documentos pendientes ───────────────────────────────

export type DocumentCategory = 'consent' | 'legal' | 'clinical';
export type DocumentStatus = 'pending' | 'sent' | 'signed' | 'expired';

export interface PendingDocument {
    id: string;
    patientId: string;
    patient: Patient;
    documentType: string;
    documentLabel: string;
    category: DocumentCategory;
    status: DocumentStatus;
    dueDate?: string;
}

// ─── Alertas clínicas ────────────────────────────────────

export type AlertType = 'no-visit' | 'rx-expired' | 'treatment-pending' | 'followup' | 'birthday';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface ClinicalAlert {
    id: string;
    patientId: string;
    patient: Patient;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    detail: string;
    date: string;
}

// ─── Navigation ──────────────────────────────────────────

export interface NavItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    badge?: number;
    requiredRole?: UserRole[];
    children?: NavItem[];
}
