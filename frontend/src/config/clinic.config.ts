/**
 * SmileStudio — Clinic Configuration (White-Label)
 * 
 * Este archivo contiene TODA la configuración específica de la clínica.
 * Para exportar a otra clínica, modifica únicamente este archivo.
 */

export const clinicConfig = {
  // ─── Identidad ─────────────────────────────────────
  name: 'Rubio García Dental',
  shortName: 'RGD',
  legalName: 'Rubio García Dental, SLP',
  cif: 'B-XXXXXXXX',
  slogan: 'Tu sonrisa, nuestra pasión',
  
  // ─── Contacto ──────────────────────────────────────
  phone: '+34 XXX XXX XXX',
  email: 'info@rubiogarcia.dental',
  address: 'C/ Ejemplo, 1, 28001 Madrid',
  website: 'https://rubiogarcia.dental',
  
  // ─── Gabinetes / Sillones ──────────────────────────
  operatories: [
    { id: 'gab-1', name: 'Gabinete 1', color: '#4F8EF7', icon: '🦷' },
    { id: 'gab-2', name: 'Gabinete 2', color: '#7C5CFC', icon: '🦷' },
    { id: 'gab-3', name: 'Gabinete 3', color: '#F59E0B', icon: '🦷' },
  ],

  // ─── Horario ───────────────────────────────────────
  schedule: {
    weekdays: { open: '09:00', close: '20:00', lunchStart: '14:00', lunchEnd: '16:00' },
    saturday: { open: '09:00', close: '14:00' },
    sunday: null, // cerrado
  },

  // ─── Tema Visual ───────────────────────────────────
  theme: {
    primaryHue: 217,        // Azul dental profesional
    accentHue: 262,         // Violeta elegante
    successHue: 152,        // Verde salud
    warningHue: 38,         // Ámbar
    dangerHue: 0,           // Rojo
    borderRadius: '12px',
    fontFamily: "'Inter', 'Outfit', system-ui, -apple-system, sans-serif",
  },

  // ─── Roles del sistema ─────────────────────────────
  roles: [
    { id: 'admin', label: 'Administrador', canSeeFinance: true },
    { id: 'doctor', label: 'Doctor/a', canSeeFinance: false },
    { id: 'hygienist', label: 'Higienista', canSeeFinance: false },
    { id: 'reception', label: 'Recepción', canSeeFinance: false },
    { id: 'accounting', label: 'Contabilidad', canSeeFinance: true },
    { id: 'auxiliary', label: 'Auxiliar', canSeeFinance: false },
  ],

  // ─── Documentos requeridos por paciente ────────────
  requiredDocuments: [
    { id: 'consent-general', label: 'Consentimiento general', category: 'consent' },
    { id: 'lopd', label: 'Protección de datos (LOPD)', category: 'legal' },
    { id: 'first-visit', label: 'Registro primera visita', category: 'clinical' },
    { id: 'medical-history', label: 'Historial médico', category: 'clinical' },
    { id: 'consent-rx', label: 'Consentimiento radiografías', category: 'consent' },
    { id: 'consent-endo', label: 'Consentimiento endodoncia', category: 'consent' },
    { id: 'consent-surgery', label: 'Consentimiento cirugía', category: 'consent' },
    { id: 'consent-implant', label: 'Consentimiento implantes', category: 'consent' },
    { id: 'consent-ortho', label: 'Consentimiento ortodoncia', category: 'consent' },
    { id: 'consent-sedation', label: 'Consentimiento sedación', category: 'consent' },
  ],

  // ─── Alertas clínicas (configurables) ──────────────
  clinicalAlerts: {
    noVisitDays: 180,           // Alerta si no ha venido en 6 meses
    rxExpiryDays: 365,          // RX panorámica caduca al año
    cbctExpiryDays: 730,        // CBCT caduca a los 2 años
    unfinishedTreatmentDays: 90, // Tratamiento sin terminar > 3 meses
  },
} as const;

export type ClinicConfig = typeof clinicConfig;
export type OperatoryConfig = typeof clinicConfig.operatories[number];
export type RoleConfig = typeof clinicConfig.roles[number];
