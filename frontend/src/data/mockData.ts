/**
 * SmileStudio — Mock Data
 * Datos simulados realistas para desarrollo.
 */
import type {
    Patient, User, Appointment, OperatoryState,
    PendingMessage, PendingDocument, ClinicalAlert
} from '../types';

// ─── Staff ───────────────────────────────────────────

export const currentUser: User = {
    id: 'u-1',
    name: 'Dr. Rubio García',
    role: 'admin',
    specialty: 'Odontología General',
};

export const staff: User[] = [
    currentUser,
    { id: 'u-2', name: 'Dra. Elena Martínez', role: 'doctor', specialty: 'Endodoncia' },
    { id: 'u-3', name: 'Laura Sánchez', role: 'hygienist', specialty: 'Higiene dental' },
    { id: 'u-4', name: 'Ana López', role: 'reception' },
];

// ─── Pacientes ────────────────────────────────────────

export const patients: Patient[] = [
    { id: 'p-1', firstName: 'María', lastName: 'González Ruiz', phone: '+34 612 345 678', dateOfBirth: '1985-03-15', lastVisit: '2026-03-05', lastRx: '2025-11-20', registeredAt: '2023-01-10' },
    { id: 'p-2', firstName: 'Carlos', lastName: 'Fernández López', phone: '+34 623 456 789', dateOfBirth: '1972-08-22', lastVisit: '2026-02-28', lastRx: '2026-01-15', registeredAt: '2022-06-20' },
    { id: 'p-3', firstName: 'Lucía', lastName: 'Martín Pérez', phone: '+34 634 567 890', dateOfBirth: '1990-12-01', lastVisit: '2025-09-10', lastRx: '2025-04-05', registeredAt: '2024-02-14' },
    { id: 'p-4', firstName: 'Antonio', lastName: 'Ruiz Sánchez', phone: '+34 645 678 901', dateOfBirth: '1968-05-30', lastVisit: '2026-03-07', registeredAt: '2021-11-03' },
    { id: 'p-5', firstName: 'Elena', lastName: 'López García', phone: '+34 656 789 012', dateOfBirth: '1995-07-19', lastVisit: '2026-03-06', lastRx: '2026-03-06', registeredAt: '2025-12-01' },
    { id: 'p-6', firstName: 'Javier', lastName: 'Hernández Díaz', phone: '+34 667 890 123', dateOfBirth: '1982-01-25', lastVisit: '2025-06-15', registeredAt: '2024-08-10' },
    { id: 'p-7', firstName: 'Carmen', lastName: 'Moreno Torres', phone: '+34 678 901 234', dateOfBirth: '1978-11-08', lastVisit: '2026-03-04', lastRx: '2025-12-20', registeredAt: '2023-04-22' },
    { id: 'p-8', firstName: 'Pablo', lastName: 'Jiménez Navarro', phone: '+34 689 012 345', dateOfBirth: '2001-04-12', registeredAt: '2026-03-07' },
];

// ─── Citas de hoy ─────────────────────────────────────

const today = '2026-03-07';

export const todayAppointments: Appointment[] = [
    {
        id: 'a-1', patientId: 'p-4', patient: patients[3], doctorId: 'u-1', doctor: staff[0],
        operatoryId: 'gab-1', startTime: `${today}T09:00`, endTime: `${today}T10:00`,
        treatment: 'Revisión + Limpieza', status: 'in-progress', arrivalTime: `${today}T08:50`,
    },
    {
        id: 'a-2', patientId: 'p-5', patient: patients[4], doctorId: 'u-2', doctor: staff[1],
        operatoryId: 'gab-2', startTime: `${today}T09:30`, endTime: `${today}T10:30`,
        treatment: 'Endodoncia 36', status: 'in-progress', arrivalTime: `${today}T09:20`,
    },
    {
        id: 'a-3', patientId: 'p-1', patient: patients[0], doctorId: 'u-1', doctor: staff[0],
        operatoryId: 'gab-1', startTime: `${today}T10:00`, endTime: `${today}T10:30`,
        treatment: 'Corona provisional', status: 'waiting', arrivalTime: `${today}T09:45`,
    },
    {
        id: 'a-4', patientId: 'p-7', patient: patients[6], doctorId: 'u-3', doctor: staff[2],
        operatoryId: 'gab-3', startTime: `${today}T10:00`, endTime: `${today}T10:45`,
        treatment: 'Higiene dental', status: 'waiting', arrivalTime: `${today}T09:55`,
    },
    {
        id: 'a-5', patientId: 'p-2', patient: patients[1], doctorId: 'u-1', doctor: staff[0],
        operatoryId: 'gab-1', startTime: `${today}T11:00`, endTime: `${today}T12:00`,
        treatment: 'Implante 46 — 2ª fase', status: 'scheduled',
    },
    {
        id: 'a-6', patientId: 'p-3', patient: patients[2], doctorId: 'u-2', doctor: staff[1],
        operatoryId: 'gab-2', startTime: `${today}T11:00`, endTime: `${today}T11:30`,
        treatment: 'Control post-endodoncia', status: 'scheduled',
    },
    {
        id: 'a-7', patientId: 'p-6', patient: patients[5], doctorId: 'u-1', doctor: staff[0],
        operatoryId: 'gab-1', startTime: `${today}T12:30`, endTime: `${today}T13:30`,
        treatment: 'Cirugía cordal 48', status: 'scheduled',
    },
    {
        id: 'a-8', patientId: 'p-8', patient: patients[7], doctorId: 'u-2', doctor: staff[1],
        operatoryId: 'gab-2', startTime: `${today}T16:00`, endTime: `${today}T16:30`,
        treatment: 'Primera visita', status: 'scheduled',
    },
];

