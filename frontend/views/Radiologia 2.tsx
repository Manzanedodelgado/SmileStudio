
import React, { useState, useCallback, useRef, useEffect } from 'react';
import CbctViewer, { type ViewId, type CbctProgress, VIEWS as CBCT_VIEWS, exportCanvas as cbctExport } from '../components/radiologia/CbctViewer';
import DicomViewer from '../components/radiologia/DicomViewer';
import {
    Upload, ZoomIn, ZoomOut, RotateCcw, Download, Printer,
    Sliders, Wand2, Palette, Eye, EyeOff, Trash2, Plus,
    ChevronLeft, ChevronRight, Maximize2, X, Info,
    SplitSquareHorizontal, Filter, Search, FolderOpen,
    Layers, Move, Pen, Ruler, Circle, Square, Type,
    FlipHorizontal, FlipVertical, RefreshCw, Star, Tag,
    Activity, Brain, Sparkles, Clock, FileImage, CheckCircle2,
    AlertCircle, ChevronDown, MoreVertical
} from 'lucide-react';
import {
    type EstudioRadiologico, type ImageType, type ColorMap, type Anotacion,
    getEstudios, addEstudio, processEstudio, deleteEstudio,
    IMAGE_TYPES, COLOR_MAPS,
} from '../services/imagen.service';
import { DENTAL_PRESETS } from '../services/dicom.service';

interface RadiologiaProps {
    activeSubArea: string;
    brightness: number;
    contrast: number;
    sharpness: number;
    colorMap: ColorMap;
    onBrightnessChange: (v: number) => void;
    onContrastChange: (v: number) => void;
    onSharpnessChange: (v: number) => void;
    onColorMapChange: (v: ColorMap) => void;
    onStudySelect: (study: EstudioRadiologico | null) => void;
}

// ── HELPERS ────────────────────────────────────────────────────────────────────

const tipoLabel = (t: ImageType) => IMAGE_TYPES.find(x => x.value === t)?.label ?? t;

