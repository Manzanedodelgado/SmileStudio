// ─── Frontend API Client — Patients ──────────────────────
// Llama al backend Express /api/patients
// ─────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('ss_access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    dni?: string | null;
    phone: string;
    email?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    medicalNotes?: string | null;
    allergies?: string | null;
    medications?: string | null;
    bloodType?: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePatientInput {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    dni?: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    medicalNotes?: string;
    allergies?: string;
    medications?: string;
    bloodType?: string;
}

interface PatientsResponse {
    success: boolean;
    data: Patient[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

interface PatientResponse {
    success: boolean;
    data: Patient;
}

export async function getPatients(params?: {
    search?: string;
    active?: 'true' | 'false';
    page?: number;
    limit?: number;
}): Promise<{ data: Patient[]; pagination: PatientsResponse['pagination'] }> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.active) qs.set('active', params.active);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/patients?${qs}`, { headers: getAuthHeaders() });
    const json: PatientsResponse = await res.json();
    if (!res.ok || !json.success) throw new Error('Error cargando pacientes');
    return { data: json.data, pagination: json.pagination };
}

export async function getPatientById(id: string): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/${id}`, { headers: getAuthHeaders() });
    const json: PatientResponse = await res.json();
    if (!res.ok || !json.success) throw new Error('Paciente no encontrado');
    return json.data;
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });
    const json: PatientResponse = await res.json();
    if (!res.ok || !json.success) throw new Error('Error creando paciente');
    return json.data;
}

export async function updatePatient(id: string, input: Partial<CreatePatientInput>): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });
    const json: PatientResponse = await res.json();
    if (!res.ok || !json.success) throw new Error('Error actualizando paciente');
    return json.data;
}

export async function deletePatient(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error dando de baja paciente');
}