// ─── Estado de gabinetes ──────────────────────────────

export const operatories: OperatoryState[] = [
    {
        id: 'gab-1', name: 'Gabinete 1', color: '#4F8EF7', status: 'occupied',
        currentAppointment: todayAppointments[0], elapsedMinutes: 42,
    },
    {
        id: 'gab-2', name: 'Gabinete 2', color: '#7C5CFC', status: 'occupied',
        currentAppointment: todayAppointments[1], elapsedMinutes: 18,
    },
    {
        id: 'gab-3', name: 'Gabinete 3', color: '#F59E0B', status: 'free',
    },
];

// ─── Sala de espera ───────────────────────────────────

export const waitingRoom: Appointment[] = todayAppointments.filter(a => a.status === 'waiting');

// ─── Mensajes sin contestar ───────────────────────────

export const pendingMessages: PendingMessage[] = [
    {
        id: 'm-1', patientId: 'p-3', patient: patients[2], channel: 'whatsapp',
        preview: 'Buenos días, quería saber si pueden adelantar mi cita del jueves...',
        receivedAt: `${today}T08:15`, urgency: 'high', unreadCount: 3,
    },
    {
        id: 'm-2', patientId: 'p-6', patient: patients[5], channel: 'whatsapp',
        preview: 'Hola, tengo bastante dolor desde ayer, ¿puedo ir hoy?',
        receivedAt: `${today}T07:45`, urgency: 'high', unreadCount: 1,
    },
    {
        id: 'm-3', patientId: 'p-2', patient: patients[1], channel: 'whatsapp',
        preview: 'Gracias por el recordatorio. Allí estaré 👍',
        receivedAt: `${today}T09:02`, urgency: 'low', unreadCount: 1,
    },
    {
        id: 'm-4', patientId: 'p-7', patient: patients[6], channel: 'email',
        preview: 'Adjunto el informe del médico de cabecera que me pidieron.',
        receivedAt: '2026-03-06T18:30', urgency: 'medium', unreadCount: 1,
    },
];

// ─── Documentos pendientes ────────────────────────────

export const pendingDocuments: PendingDocument[] = [
    { id: 'd-1', patientId: 'p-8', patient: patients[7], documentType: 'first-visit', documentLabel: 'Registro primera visita', category: 'clinical', status: 'pending' },
    { id: 'd-2', patientId: 'p-8', patient: patients[7], documentType: 'lopd', documentLabel: 'Protección de datos (LOPD)', category: 'legal', status: 'pending' },
    { id: 'd-3', patientId: 'p-8', patient: patients[7], documentType: 'consent-general', documentLabel: 'Consentimiento general', category: 'consent', status: 'pending' },
    { id: 'd-4', patientId: 'p-8', patient: patients[7], documentType: 'medical-history', documentLabel: 'Historial médico', category: 'clinical', status: 'pending' },
    { id: 'd-5', patientId: 'p-6', patient: patients[5], documentType: 'consent-surgery', documentLabel: 'Consentimiento cirugía', category: 'consent', status: 'sent', dueDate: `${today}` },
    { id: 'd-6', patientId: 'p-1', patient: patients[0], documentType: 'consent-general', documentLabel: 'Consentimiento general', category: 'consent', status: 'expired' },
    { id: 'd-7', patientId: 'p-2', patient: patients[1], documentType: 'consent-implant', documentLabel: 'Consentimiento implantes', category: 'consent', status: 'sent', dueDate: `${today}` },
];

// ─── Alertas clínicas ─────────────────────────────────

export const clinicalAlerts: ClinicalAlert[] = [
    {
        id: 'al-1', patientId: 'p-3', patient: patients[2], type: 'no-visit', severity: 'warning',
        message: 'Sin visita desde hace 6 meses', detail: 'Última visita: 10/09/2025', date: '2025-09-10',
    },
    {
        id: 'al-2', patientId: 'p-6', patient: patients[5], type: 'no-visit', severity: 'critical',
        message: 'Sin visita desde hace 9 meses', detail: 'Última visita: 15/06/2025', date: '2025-06-15',
    },
    {
        id: 'al-3', patientId: 'p-3', patient: patients[2], type: 'rx-expired', severity: 'warning',
        message: 'Radiografía panorámica caducada', detail: 'Última RX: 05/04/2025 (hace 11 meses)', date: '2025-04-05',
    },
    {
        id: 'al-4', patientId: 'p-7', patient: patients[6], type: 'treatment-pending', severity: 'info',
        message: 'Tratamiento sin finalizar', detail: 'Rehabilitación completa — faltan 2 sesiones', date: '2026-03-04',
    },
    {
        id: 'al-5', patientId: 'p-5', patient: patients[4], type: 'followup', severity: 'info',
        message: 'Seguimiento post-extracción', detail: 'Extracción 18 — control a 7 días pendiente', date: '2026-03-06',
    },
];