const formatBytes = (n?: number) => {
    if (!n) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (iso: string) => {
    try {
        return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return iso; }
};

// ── PACIENTES DEMO ─────────────────────────────────────────────────────────────
const DEMO_PATIENTS = [
    { id: 'P001', nombre: 'García López, María', dob: '1985-03-12' },
    { id: 'P002', nombre: 'Martínez Sánchez, Carlos', dob: '1972-07-24' },
    { id: 'P003', nombre: 'Rodríguez Pérez, Ana', dob: '1990-11-08' },
    { id: 'P004', nombre: 'López Fernández, José', dob: '1968-05-30' },
    { id: 'P005', nombre: 'Sánchez Ruiz, Laura', dob: '2002-02-14' },
];

// Estado global demo: 16 estudios de 5 pacientes distintos
const DEMO_STUDIES: EstudioRadiologico[] = [
    // ── P001 García López ─────────────────────────────────────────────────────
    {
        id: 'demo-p001-1', pacienteNumPac: 'P001', tipo: 'panoramica',
        nombre: 'PAN_GarciaLopez_20250115.dcm', fecha: '2025-01-15T09:30:00Z',
        doctor: 'Dra. Rubio', descripcion: 'Control anual. Caries incipiente en 36.',
        originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Panoramic_dental_X-ray.jpg/1280px-Panoramic_dental_X-ray.jpg',
        isProcessing: false, colorMap: 'grayscale', brightness: 0, contrast: 10, sharpness: 20,
        anotaciones: [
            { id: 'a1', tipo: 'texto', x: 35, y: 60, texto: 'Caries pieza 36', color: '#FF4444', autor: 'Dra. Rubio', fecha: '2025-01-15T09:40:00Z' },
            { id: 'a2', tipo: 'texto', x: 68, y: 55, texto: 'Revisar raíz 27', color: '#FFB800', autor: 'Dra. Rubio', fecha: '2025-01-15T09:42:00Z' },
        ],
        tags: ['control', 'caries', 'planmeca'], fileSize: 2621440,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P001_GarciaLopez\\20250115\\PAN_GarciaLopez_20250115.dcm',
        dicomMeta: { patientId: 'P001', studyDate: '20250115', modality: 'PX', kvp: 64, tubeCurrent: 4, exposureTime: 14200, studyDescription: 'Ortopantomografía', manufacturer: 'Planmeca ProMax', institutionName: 'Clínica Rubio García' }
    },
    {
        id: 'demo-p001-2', pacienteNumPac: 'P001', tipo: 'periapical',
        nombre: 'PERI_GarciaLopez_36_20250115.dcm', fecha: '2025-01-15T10:10:00Z',
        doctor: 'Dra. Rubio', descripcion: 'Periapical pieza 36 post-tratamiento.',
        originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Periapical_radiograph.jpg/640px-Periapical_radiograph.jpg',
        isProcessing: false, colorMap: 'grayscale', brightness: 5, contrast: 20, sharpness: 30,
        anotaciones: [],
        tags: ['endodoncia', 'pieza36'], fileSize: 524288,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P001_GarciaLopez\\20250115\\PERI_36_20250115.dcm',
        dicomMeta: { patientId: 'P001', studyDate: '20250115', modality: 'IO', kvp: 60, tubeCurrent: 7, exposureTime: 380, studyDescription: 'Rx Periapical 36', manufacturer: 'Planmeca ProSensor', institutionName: 'Clínica Rubio García' }
    },
    {
        id: 'demo-p001-3', pacienteNumPac: 'P001', tipo: 'intraoral',
        nombre: 'FOTO_intraoral_P001_anterior.jpg', fecha: '2025-01-15T10:30:00Z',
        doctor: 'Dra. Rubio', descripcion: 'Foto intraoral sector anterior. Pre-blanqueamiento.',
        originalUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e19?w=800&q=80',
        isProcessing: false, colorMap: 'grayscale', brightness: 0, contrast: 0, sharpness: 0,
        anotaciones: [], tags: ['blanqueamiento', 'estetica', 'preop'], fileSize: 1887436,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P001_GarciaLopez\\20250115\\FOTO_intraoral_anterior.jpg',
    },

    // ── P002 Martínez Sánchez ─────────────────────────────────────────────────
    {
        id: 'demo-p002-1', pacienteNumPac: 'P002', tipo: 'dicom',
        nombre: 'CBCT_MartinezSanchez_20241220.dcm', fecha: '2024-12-20T11:00:00Z',
        doctor: 'Dr. García', descripcion: 'CBCT implantología. Valoración hueso zona 1.6.',
        originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Animated_gif_of_MRI_brain_scan.gif/220px-Animated_gif_of_MRI_brain_scan.gif',
        isProcessing: false, colorMap: 'bone', brightness: 0, contrast: 30, sharpness: 0,
        anotaciones: [
            { id: 'b1', tipo: 'texto', x: 50, y: 40, texto: 'Zona implante 1.6 — 8mm', color: '#44FF88', autor: 'Dr. García', fecha: '2024-12-20T11:30:00Z' },
        ],
        tags: ['implante', 'cbct', 'planmeca', 'romexis'], fileSize: 127920426,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P002_MartinezSanchez\\20241220\\CBCT_Implante_16.dcm',
        dicomMeta: { patientId: 'P002', studyDate: '20241220', modality: 'CT', kvp: 84, tubeCurrent: 4, exposureTime: 14000, studyDescription: 'CBCT Implantología 1.6', manufacturer: 'Planmeca ProMax 3D', institutionName: 'Clínica Rubio García' }
    },
    {
        id: 'demo-p002-2', pacienteNumPac: 'P002', tipo: 'panoramica',
        nombre: 'PAN_MartinezSanchez_20241220.dcm', fecha: '2024-12-20T10:15:00Z',
        doctor: 'Dr. García', descripcion: 'Panorámica preoperatoria implante.',
        originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Panoramic_dental_X-ray.jpg/1280px-Panoramic_dental_X-ray.jpg',
        isProcessing: false, colorMap: 'grayscale', brightness: 0, contrast: 15, sharpness: 25,
        anotaciones: [], tags: ['implante', 'preop', 'planmeca'], fileSize: 2621440,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P002_MartinezSanchez\\20241220\\PAN_preop.dcm',
        dicomMeta: { patientId: 'P002', studyDate: '20241220', modality: 'PX', kvp: 64, tubeCurrent: 4, exposureTime: 14200, studyDescription: 'Ortopantomografía preop', manufacturer: 'Planmeca ProMax', institutionName: 'Clínica Rubio García' }
    },
    {
        id: 'demo-p002-3', pacienteNumPac: 'P002', tipo: 'extraoral',
        nombre: 'FOTO_extraoral_frontal_P002.jpg', fecha: '2024-12-20T09:55:00Z',
        doctor: 'Dr. García', descripcion: 'Foto extraoral frontal en reposo y sonrisa.',
        originalUrl: 'https://images.unsplash.com/photo-1559591937-2f4a83e7a3dc?w=800&q=80',
        isProcessing: false, colorMap: 'grayscale', brightness: 0, contrast: 0, sharpness: 0,
        anotaciones: [], tags: ['documentacion', 'estetica'], fileSize: 3145728,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P002_MartinezSanchez\\20241220\\FOTO_extraoral_frontal.jpg',
    },

    // ── P003 Rodríguez Pérez ──────────────────────────────────────────────────
    {
        id: 'demo-p003-1', pacienteNumPac: 'P003', tipo: 'cefalometrica',
        nombre: 'CEFA_RodriguezPerez_20250210.dcm', fecha: '2025-02-10T08:30:00Z',
        doctor: 'Dra. Rubio', descripcion: 'Teleradiografía lateral. Inicio ortodoncia.',
        originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Lateral_cephalometric_radiograph.jpg/640px-Lateral_cephalometric_radiograph.jpg',
        isProcessing: false, colorMap: 'grayscale', brightness: 0, contrast: 20, sharpness: 15,
        anotaciones: [
            { id: 'c1', tipo: 'texto', x: 55, y: 35, texto: 'ANB: 4.2° — Clase II', color: '#4488FF', autor: 'Dra. Rubio', fecha: '2025-02-10T09:00:00Z' },
        ],
        tags: ['ortodoncia', 'cefalometria', 'inicio'], fileSize: 2097152,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P003_RodriguezPerez\\20250210\\CEFA_lateral.dcm',
        dicomMeta: { patientId: 'P003', studyDate: '20250210', modality: 'PX', kvp: 73, tubeCurrent: 12, exposureTime: 12000, studyDescription: 'Teleradiografía Lateral', manufacturer: 'Planmeca ProMax', institutionName: 'Clínica Rubio García' }
    },
    {
        id: 'demo-p003-2', pacienteNumPac: 'P003', tipo: 'panoramica',
        nombre: 'PAN_RodriguezPerez_20250210.dcm', fecha: '2025-02-10T08:00:00Z',
        doctor: 'Dra. Rubio', descripcion: 'Ortodoncia — fase inicial. Apiñamiento moderado.',
        originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Panoramic_dental_X-ray.jpg/1280px-Panoramic_dental_X-ray.jpg',
        isProcessing: false, colorMap: 'grayscale', brightness: 0, contrast: 10, sharpness: 20,
        anotaciones: [], tags: ['ortodoncia', 'inicio', 'planmeca'], fileSize: 2621440,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P003_RodriguezPerez\\20250210\\PAN_ortodoncia.dcm',
        dicomMeta: { patientId: 'P003', studyDate: '20250210', modality: 'PX', kvp: 64, tubeCurrent: 4, exposureTime: 14200, studyDescription: 'Ortopantomografía ortodoncia', manufacturer: 'Planmeca ProMax', institutionName: 'Clínica Rubio García' }
    },
    {
        id: 'demo-p003-3', pacienteNumPac: 'P003', tipo: 'intraoral',
        nombre: 'FOTO_oclusal_sup_P003.jpg', fecha: '2025-02-10T08:45:00Z',
        doctor: 'Dra. Rubio', descripcion: 'Vista oclusal superior. Mordida cruzada posterior.',
        originalUrl: 'https://images.unsplash.com/photo-1588776814546-1ffbb2f6e228?w=800&q=80',
        isProcessing: false, colorMap: 'grayscale', brightness: 0, contrast: 0, sharpness: 0,
        anotaciones: [], tags: ['ortodoncia', 'oclusal'], fileSize: 2359296,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P003_RodriguezPerez\\20250210\\FOTO_oclusal_sup.jpg',
    },
    {
        id: 'demo-p003-4', pacienteNumPac: 'P003', tipo: 'extraoral',
        nombre: 'FOTO_perfil_P003.jpg', fecha: '2025-02-10T08:50:00Z',
        doctor: 'Dra. Rubio', descripcion: 'Perfil derecho. Convexidad facial aumentada.',
        originalUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
        isProcessing: false, colorMap: 'grayscale', brightness: 0, contrast: 0, sharpness: 0,
        anotaciones: [], tags: ['ortodoncia', 'perfil'], fileSize: 1572864,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P003_RodriguezPerez\\20250210\\FOTO_perfil_der.jpg',
    },

    // ── P004 López Fernández ──────────────────────────────────────────────────
    {
        id: 'demo-p004-1', pacienteNumPac: 'P004', tipo: 'dicom',
        nombre: 'CBCT_LopezFernandez_20250118.dcm', fecha: '2025-01-18T14:00:00Z',
        doctor: 'Dr. García', descripcion: 'CBCT endodoncia. Evaluación ápices 1.1-1.3.',
        originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Animated_gif_of_MRI_brain_scan.gif/220px-Animated_gif_of_MRI_brain_scan.gif',
        isProcessing: false, colorMap: 'bone', brightness: 0, contrast: 30, sharpness: 0,
        anotaciones: [], tags: ['endodoncia', 'cbct', 'planmeca', 'romexis'], fileSize: 89400000,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P004_LopezFernandez\\20250118\\CBCT_Endodoncia_anterior.dcm',
        dicomMeta: { patientId: 'P004', studyDate: '20250118', modality: 'CT', kvp: 84, tubeCurrent: 4, exposureTime: 14000, studyDescription: 'CBCT Endodoncia Sector Anterior', manufacturer: 'Planmeca ProMax 3D', institutionName: 'Clínica Rubio García' }
    },
    {
        id: 'demo-p004-2', pacienteNumPac: 'P004', tipo: 'periapical',
        nombre: 'PERI_LopezFernandez_11_20250118.dcm', fecha: '2025-01-18T13:30:00Z',
        doctor: 'Dr. García', descripcion: 'Periapical pieza 1.1. Lesión apical 3mm.',
        originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Periapical_radiograph.jpg/640px-Periapical_radiograph.jpg',
        isProcessing: false, colorMap: 'grayscale', brightness: 10, contrast: 25, sharpness: 35,
        anotaciones: [
            { id: 'd1', tipo: 'texto', x: 48, y: 72, texto: 'Lesión apical — 3mm', color: '#FF4444', autor: 'Dr. García', fecha: '2025-01-18T13:45:00Z' },
        ],
        tags: ['endodoncia', 'lesion', 'pieza11'], fileSize: 524288,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P004_LopezFernandez\\20250118\\PERI_11.dcm',
        dicomMeta: { patientId: 'P004', studyDate: '20250118', modality: 'IO', kvp: 59, tubeCurrent: 7, exposureTime: 360, studyDescription: 'Rx Periapical 1.1', manufacturer: 'Planmeca ProSensor', institutionName: 'Clínica Rubio García' }
    },
    {
        id: 'demo-p004-3', pacienteNumPac: 'P004', tipo: 'panoramica',
        nombre: 'PAN_LopezFernandez_20250118.dcm', fecha: '2025-01-18T13:10:00Z',
        doctor: 'Dr. García', descripcion: 'Control. Edentulismo parcial inferior.',
        originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Panoramic_dental_X-ray.jpg/1280px-Panoramic_dental_X-ray.jpg',
        isProcessing: false, colorMap: 'grayscale', brightness: 0, contrast: 10, sharpness: 20,
        anotaciones: [], tags: ['control', 'edentulismo', 'planmeca'], fileSize: 2621440,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P004_LopezFernandez\\20250118\\PAN_control.dcm',
        dicomMeta: { patientId: 'P004', studyDate: '20250118', modality: 'PX', kvp: 64, tubeCurrent: 4, exposureTime: 14200, studyDescription: 'Ortopantomografía', manufacturer: 'Planmeca ProMax', institutionName: 'Clínica Rubio García' }
    },

    // ── P005 Sánchez Ruiz ─────────────────────────────────────────────────────
    {
        id: 'demo-p005-1', pacienteNumPac: 'P005', tipo: 'panoramica',
        nombre: 'PAN_SanchezRuiz_20250228.dcm', fecha: '2025-02-28T16:00:00Z',
        doctor: 'Dra. Rubio', descripcion: 'Revisión cordales. Impactación 48.',
        originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Panoramic_dental_X-ray.jpg/1280px-Panoramic_dental_X-ray.jpg',
        isProcessing: false, colorMap: 'grayscale', brightness: 0, contrast: 10, sharpness: 20,
        anotaciones: [
            { id: 'e1', tipo: 'texto', x: 82, y: 70, texto: '4.8 impactado — extracción', color: '#FF4444', autor: 'Dra. Rubio', fecha: '2025-02-28T16:15:00Z' },
        ],
        tags: ['cordales', 'cirugia', 'planmeca'], fileSize: 2621440,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P005_SanchezRuiz\\20250228\\PAN_cordales.dcm',
        dicomMeta: { patientId: 'P005', studyDate: '20250228', modality: 'PX', kvp: 64, tubeCurrent: 4, exposureTime: 14200, studyDescription: 'Ortopantomografía cordales', manufacturer: 'Planmeca ProMax', institutionName: 'Clínica Rubio García' }
    },
    {
        id: 'demo-p005-2', pacienteNumPac: 'P005', tipo: 'intraoral',
        nombre: 'FOTO_intraoral_P005_48.jpg', fecha: '2025-02-28T16:20:00Z',
        doctor: 'Dra. Rubio', descripcion: 'Intraoral sector posterior derecho. 4.8 en erupción.',
        originalUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e19?w=800&q=80',
        isProcessing: false, colorMap: 'grayscale', brightness: 0, contrast: 0, sharpness: 0,
        anotaciones: [], tags: ['cordales', 'cirugia'], fileSize: 2097152,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P005_SanchezRuiz\\20250228\\FOTO_intraoral_48.jpg',
    },
    {
        id: 'demo-p005-3', pacienteNumPac: 'P005', tipo: 'extraoral',
        nombre: 'FOTO_frontal_sonrisa_P005.jpg', fecha: '2025-02-28T15:55:00Z',
        doctor: 'Dra. Rubio', descripcion: 'Foto frontal sonrisa. Documentación pre-ortodoncia.',
        originalUrl: 'https://images.unsplash.com/photo-1487222444687-3c4a79d65003?w=800&q=80',
        isProcessing: false, colorMap: 'grayscale', brightness: 0, contrast: 0, sharpness: 0,
        anotaciones: [], tags: ['estetica', 'documentacion'], fileSize: 1835008,
        rutaOrigen: '\\\\SERVIDOR-CLINICA\\Romexis\\Pacientes\\P005_SanchezRuiz\\20250228\\FOTO_frontal_sonrisa.jpg',
    },
];

// ── TIPOS FILTRO ────────────────────────────────────────────────────────────────

type FilterType = 'all' | ImageType;
type ToolMode = 'select' | 'text' | 'arrow' | 'circle' | 'ruler' | 'pan';

// ── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────────

const Radiologia: React.FC<RadiologiaProps> = ({
    activeSubArea, brightness, contrast, sharpness, colorMap,
    onBrightnessChange, onContrastChange, onSharpnessChange, onColorMapChange, onStudySelect
}) => {
    const [estudios, setEstudios] = useState<EstudioRadiologico[]>(DEMO_STUDIES);
    const [selectedId, setSelectedId] = useState<string | null>(DEMO_STUDIES[0].id);
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<string | 'all'>('all');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [showInfo, setShowInfo] = useState(true);
    const [cbctViewerFile, setCbctViewerFile] = useState<File | null>(null);

    // Notifica al padre (App → Sidebar) cuando cambia el estudio seleccionado
    React.useEffect(() => {
        const s = estudios.find(e => e.id === selectedId) ?? null;
        onStudySelect(s);
    }, [selectedId, estudios]);

    // ── Estado elevado del visor CBCT (antes vivía dentro de CbctViewer) ─────
    const [cbctWC, setCbctWC] = useState(500);
    const [cbctWW, setCbctWW] = useState(2500);
    const [cbctPreset, setCbctPreset] = useState('hueso');
    const [cbctLayout, setCbctLayout] = useState<'4x' | ViewId>('4x');
    const [cbctInvert, setCbctInvert] = useState(false);
    const [cbctProgress, setCbctProgress] = useState<CbctProgress>({ pano: 0, mip: 0, cefa: 0 });
    const cbctPanoRef = useRef<HTMLCanvasElement>(null);
    const cbctMipRef = useRef<HTMLCanvasElement>(null);
    const cbctCefaRef = useRef<HTMLCanvasElement>(null);
    // Mapa: estudioId → File real (para abrir directamente sin pedir de nuevo)
    const fileMapRef = useRef<Map<string, File>>(new Map());

    // Visor
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [activeTool, setActiveTool] = useState<ToolMode>('select');
    const [compareMode, setCompareMode] = useState(false);

    // AI Panel
    const [localBrightness, setLocalBrightness] = useState(0);
    const [localContrast, setLocalContrast] = useState(0);
    const [localSharpness, setLocalSharpness] = useState(0);
    const [selectedColorMap, setSelectedColorMap] = useState<ColorMap>('grayscale');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhanceSuccess, setEnhanceSuccess] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Anotaciones en vivo
    const [drawingAnnotation, setDrawingAnnotation] = useState<Partial<Anotacion> | null>(null);
    const [annotColor, setAnnotColor] = useState('#FF4444');
    const [newAnnotText, setNewAnnotText] = useState('');
    const [showAnnotInput, setShowAnnotInput] = useState(false);
    const [annotPos, setAnnotPos] = useState({ x: 0, y: 0 });

    const viewerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isPanning = useRef(false);
    const lastPan = useRef({ x: 0, y: 0 });

    const selected = estudios.find(e => e.id === selectedId);
    const displayUrl = selected
        ? (selected.colorizedUrl ?? selected.enhancedUrl ?? selected.originalUrl)
        : null;


    // ── Filtrar estudios ────────────────────────────────────────────────────────
    const filtered = estudios.filter(e => {
        const matchType = filterType === 'all' || e.tipo === filterType;
        const matchPatient = selectedPatient === 'all' || e.pacienteNumPac === selectedPatient;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || e.nombre.toLowerCase().includes(q)
            || e.descripcion.toLowerCase().includes(q)
            || e.doctor.toLowerCase().includes(q)
            || e.tags.some(t => t.toLowerCase().includes(q));
        return matchType && matchPatient && matchSearch;
    });

    // Agrupar por paciente para la galería
    const groupedByPatient = DEMO_PATIENTS.map(p => ({
        patient: p,
        estudios: filtered.filter(e => e.pacienteNumPac === p.id),
    })).filter(g => g.estudios.length > 0);
    const unassigned = filtered.filter(e => !DEMO_PATIENTS.find(p => p.id === e.pacienteNumPac));


    // ── Sincronizar ajustes al cambiar imagen ────────────────────────────────
    useEffect(() => {
        if (selected) {
            setLocalBrightness(selected.brightness);
            setLocalContrast(selected.contrast);
            setLocalSharpness(selected.sharpness);
            setSelectedColorMap(selected.colorMap);
            setZoom(1);
            setRotation(0);
            setFlipH(false);
            setFlipV(false);
            setPanX(0);
            setPanY(0);
        }
    }, [selectedId]);

    // ── Upload ────────────────────────────────────────────────────────────────
    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setIsUploading(true);
        for (const file of Array.from(files)) {
            const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
            const isDicom = ['dcm', 'dic', 'dicom'].includes(ext);
            const tipo: ImageType = isDicom ? 'dicom'
                : ['jpg', 'jpeg', 'png', 'bmp', 'webp'].includes(ext) ? 'panoramica'
                    : 'extraoral';
            try {
                const nuevo = await addEstudio(file, {
                    pacienteNumPac: 'ACTUAL',
                    tipo,
                    doctor: 'Dra. Rubio',
                    descripcion: 'Importado desde archivo',
                });
                setEstudios(prev => [nuevo, ...prev]);
                setSelectedId(nuevo.id);
                // Guardar referencia al archivo real
                fileMapRef.current.set(nuevo.id, file);
                // Si es DICOM → abrir visor CBCT automáticamente
                if (isDicom) {
                    setCbctViewerFile(file);
                    setShowUpload(false);
                }
            } catch (err) {
                console.error('Error cargando archivo:', err);
            }
        }
        setIsUploading(false);
        if (!fileMapRef.current.has(selectedId ?? '')) setShowUpload(false);
    }, [selectedId]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    // ── AI Enhance ────────────────────────────────────────────────────────────
    const handleEnhance = async () => {
        if (!selected) return;
        setIsEnhancing(true);
        setEnhanceSuccess(false);
        try {
            const updated = await processEstudio(selected.id, {
                enhance: true,
                colorMap: selectedColorMap,
                brightness: localBrightness,
                contrast: localContrast,
                sharpness: localSharpness,
            });
            setEstudios(prev => prev.map(e => e.id === updated.id ? updated : e));
            setEnhanceSuccess(true);
            setTimeout(() => setEnhanceSuccess(false), 2000);
        } catch (e) {
            console.error(e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleColorMap = async (map: ColorMap) => {
        setSelectedColorMap(map);
        if (!selected) return;
        try {
            const updated = await processEstudio(selected.id, {
                colorMap: map,
                brightness: localBrightness,
                contrast: localContrast,
                sharpness: localSharpness,
            });
            setEstudios(prev => prev.map(e => e.id === updated.id ? updated : e));
        } catch (e) {
            console.error(e);
        }
    };

    // ── Zoom & Viewer ─────────────────────────────────────────────────────────
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.2, Math.min(5, prev + delta)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (activeTool === 'pan') {
            isPanning.current = true;
            lastPan.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning.current && activeTool === 'pan') {
            setPanX(px => px + (e.clientX - lastPan.current.x));
            setPanY(py => py + (e.clientY - lastPan.current.y));
            lastPan.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => { isPanning.current = false; };

    const resetView = () => {
        setZoom(1);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setPanX(0);
        setPanY(0);
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = (id: string) => {
        const isDemoStudy = DEMO_STUDIES.some(d => d.id === id);
        if (isDemoStudy) return; // No borrar demos
        deleteEstudio(id);
        setEstudios(prev => prev.filter(e => e.id !== id));
        if (selectedId === id) setSelectedId(estudios[0]?.id ?? null);
    };

    // ── Anotaciones ───────────────────────────────────────────────────────────
    const handleViewerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (activeTool !== 'text' || !selected) return;
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setAnnotPos({ x, y });
        setShowAnnotInput(true);
    };

    const submitAnnotation = () => {
        if (!selected || !newAnnotText.trim()) { setShowAnnotInput(false); return; }
        const newAn: Anotacion = {
            id: `an-${Date.now()}`, tipo: 'texto',
            x: annotPos.x, y: annotPos.y,
            texto: newAnnotText, color: annotColor, autor: 'Dra. Rubio', fecha: new Date().toISOString(),
        };
        setEstudios(prev => prev.map(e => e.id === selected.id
            ? { ...e, anotaciones: [...e.anotaciones, newAn] }
            : e));
        setNewAnnotText('');
        setShowAnnotInput(false);
    };

    // ── Download ──────────────────────────────────────────────────────────────
    const handleDownload = () => {
        if (!displayUrl || !selected) return;
        const a = document.createElement('a');
        a.href = displayUrl;
        a.download = `${selected.nombre.replace(/\.[^.]+$/, '')}_SmilePro.webp`;
        a.click();
    };

    // ─ Abrir en Planmeca Romexis Viewer (app nativa Mac) ─────────────
    const openInRomexis = async () => {
        const filePath = selected?.rutaOrigen ?? null;
        try {
            const res = await fetch('/api/open-romexis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath }),
            });
            if (!res.ok) throw new Error(await res.text());
        } catch (e) {
            console.error('[Romexis]', e);
            alert('No se pudo abrir Romexis. Asegúrate de que la app está en la ubicación correcta.');
        }
    };

    // ─ Abrir en Weasis (open-source DICOM viewer via weasis:// URI) ───
    // No necesita servidor — Weasis registra su propio protocolo al instalarse.
    // URI: weasis://?$dicom:get -l "/ruta/archivo.dcm"
    const openInWeasis = () => {
        const filePath = selected?.rutaOrigen;
        if (filePath) {
            // Abrir archivo local
            const cmd = `$dicom:get -l "${filePath}"`;
            const uri = `weasis://?${encodeURIComponent(cmd)}`;
            window.location.href = uri;
        } else {
            // Sin ruta: abrir Weasis en blanco
            window.location.href = 'weasis://';
        }
    };

    // ── RENDER ────────────────────────────────────────────────────────────────────

    // ── Vista: Galería de Estudios ─────────────────────────────────────────────
    if (activeSubArea === 'Gestión de Archivos') {
        return <FileManagerView estudios={estudios} onDelete={handleDelete} onSelect={setSelectedId} />;
    }

    // ── Vista: Visor DICOM multi-corte (pantalla completa) ────────────────────
    return (
        <div className="h-[calc(100vh-80px)] min-h-0 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            <DicomViewer
                file={cbctViewerFile}
                url={!cbctViewerFile ? '/sample_cbct.dcm' : undefined}
            />
        </div>
    );
}

export default Radiologia;

