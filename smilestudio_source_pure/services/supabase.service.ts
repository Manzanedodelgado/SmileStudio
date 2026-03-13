// ─────────────────────────────────────────────────────────────────
//  services/supabase.service.ts
//  Integración con Supabase para medicaciones y alergias.
//  INTERVENCIÓN-002: sbFetch eliminado — usa dbFetch de db.ts
//  INTERVENCIÓN-003: bug PATCH corregido — filtro en URL, no en headers
//  INTERVENCIÓN: SUPABASE_MIGRATION_SQL eliminado (dead code, ver docs/sql/)
// ─────────────────────────────────────────────────────────────────
import { dbFetch, isDbConfigured, generateId } from './db';

// Re-export isDbConfigured bajo el alias anterior para compatibilidad
export const isSupabaseConfigured = isDbConfigured;

// ── Tipos ──────────────────────────────────────────────────────

export interface PatientMedication {
    id: string;
    paciente_id: string;
    nombre: string;
    dosis?: string;
    frecuencia?: string;
    importante: boolean;
    categoria?: string;
    nota?: string;
}

export interface PatientAllergy {
    id: string;
    paciente_id: string;
    nombre: string;
    severidad: 'leve' | 'moderada' | 'grave';
}

// ── MEDICACIONES ───────────────────────────────────────────────

export const getMedications = async (pacienteId: string): Promise<PatientMedication[]> => {
    if (!isDbConfigured()) return [];
    const res = await dbFetch(
        `patient_medications?paciente_id=eq.${encodeURIComponent(pacienteId)}&order=importante.desc,nombre.asc`
    );
    if (!res.ok) return [];
    return res.json();
};

/**
 * INTERVENCIÓN-003 FIX: El filtro PATCH ahora va en la URL (PostgREST requiere
 * ?id=eq.xxx en la URL, NO en las cabeceras HTTP).
 * Antes: headers: { 'id': `eq.${med.id}` } ← incorrecto, actualizaba TODOS los registros
 * Ahora: URL path con filtro correcto
 */
export const upsertMedication = async (med: Omit<PatientMedication, 'id'> & { id?: string }): Promise<PatientMedication | null> => {
    if (!isDbConfigured()) {
        return { ...med, id: med.id ?? generateId() } as PatientMedication;
    }

    // El filtro va en la URL, no en headers
    const urlPath = med.id
        ? `patient_medications?id=eq.${med.id}`
        : 'patient_medications';

    const res = await dbFetch(urlPath, {
        method: med.id ? 'PATCH' : 'POST',
        body: JSON.stringify(med),
    });
    if (!res.ok) { console.error('[Medications] upsert error:', res.status); return null; }
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
};

export const deleteMedication = async (id: string): Promise<boolean> => {
    if (!isDbConfigured()) return true;
    const res = await dbFetch(`patient_medications?id=eq.${id}`, { method: 'DELETE' });
    return res.ok;
};

// ── ALERGIAS ───────────────────────────────────────────────────

export const getAllergies = async (pacienteId: string): Promise<PatientAllergy[]> => {
    if (!isDbConfigured()) return [];
    const res = await dbFetch(
        `patient_allergies?paciente_id=eq.${encodeURIComponent(pacienteId)}&order=severidad.asc`
    );
    if (!res.ok) return [];
    return res.json();
};

export const upsertAllergy = async (alergy: Omit<PatientAllergy, 'id'> & { id?: string }): Promise<PatientAllergy | null> => {
    if (!isDbConfigured()) {
        return { ...alergy, id: alergy.id ?? generateId() } as PatientAllergy;
    }

    // Filtro en URL para PATCH (mismo patrón que upsertMedication)
    const urlPath = alergy.id
        ? `patient_allergies?id=eq.${alergy.id}`
        : 'patient_allergies';

    const res = await dbFetch(urlPath, {
        method: alergy.id ? 'PATCH' : 'POST',
        body: JSON.stringify(alergy),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
};

export const deleteAllergy = async (id: string): Promise<boolean> => {
    if (!isDbConfigured()) return true;
    const res = await dbFetch(`patient_allergies?id=eq.${id}`, { method: 'DELETE' });
    return res.ok;
};
