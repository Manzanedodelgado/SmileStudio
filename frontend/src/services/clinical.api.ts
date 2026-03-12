// ─── Frontend API Client — Clinical ───────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('ss_access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

export interface ClinicalRecord {
    id: string;
    patientId: string;
    userId?: string | null;
    date: string;
    type: string;
    title: string;
    content: string;
    treatments: TreatmentRef[];
    attachments: string[];
    createdAt: string;
    updatedAt: string;
}

export interface TreatmentRef {
    id?: string;
    name: string;
    toothNumber?: number;
    price?: number;
}

export interface OdontogramTooth {
    id: string;
    patientId: string;
    toothNumber: number;
    status: ToothStatus;
    faces: ToothFaces;
    notes?: string | null;
    updatedAt: string;
}

export type ToothStatus =
    | 'healthy'
    | 'caries'
    | 'treated'
    | 'extracted'
    | 'implant'
    | 'crown'
    | 'rootCanal'
    | 'bridge'
    | 'missing'
    | 'watchlist';

export interface ToothFaces {
    mesial?: string;
    distal?: string;
    occlusal?: string;
    buccal?: string;
    palatal?: string;
}

export interface PatientHistory {
    patientId: string;
    records: ClinicalRecord[];
    odontogram: OdontogramTooth[];
}

export interface CreateRecordInput {
    patientId: string;
    date?: string;
    type?: string;
    title: string;
    content: string;
    treatments?: TreatmentRef[];
}

// ── Historia clínica completa ──────────────────────────────
export async function getPatientHistory(patientId: string): Promise<PatientHistory> {
    const res = await fetch(`${API_BASE}/clinical/patients/${patientId}/history`, {
        headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Error cargando historia clínica');
    return json.data;
}

// ── Entradas médicas ──────────────────────────────────────
export async function createClinicalRecord(input: CreateRecordInput): Promise<ClinicalRecord> {
    const res = await fetch(`${API_BASE}/clinical/records`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Error creando entrada clínica');
    return json.data;
}

export async function deleteClinicalRecord(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/clinical/records/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error eliminando entrada');
}

// ── Odontograma ───────────────────────────────────────────
export async function updateToothStatus(data: {
    patientId: string;
    toothNumber: number;
    status: ToothStatus;
    notes?: string;
}): Promise<OdontogramTooth> {
    const res = await fetch(`${API_BASE}/clinical/odontogram`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Error actualizando odontograma');
    return json.data;
}
