// ─────────────────────────────────────────────────────────────────
//  services/gdrive.service.ts [MOCK VERSION - UI ONLY]
// ─────────────────────────────────────────────────────────────────

export const isGDriveConfigured = (): boolean => true;

export interface PatientPhoto {
    id: string;
    name: string;
    label: string;
    date: string;
    url: string;
    thumbnail: string;
    mimeType: string;
}

const MOCK_PHOTOS: PatientPhoto[] = [
    {
        id: 'ph-001', name: 'frente_2024-03.jpg', label: 'Frente',
        date: 'Mar 2024',
        url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=300',
        thumbnail: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=150',
        mimeType: 'image/jpeg',
    },
    {
        id: 'ph-002', name: 'derecha_2024-03.jpg', label: 'Derecha',
        date: 'Mar 2024',
        url: 'https://images.unsplash.com/photo-1588776814546-1ffcf4722636?auto=format&fit=crop&q=80&w=300',
        thumbnail: 'https://images.unsplash.com/photo-1588776814546-1ffcf4722636?auto=format&fit=crop&q=80&w=150',
        mimeType: 'image/jpeg',
    }
];

export const getPatientPhotos = async (patientId: string): Promise<PatientPhoto[]> => {
    return MOCK_PHOTOS;
};

export const uploadPatientPhoto = async (_patientId: string, _file: File): Promise<boolean> => {
    return true;
};
