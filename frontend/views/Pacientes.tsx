
import React, { useState, useEffect } from 'react';
import { usePermission } from '../hooks/usePermission';
import SOAPEditor from '../components/pacientes/SOAPEditor';
import PatientSearchModal from '../components/pacientes/PatientSearchModal';
import AlertasPanel from '../components/pacientes/AlertasPanel';
import Odontograma from '../components/pacientes/Odontograma';
import Periodontograma from '../components/pacientes/Periodontograma';
import Economica from '../components/pacientes/Economica';
import Documentos from '../components/pacientes/Documentos';
import QuestionnairePanel from '../components/pacientes/QuestionnairePanel';
import { SOAPNote, Paciente } from '../types';
import {
    Activity, CheckCircle, Clock, Brain, Camera,
    FileText, CircleDollarSign, ChevronDown, ChevronUp,
    Stethoscope, ShieldCheck, ShieldAlert, Pencil,
    Phone, Calendar, MessageSquare, ArrowLeftRight, ExternalLink, Maximize2,
    Gavel, UserPlus, TrendingUp, AlertTriangle, X, Plus, Save, Pill, Search
} from 'lucide-react';
import {
    getPatientPanoramicas, isRomexisConfigured, type RomexisPanoramica
} from '../services/romexis.service';
import {
    getPatientPhotos, isGDriveConfigured, type PatientPhoto
} from '../services/gdrive.service';
import {
    getMedications, getAllergies, upsertMedication, deleteMedication,
    upsertAllergy, deleteAllergy, isSupabaseConfigured,
    type PatientMedication, type PatientAllergy
} from '../services/supabase.service';
import { generateId } from '../services/db';

import {
    getSoapNotes, createSoapNote, updateSoapNote,
} from '../services/soap.service';
import { getEntradasMedicas, getTratamientosPaciente } from '../services/citas.service';
import { searchVademecum, type Medicamento } from '../data/vademecum';
import { Badge, AccessDenied } from '../components/UI';

interface PacientesProps {
    activeSubArea: string;
    onSubAreaChange: (subArea: string) => void;
    onPatientChange?: (paciente: import('../types').Paciente | null) => void;
    initialPaciente?: import('../types').Paciente | null;
    initialNumPac?: string;
    requestedNumPac?: string | null;      // Senal externa: abrir este paciente (desde Dashboard u otra area)
    onRequestedHandled?: () => void;      // Notifica que se proceso el requestedNumPac
    onNavigate: (area: string, subArea?: string, citaData?: Partial<import('../types').Cita>, waData?: { phone: string; name: string }) => void;
    showToast: (message: string) => void;
}


// Color por especialidad
const especialidadConfig: Record<string, { dot: string; badge: string; border: string }> = {
    'Implantología': { dot: 'bg-[#E03555]', badge: 'bg-[#FFE0E6] text-[#C02040] border-[#FF9BAD]', border: 'border-l-rose-600' },
    'Higiene': { dot: 'bg-[#051650]', badge: 'bg-blue-100 text-[#051650] border-blue-300', border: 'border-l-[#051650]' },
    'Higiene Dental': { dot: 'bg-[#051650]', badge: 'bg-blue-100 text-[#051650] border-blue-300', border: 'border-l-[#051650]' },
    'Ortodoncia': { dot: 'bg-blue-600', badge: 'bg-blue-100 text-blue-900 border-blue-300', border: 'border-l-blue-600' },
    'Odontología General': { dot: 'bg-slate-600', badge: 'bg-slate-200 text-slate-800 border-slate-400', border: 'border-l-slate-600' },
    'Diagnóstico': { dot: 'bg-slate-600', badge: 'bg-slate-200 text-slate-800 border-slate-400', border: 'border-l-slate-600' },
    'Urgencia': { dot: 'bg-[#E8EA50]', badge: 'bg-[#FEFCC4] text-[#051650] border-[#FBFFA3]', border: 'border-l-amber-600' },
    'Cirugía': { dot: 'bg-purple-600', badge: 'bg-purple-100 text-purple-900 border-purple-300', border: 'border-l-purple-600' },
    'Cirugía Oral': { dot: 'bg-purple-600', badge: 'bg-purple-100 text-purple-900 border-purple-300', border: 'border-l-purple-600' },
    'Endodoncia': { dot: 'bg-orange-600', badge: 'bg-orange-100 text-orange-900 border-orange-300', border: 'border-l-orange-600' },
    'Periodoncia': { dot: 'bg-teal-600', badge: 'bg-teal-100 text-teal-900 border-teal-300', border: 'border-l-teal-600' },
    'Implante': { dot: 'bg-[#E03555]', badge: 'bg-[#FFE0E6] text-[#C02040] border-[#FF9BAD]', border: 'border-l-rose-600' },
    'General': { dot: 'bg-slate-600', badge: 'bg-slate-200 text-slate-800 border-slate-400', border: 'border-l-slate-600' },
};
const getEsp = (esp: string) => especialidadConfig[esp] ?? especialidadConfig['General'];

/** Infiere la especialidad dominante a partir de los nombre de tratamientos */
const inferEspecialidad = (tratamientos: string[]): string => {
    const joined = tratamientos.join(' ').toLowerCase();
    if (/implante|osteo|interfase|aditamento|seno|prgf|plasma/.test(joined)) return 'Implantología';
    if (/ortodoncia|retenedor|bracket|alineador/.test(joined)) return 'Ortodoncia';
    if (/endodoncia|conducto|pulp/.test(joined)) return 'Endodoncia';
    if (/curetaje|periodoncia|raspado|sondaje/.test(joined)) return 'Periodoncia';
    if (/prótesis|corona|puente|póntico|prostodoncia/.test(joined)) return 'Prostodoncia';
    if (/cirugía|exodoncia|extracción|alvéolo/.test(joined)) return 'Cirugía Oral';
    if (/blanqueamiento|carilla|estética|composite/.test(joined)) return 'Estética Dental';
    if (/limpieza|higiene|tartrectomía|profilaxis/.test(joined)) return 'Higiene';
    return 'Odontología General';
};


const Pacientes: React.FC<PacientesProps> = ({ activeSubArea, onSubAreaChange, onPatientChange, initialPaciente, initialNumPac, requestedNumPac, onRequestedHandled, onNavigate, showToast }) => {
    // VLN-012 FIX: Guard de acceso clínico
    const canViewHistoria = usePermission('view_historia_clinica');
    const canViewPacientes = usePermission('view_pacientes');

    // initialPaciente se usa como estado inicial síncrono — no hay flash en blanco
    const [paciente, setPaciente] = useState<Paciente | null>(initialPaciente ?? null);

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchInitialView, setSearchInitialView] = useState<'search' | 'create'>('search');
    const [iaDentalTyped, setIaDentalTyped] = useState('');
    const iaDentalText = `Paciente con recurrencia en dolor. Alergia al látex activa — asegurar material alternativo en G1. RX control pieza 2.5 recomendado. Considerar revisión periodoncia en próxima visita.`;
    // Cuadrantes state
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [panoramicaIdx, setPanoramicaIdx] = useState(0);
    const [fotoIdx, setFotoIdx] = useState(0);
    const [panoramicas, setPanoramicas] = useState<RomexisPanoramica[]>([]);
    const [fotos, setFotos] = useState<PatientPhoto[]>([]);
    const [loadingRX, setLoadingRX] = useState(true);
    const [loadingFotos, setLoadingFotos] = useState(true);

    // Alertas + Medicación state
    const [medications, setMedications] = useState<PatientMedication[]>([]);
    const [allergies, setAllergies] = useState<PatientAllergy[]>([]);
    const [alertEditMode, setAlertEditMode] = useState(false);
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const [newAllergyText, setNewAllergyText] = useState('');
    const [medQuery, setMedQuery] = useState('');
    const [medSuggestions, setMedSuggestions] = useState<Medicamento[]>([]);
    // Edición de filiación
    const [editFiliacion, setEditFiliacion] = useState(false);
    const [editFiliacionData, setEditFiliacionData] = useState<{ nombre: string; apellidos: string; telefono: string; dni: string; fechaNacimiento: string }>({ nombre: '', apellidos: '', telefono: '', dni: '', fechaNacimiento: '' });

    // Inicializar alergias y medicaciones desde el paciente + Supabase
    useEffect(() => {
        if (!paciente?.numPac) return;
        if (isSupabaseConfigured()) {
            getAllergies(paciente.numPac).then(a => { if (a.length) setAllergies(a); });
            getMedications(paciente.numPac).then(m => { if (m.length) setMedications(m); });
        }
        // Cargar entradas médicas reales desde TtosMed
        const idPac = paciente.idPac;
        Promise.all([
            getSoapNotes(paciente.numPac),
            idPac ? getEntradasMedicas(idPac) : Promise.resolve([]),
        ]).then(([soapNotes, entradasMedicas]) => {
            // LOG-01 FIX: deduplicar por tratamiento_id (no por id primario — UUID vs 'ttomed-X' nunca coinciden)
            const soapTtosIds = new Set(
                soapNotes.filter(n => n.tratamiento_id).map(n => String(n.tratamiento_id))
            );
            const combined = [
                ...soapNotes,
                ...entradasMedicas.filter(e =>
                    !e.tratamiento_id || !soapTtosIds.has(String(e.tratamiento_id))
                ),
            ];
            if (combined.length > 0) {
                setPaciente(prev => prev ? { ...prev, historial: combined } : prev);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paciente?.numPac]);

    // Autocompletado del vademecum
    useEffect(() => {
        setMedSuggestions(searchVademecum(medQuery));
    }, [medQuery]);


    // Restaurar paciente anterior al volver al módulo (persistencia cross-área)
    // Se ejecuta al MONTAR siempre ([] vacío) — no solo cuando initialNumPac "cambia"
    // porque el componente desmonta/monta al cambiar de área y el valor puede ser el mismo.
    useEffect(() => {
        if (!initialNumPac) return;
        import('../services/pacientes.service').then(({ getPaciente }) => {
            getPaciente(initialNumPac).then(p => {
                if (p) setPaciente(p);
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Señal externa: Dashboard (numPac) u otra área pide abrir un paciente concreto
    // Usa searchPacientes (caché client-side) — evita el bug del FDW SQL Server con getPaciente
    useEffect(() => {
        if (!requestedNumPac) return;
        import('../services/pacientes.service').then(({ searchPacientes }) => {
            searchPacientes(requestedNumPac).then(found => {
                // Buscar coincidencia exacta de numPac primero
                const p = found.find(x => x.numPac === requestedNumPac) ?? found[0];
                if (p) {
                    setPaciente(p);
                    onPatientChange?.(p);
                }
                onRequestedHandled?.();
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestedNumPac]);


    useEffect(() => {
        if (activeSubArea === 'ACTION_SEARCH') { setSearchInitialView('search'); setIsSearchOpen(true); onSubAreaChange('Historia Clínica'); }
        else if (activeSubArea === 'ACTION_NEW') { setSearchInitialView('create'); setIsSearchOpen(true); onSubAreaChange('Historia Clínica'); }
    }, [activeSubArea, onSubAreaChange]);

    // IA Dental typing effect
    useEffect(() => {
        setIaDentalTyped('');
        let i = 0;
        const timer = setInterval(() => {
            setIaDentalTyped(iaDentalText.slice(0, i + 1));
            i++;
            if (i >= iaDentalText.length) clearInterval(timer);
        }, 18);
        return () => clearInterval(timer);
    }, [paciente?.numPac]);

    const handleSelectPatient = (p: Paciente) => {
        setPaciente(p);
        onPatientChange?.(p);
        showToast(`Cargando ficha de ${p.nombre}`);
    };

    const handleSaveNote = async (noteData: {
        subjetivo: string; objetivo: string; analisis: string; plan: string;
        eva: number; fecha?: string; especialidad?: string;
        tratamiento_id?: number; tratamiento_nombre?: string;
        pieza?: number; cuadrante?: number; arcada?: string;
    }) => {
        const fechaDisplay = noteData.fecha
            ? new Date(noteData.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
            : new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const newNote: SOAPNote = {
            id: Date.now().toString(),
            fecha: fechaDisplay,
            doctor: 'Elena Rubio',
            especialidad: noteData.especialidad || 'General',
            subjetivo: noteData.subjetivo || '',
            objetivo: noteData.objetivo || '',
            analisis: noteData.analisis || '',
            plan: noteData.plan || '',
            firmada: true,
            eva: noteData.eva || 0,
            timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
            alertasDetectadas: [],
            tratamiento_id: noteData.tratamiento_id,
            tratamiento_nombre: noteData.tratamiento_nombre,
            pieza: noteData.pieza,
            cuadrante: noteData.cuadrante,
            arcada: noteData.arcada,
        };
        if (paciente.numPac) {
            const savedNote = await createSoapNote(paciente.numPac, newNote);
            const finalNote = savedNote ?? newNote;
            setPaciente(prev => ({ ...prev, historial: [finalNote, ...prev.historial] }));
            showToast('Evolutivo registrado legalmente');
        }
    };

    const handleUpdateNote = async (id: string, data: {
        subjetivo: string; objetivo: string; analisis: string; plan: string;
        eva: number; fecha?: string; especialidad?: string;
        tratamiento_id?: number; tratamiento_nombre?: string;
        pieza?: number; cuadrante?: number; arcada?: string;
    }) => {
        await updateSoapNote(id, {
            subjetivo: data.subjetivo, objetivo: data.objetivo,
            analisis: data.analisis, plan: data.plan,
            eva: data.eva,
            ...(data.fecha ? { fecha: data.fecha } : {}),
            ...(data.especialidad ? { especialidad: data.especialidad } : {}),
            tratamiento_id: data.tratamiento_id,
            tratamiento_nombre: data.tratamiento_nombre,
            pieza: data.pieza,
            cuadrante: data.cuadrante,
            arcada: data.arcada,
        });
        setPaciente(prev => ({
            ...prev,
            historial: prev.historial.map(n =>
                n.id === id
                    ? {
                        ...n,
                        subjetivo: data.subjetivo,
                        objetivo: data.objetivo,
                        analisis: data.analisis,
                        plan: data.plan,
                        eva: data.eva,
                        fecha: data.fecha
                            ? new Date(data.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                            : n.fecha,
                        especialidad: data.especialidad ?? n.especialidad,
                        tratamiento_id: data.tratamiento_id,
                        tratamiento_nombre: data.tratamiento_nombre,
                        pieza: data.pieza,
                        cuadrante: data.cuadrante,
                        arcada: data.arcada,
                    }
                    : n
            ),
        }));
        setEditingNoteId(null);
        setExpandedNoteId(id);
        showToast('Entrada clínica actualizada');
    };

    const handleAlertsChange = (newAlerts: { alergias: string[]; deuda: boolean }) => {
        setPaciente(prev => ({ ...prev, ...newAlerts }));
        showToast("Alertas de seguridad actualizadas");
    };

    // ── Handlers alergias ──────────────────────────────────────
    const handleAddAllergy = async () => {
        const nombre = newAllergyText.trim();
        if (!paciente.numPac) return;
        const newA: PatientAllergy = {
            id: generateId(), paciente_id: paciente.numPac, nombre, severidad: 'moderada'
        };
        setAllergies(prev => [...prev, newA]);
        setNewAllergyText('');
        if (isSupabaseConfigured()) await upsertAllergy({ paciente_id: paciente.numPac, nombre, severidad: 'moderada' });
        showToast(`Alergia "${nombre}" añadida`);
    };

    const handleRemoveAllergy = async (id: string) => {
        setAllergies(prev => prev.filter(a => a.id !== id));
        if (isSupabaseConfigured()) await deleteAllergy(id);
        showToast('Alergia eliminada');
    };

    // ── Handlers medicación ────────────────────────────────────
    const handleAddMedication = async (med: Medicamento) => {
        if (!paciente.numPac) return;
        const newMed: PatientMedication = {
            id: generateId(), paciente_id: paciente.numPac,
            nombre: med.nombre, importante: med.importante,
            categoria: med.categoria, nota: med.nota,
        };
        setMedications(prev => [...prev, newMed]);
        setMedQuery('');
        setMedSuggestions([]);
        if (isSupabaseConfigured()) await upsertMedication(newMed);
        showToast(`${med.nombre} añadido al perfil`);
    };

    const handleRemoveMedication = async (id: string) => {
        setMedications(prev => prev.filter(m => m.id !== id));
        if (isSupabaseConfigured()) await deleteMedication(id);
        showToast('Medicación eliminada');
    };

    const handleToggleMedImportante = async (id: string) => {
        let updated: PatientMedication | undefined;
        setMedications(prev => prev.map(m => {
            if (m.id !== id) return m;
            updated = { ...m, importante: !m.importante };
            return updated;
        }));
        if (updated && isSupabaseConfigured()) await upsertMedication(updated);
    };


    const handleDocumentSigned = () => {
        setPaciente(prev => ({ ...prev, consentimientosFirmados: true }));
        showToast("Consentimientos OK");
    };

    // Cargar panorámicas Romexis y fotos GDrive al montar
    useEffect(() => {
        if (!paciente?.numPac) return;

        setLoadingRX(true);
        getPatientPanoramicas(paciente.numPac)
            .then(p => { setPanoramicas(p); setPanoramicaIdx(0); })
            .finally(() => setLoadingRX(false));

        setLoadingFotos(true);
        getPatientPhotos(paciente.numPac)
            .then(f => { setFotos(f); setFotoIdx(0); })
            .finally(() => setLoadingFotos(false));
    }, [paciente?.numPac]);

    // Edad calculada
    const edad = paciente ? new Date().getFullYear() - new Date(paciente.fechaNacimiento).getFullYear() : 0;
    const ultimaVisita = paciente?.historial[0]?.fecha ?? '—';

    // VLN-012 FIX: Guard de acceso por rol
    if (!canViewPacientes) return <AccessDenied message="No tienes permisos para acceder a la ficha del paciente." />;

    const renderHistorial = () => (
        <div className="grid gap-3 animate-in fade-in duration-400 h-[calc(100vh-240px)] min-h-[500px]" style={{ gridTemplateColumns: '70fr 30fr' }}>

            {/* ── COL 1: IZQUIERDA (Top: Historial, Bottom: SOAP) ──────────────── */}
            <div className="flex flex-col gap-3 h-full min-h-0">
                {/* ── TOP-LEFT: HISTORIAL (scroll) ──────────────── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
                    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
                        <div className="flex items-center gap-1.5 flex-1">
                            <Activity className="w-3.5 h-3.5 text-[#051650]" />
                            <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">Entradas Médicas</h3>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FBFFA3] animate-pulse ml-1" title="Datos Simulados"></span>
                        </div>
                        <span className="text-[12px] font-bold text-slate-400">{paciente.historial.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
                        {paciente.historial.length === 0 && (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-slate-300 font-medium">Sin entradas registradas</p>
                            </div>
                        )}
                        {[...paciente.historial]
                            .sort((a, b) => {
                                // LOG-01 FIX: usar timestamp ISO normalizado a UTC (ya corregido en citas.service.ts)
                                const getMs = (n: typeof a) => {
                                    if (n.timestamp) { const d = new Date(n.timestamp); if (!isNaN(d.getTime())) return d.getTime(); }
                                    return 0;
                                };
                                return getMs(b) - getMs(a); // DESC: más reciente arriba
                            })
                            .map((note) => {
                                const cfg = getEsp(note.especialidad);
                                const isOpen = expandedNoteId === note.id;
                                const isEditing = editingNoteId === note.id;
                                const fechaISO = (() => {
                                    try {
                                        const d = new Date(note.fecha);
                                        return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
                                    } catch { return new Date().toISOString().split('T')[0]; }
                                })();
                                return (
                                    <div key={note.id} className="border-l-2 transition-all" style={{ borderLeftColor: isOpen || isEditing ? '#051650' : '#e2e8f0' }}>
                                        <div className="w-full flex items-center justify-between px-2 py-2 hover:bg-slate-50 transition-colors">
                                            <button
                                                onClick={() => { setExpandedNoteId(isOpen ? null : note.id); setEditingNoteId(null); }}
                                                className="flex items-center gap-2 min-w-0 flex-1 text-left"
                                            >
                                                {/* Fecha tipo calendario */}
                                                <div className="flex flex-col items-center justify-center w-10 h-12 bg-slate-100 rounded-lg flex-shrink-0 border border-slate-200">
                                                    <span className="text-sm font-bold text-[#051650] leading-none">{note.fecha.split(' ')[0]}</span>
                                                    <span className="text-[12px] font-bold text-slate-500 uppercase">{note.fecha.split(' ')[1]}</span>
                                                    <span className="text-[12px] font-semibold text-slate-400">{note.fecha.split(' ')[2]}</span>
                                                </div>
                                                {/* Resumen */}
                                                <div className="min-w-0 flex-1">
                                                    {/* Tratamiento como badge + doctor + firmada */}
                                                    <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                                                        <span className={`text-[12px] font-bold uppercase tracking-wider px-1 py-0.5 rounded border ${cfg.badge}`}>
                                                            {note.tratamiento_nombre || note.especialidad || '—'}
                                                        </span>
                                                        {note.pieza && <span className="text-[12px] bg-blue-50 text-blue-700 font-bold px-1 py-0.5 rounded">🦷 {note.pieza}</span>}
                                                        {note.firmada && <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                                                        {note.eva > 0 && (
                                                            <span className={`text-[12px] font-bold px-1 rounded ${note.eva >= 7 ? 'bg-[#FFF0F3] text-[#E03555]' : note.eva >= 4 ? 'bg-[#FEFDE8] text-[#051650]' : 'bg-blue-50 text-[#051650]'}`}>
                                                                {note.eva}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Doctor */}
                                                    <p className="text-[12px] text-slate-400 font-semibold truncate mb-0.5">{note.doctor}</p>
                                                    {/* Observaciones campo libre */}
                                                    {(note.subjetivo || note.plan) && (
                                                        <div className="flex items-start gap-1">
                                                            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap flex-shrink-0 mt-0.5">Obs:</span>
                                                            <p className="text-[13px] text-slate-500 font-medium leading-snug line-clamp-2">{note.subjetivo || note.plan}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                            <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                                                <button
                                                    onClick={() => { setEditingNoteId(isEditing ? null : note.id); setExpandedNoteId(null); }}
                                                    className={`w-5 h-5 flex items-center justify-center rounded transition-all ${isEditing ? 'bg-[#051650] text-white' : 'text-slate-400 hover:text-[#051650] hover:bg-slate-100'}`}
                                                    title="Editar entrada"
                                                >
                                                    <Pencil className="w-2.5 h-2.5" />
                                                </button>
                                                {isOpen
                                                    ? <ChevronUp className="w-3.5 h-3.5 text-slate-300 cursor-pointer" onClick={() => setExpandedNoteId(null)} />
                                                    : <ChevronDown className="w-3.5 h-3.5 text-slate-300 cursor-pointer" onClick={() => { setExpandedNoteId(note.id); setEditingNoteId(null); }} />}
                                            </div>
                                        </div>
                                        {/* Modo edición inline */}
                                        {isEditing && (
                                            <div className="mx-2 mb-3">
                                                <SOAPEditor
                                                    onSave={(data) => handleUpdateNote(note.id, data)}
                                                    alergiasPaciente={paciente.alergias}
                                                    onCancel={() => setEditingNoteId(null)}
                                                    initialData={{
                                                        subjetivo: note.subjetivo,
                                                        objetivo: note.objetivo,
                                                        analisis: note.analisis,
                                                        plan: note.plan,
                                                        eva: note.eva,
                                                        fecha: fechaISO,
                                                        especialidad: note.especialidad,
                                                        tratamiento_id: note.tratamiento_id,
                                                        tratamiento_nombre: note.tratamiento_nombre,
                                                        pieza: note.pieza,
                                                        cuadrante: note.cuadrante,
                                                        arcada: note.arcada,
                                                    }}
                                                />
                                            </div>
                                        )}
                                        {/* Contenido expandido SOAP solo lectura */}
                                        {isOpen && !isEditing && (
                                            <div className="grid grid-cols-2 gap-px bg-slate-100 text-[12px] mx-2 mb-2 rounded-lg overflow-hidden">
                                                <div className="bg-white p-2">
                                                    <span className="block text-[12px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">S</span>
                                                    <p className="text-slate-600 leading-relaxed">{note.subjetivo}</p>
                                                </div>
                                                <div className="bg-white p-2">
                                                    <span className="block text-[12px] font-bold text-orange-600 uppercase tracking-widest mb-0.5">O</span>
                                                    <p className="text-slate-600 leading-relaxed">{note.objetivo}</p>
                                                </div>
                                                <div className="bg-white p-2">
                                                    <span className="block text-[12px] font-bold text-[#051650] uppercase tracking-widest mb-0.5">A</span>
                                                    <p className="text-slate-600 leading-relaxed">{note.analisis}</p>
                                                </div>
                                                <div className="bg-[#051650] p-2">
                                                    <span className="block text-[12px] font-bold text-white/80 uppercase tracking-widest mb-0.5">P</span>
                                                    <p className="text-white font-medium leading-relaxed">{note.plan}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                    {/* IA DENTAL al pie */}
                    <div className="border-t border-slate-100 bg-[#051650] px-3 py-2 flex items-center gap-2 flex-shrink-0">
                        <Brain className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
                        <p className="text-[12px] text-blue-200 font-medium leading-tight flex-1 truncate italic">
                            {iaDentalTyped.slice(0, 70)}{iaDentalTyped.length > 70 ? '…' : ''}
                        </p>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#118DF0] animate-pulse flex-shrink-0" />
                    </div>
                </div>

                {/* ── BOTTOM-LEFT: EDITOR SOAP (50%, sin scroll) ──────────────── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
                    <SOAPEditor onSave={handleSaveNote} alergiasPaciente={paciente.alergias} />
                </div>
            </div>

            {/* ── COL 2: DERECHA (Top: RX = Bottom: Fotos, 50/50) ──────────────── */}
            <div className="flex flex-col gap-3 h-full min-h-0">
                {/* ── TOP-RIGHT: RX (50%) ──────────────── */}
                <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/50 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                            <Camera className="w-3 h-3 text-slate-400" />
                            <span className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">RX</span>
                            {!isRomexisConfigured() && (
                                <span className="text-[12px] font-bold text-[#051650] bg-[#FBFFA3]/10 border border-amber-500/30 px-1 py-0.5 rounded">DEMO</span>
                            )}
                        </div>
                        <span className="text-[12px] text-slate-500 font-semibold">{panoramicas[panoramicaIdx]?.dateLabel ?? ''}</span>
                    </div>
                    {/* Imagen principal */}
                    <div
                        className="flex-1 relative overflow-hidden cursor-zoom-in group"
                        onClick={() => panoramicas.length > 0 && setZoomImage(panoramicas[panoramicaIdx]?.url)}
                    >
                        {loadingRX
                            ? <div className="w-full h-full flex items-center justify-center"><span className="w-5 h-5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" /></div>
                            : panoramicas.length === 0
                                ? <div className="w-full h-full flex items-center justify-center text-slate-600 text-[13px] font-bold">Sin radiografías</div>
                                : <>
                                    <img
                                        src={panoramicas[panoramicaIdx]?.url}
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                        alt="Panorámica"
                                        style={{ filter: 'contrast(1.15) brightness(0.9)' }}
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-900 to-transparent" />
                                </>
                        }
                    </div>
                    {/* Carrete filmstrip compacto */}
                    <div className="flex gap-1.5 px-2 py-1.5 bg-slate-900/90 border-t border-slate-800 flex-shrink-0 overflow-x-auto">
                        {panoramicas.map((p, i) => (
                            <button
                                key={p.id}
                                onClick={() => setPanoramicaIdx(i)}
                                className={`relative flex-shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-all ${panoramicaIdx === i ? 'border-blue-400 opacity-100' : 'border-slate-700 opacity-50 hover:opacity-80'}`}
                            >
                                <img src={p.thumbnail ?? p.url} className="w-full h-full object-cover" style={{ filter: 'contrast(1.1)' }} alt={p.dateLabel} />
                                <div className="absolute bottom-0 left-0 right-0 bg-slate-900/70 text-[12px] text-slate-300 font-bold text-center py-px">{p.dateLabel}</div>
                            </button>
                        ))}
                        <label className="flex-shrink-0 w-10 h-10 rounded border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all">
                            <Camera className="w-3 h-3 text-slate-600" />
                            <input type="file" accept="image/*" className="hidden" />
                        </label>
                    </div>
                </div>

                {/* ── BOTTOM-RIGHT: FOTOS INTRAORALES ──────────────── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                            <Camera className="w-3 h-3 text-slate-500" />
                            <span className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">Fotos</span>
                            {!isGDriveConfigured() && (
                                <span className="text-[12px] font-bold text-amber-600 bg-[#FEFDE8] border border-[#FBFFA3] px-1 py-0.5 rounded">DEMO</span>
                            )}
                        </div>
                        <span className="text-[12px] text-slate-400 font-semibold truncate max-w-[80px]">{fotos[fotoIdx]?.label}</span>
                    </div>
                    {/* Imagen principal */}
                    <div
                        className="flex-1 relative overflow-hidden cursor-zoom-in group bg-slate-100"
                        onClick={() => fotos.length > 0 && setZoomImage(fotos[fotoIdx]?.url)}
                    >
                        {loadingFotos
                            ? <div className="w-full h-full flex items-center justify-center"><span className="w-5 h-5 border-2 border-slate-200 border-t-blue-400 rounded-full animate-spin" /></div>
                            : fotos.length === 0
                                ? <div className="w-full h-full flex items-center justify-center text-slate-400 text-[13px] font-bold">Sin fotos en Google Drive</div>
                                : <>
                                    <img
                                        src={fotos[fotoIdx]?.url}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        alt={fotos[fotoIdx]?.label}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                        <span className="text-white text-[12px] font-bold uppercase bg-black/50 px-2 py-0.5 rounded-full">Ampliar</span>
                                    </div>
                                </>
                        }
                    </div>
                    {/* Carrete compacto */}
                    <div className="flex gap-1.5 px-2 py-1.5 bg-white border-t border-slate-100 flex-shrink-0 overflow-x-auto">
                        {fotos.map((f, i) => (
                            <button
                                key={f.id}
                                onClick={() => setFotoIdx(i)}
                                className={`relative flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${fotoIdx === i ? 'border-[#051650] opacity-100 shadow-md' : 'border-slate-200 opacity-60 hover:opacity-90'}`}
                            >
                                <img src={f.thumbnail ?? f.url} className="w-full h-full object-cover" alt={f.label} />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[12px] text-white font-bold text-center py-px">{f.label}</div>
                            </button>
                        ))}
                        <label className="flex-shrink-0 w-10 h-10 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#051650] transition-all">
                            <Camera className="w-3 h-3 text-slate-500" />
                            <input type="file" accept="image/*" className="hidden" />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );




    const renderContent = () => {
        switch (activeSubArea) {
            case 'Odontograma 3D':
            case 'Odontograma': return <Odontograma onSuggestionUpdate={() => { }} numPac={paciente?.numPac} />;
            case 'Sondaje Periodontal':
            case 'Periodoncia': return <Periodontograma />;
            case 'Cuenta Corriente':
            case 'Económica':
            case 'Presupuestos': return <Economica numPac={paciente?.numPac ?? ''} idPac={paciente?.idPac} pacienteNombre={`${paciente?.nombre ?? ''} ${paciente?.apellidos ?? ''}`.trim()} pacienteTelefono={paciente?.telefono ?? ''} showToast={showToast} />;
            case 'Anamnesis': return <QuestionnairePanel numPac={paciente?.numPac ?? ''} />;
            case 'Documentos y Consentimientos':
            case 'Documentos': return <Documentos numPac={paciente?.numPac ?? ''} nombrePaciente={`${paciente?.nombre ?? ''} ${paciente?.apellidos ?? ''}`.trim()} onDocumentSigned={handleDocumentSigned} />;
            case 'Historia Clínica':
            case 'Historial Clínico':
            default: return renderHistorial();
        }
    };

    // ── Empty state: no patient selected yet ─────────────────────────────────
    if (!paciente) {
        return (
            <>
                <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                    <div className="w-20 h-20 rounded-2xl bg-[#051650]/5 flex items-center justify-center">
                        <UserPlus className="w-10 h-10 text-[#051650]/40" />
                    </div>
                    <div className="text-center max-w-xs">
                        <h2 className="text-[15px] font-bold text-slate-700 uppercase tracking-wider">Ningún paciente seleccionado</h2>
                        <p className="text-[12px] text-slate-400 mt-1">Busca por nombre, apellidos, Nº paciente o teléfono para abrir su ficha clínica.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setSearchInitialView('search'); setIsSearchOpen(true); }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#051650] text-white rounded-xl text-[12px] font-bold uppercase tracking-wider hover:bg-[#051650]/90 transition-all shadow-lg shadow-[#051650]/20"
                        >
                            <Search className="w-4 h-4" /> Buscar Paciente
                        </button>
                        <button
                            onClick={() => { setSearchInitialView('create'); setIsSearchOpen(true); }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[12px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <UserPlus className="w-4 h-4" /> Nuevo Paciente
                        </button>
                    </div>
                </div>
                <PatientSearchModal
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    onSelect={(p) => { setPaciente(p); setIsSearchOpen(false); }}
                    initialView={searchInitialView}
                />
            </>
        );
    }

    return (
        <div className="flex flex-col gap-4">

            {/* ── CABECERA PREMIUM ─────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* ── PANEL DE SEGURIDAD CLÍNICA — editable ───────────────── */}
                {(() => {
                    const medsImportantes = medications.filter(m => m.importante);
                    const hasAlerts = allergies.length > 0 || medsImportantes.length > 0;
                    return (
                        <div>
                            {/* Franja roja siempre visible si hay alertas */}
                            {hasAlerts && (
                                <div className={`bg-red-500 px-4 py-1.5 flex items-center gap-2 ${alertEditMode ? 'rounded-t-none' : ''}`}>
                                    <ShieldAlert className="w-3.5 h-3.5 text-white flex-shrink-0" />
                                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                        {allergies.length > 0 && (
                                            <span className="text-[12px] font-bold text-white uppercase tracking-wider">
                                                ⚠ Alergias: {allergies.map(a => a.nombre).join(' · ')}
                                            </span>
                                        )}
                                        {medsImportantes.length > 0 && (
                                            <span className="text-[12px] font-bold text-[#FF4B68] uppercase tracking-wider flex items-center gap-1">
                                                <Pill className="w-3 h-3" />
                                                {medsImportantes.map(m => m.nombre).join(' · ')}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setAlertEditMode(v => !v)}
                                        className="flex items-center gap-1 text-[12px] font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-all flex-shrink-0"
                                    >
                                        <Pencil className="w-2.5 h-2.5" />{alertEditMode ? 'Cerrar' : 'Editar'}
                                    </button>
                                </div>
                            )}

                            {/* Si no hay alertas, botón flotante discreto para añadir */}
                            {!hasAlerts && !alertEditMode && (
                                <div className="bg-slate-50 border-b border-slate-100 px-4 py-1.5 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-[12px] font-bold text-[#051650] flex-1">Sin alertas de seguridad</span>
                                    <button
                                        onClick={() => setAlertEditMode(true)}
                                        className="text-[12px] font-bold text-slate-400 hover:text-[#051650] flex items-center gap-1 transition-all"
                                    >
                                        <Plus className="w-3 h-3" /> Añadir
                                    </button>
                                </div>
                            )}

                            {/* Panel de edición expandible */}
                            {alertEditMode && (
                                <div className="bg-[#FFF0F3] border-b border-[#FFC0CB] px-4 py-3 space-y-3">

                                    {/* Sección alergias */}
                                    <div>
                                        <p className="text-[12px] font-bold uppercase tracking-widest text-[#C02040] mb-1.5 flex items-center gap-1">
                                            <ShieldAlert className="w-3 h-3" /> Alergias activas
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {allergies.map(a => (
                                                <span key={a.id} className="flex items-center gap-1 text-[12px] font-bold text-[#C02040] bg-[#FFE0E6] border border-[#FFC0CB] px-2 py-0.5 rounded-full">
                                                    {a.nombre}
                                                    <button onClick={() => handleRemoveAllergy(a.id)} className="text-[#FF4B68] hover:text-[#C02040] transition-colors">
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newAllergyText}
                                                onChange={e => setNewAllergyText(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddAllergy()}
                                                placeholder="Nueva alergia (Enter para añadir)"
                                                className="flex-1 text-[13px] px-3 py-1.5 border border-[#FFC0CB] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#FF4B68]"
                                            />
                                            <button onClick={handleAddAllergy} className="px-3 py-1.5 bg-red-500 text-white text-[13px] font-bold rounded-lg hover:bg-[#E03555] transition-all">
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sección medicación */}
                                    <div>
                                        <p className="text-[12px] font-bold uppercase tracking-widest text-slate-600 mb-1.5 flex items-center gap-1">
                                            <Pill className="w-3 h-3" /> Medicación del paciente
                                        </p>

                                        {/* Lista de medicaciones existentes */}
                                        {medications.length > 0 && (
                                            <div className="mb-2 space-y-1">
                                                {medications.map(m => (
                                                    <div key={m.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] border ${m.importante ? 'bg-[#FFF0F3] border-[#FFC0CB]' : 'bg-white border-slate-200'
                                                        }`}>
                                                        <button
                                                            onClick={() => handleToggleMedImportante(m.id)}
                                                            title={m.importante ? 'Marcar como no importante' : 'Marcar como importante (aparecerá en franja roja)'}
                                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${m.importante ? 'bg-red-500 border-[#FF4B68] text-white' : 'border-slate-300'
                                                                }`}
                                                        >
                                                            {m.importante && <ShieldAlert className="w-2.5 h-2.5" />}
                                                        </button>
                                                        <span className={`flex-1 font-semibold ${m.importante ? 'text-[#C02040]' : 'text-slate-700'}`}>{m.nombre}</span>
                                                        {m.categoria && <span className="text-[12px] text-slate-400">{m.categoria}</span>}
                                                        {m.nota && <span className="text-[12px] text-[#051650] italic max-w-[160px] truncate">{m.nota}</span>}
                                                        <button onClick={() => handleRemoveMedication(m.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Buscador vademecum */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={medQuery}
                                                onChange={e => setMedQuery(e.target.value)}
                                                placeholder="🔍 Buscar en el vademecum..."
                                                className="w-full text-[13px] px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                            />
                                            {medSuggestions.length > 0 && (
                                                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                                                    {medSuggestions.map(med => (
                                                        <button
                                                            key={med.nombre}
                                                            onClick={() => handleAddMedication(med)}
                                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {med.importante && <ShieldAlert className="w-3 h-3 text-red-500 flex-shrink-0" />}
                                                                <span className="text-[13px] font-bold text-slate-800 flex-1">{med.nombre}</span>
                                                                <span className="text-[12px] text-slate-400">{med.categoria}</span>
                                                            </div>
                                                            {med.nota && <p className="text-[12px] text-[#051650] italic mt-0.5">{med.nota}</p>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[12px] text-slate-400 mt-1">☑ El checkbox rojo indica que la medicación es importante y aparecerá en la franja de alertas.</p>
                                    </div>

                                    {/* Guardar / Cerrar */}
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setAlertEditMode(false)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-[#051650] text-white text-[13px] font-bold rounded-lg hover:bg-blue-900 transition-all"
                                        >
                                            <Save className="w-3.5 h-3.5" /> Guardar y cerrar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
                <div className="px-6 py-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    {/* Avatar + datos */}
                    <div className="flex items-center gap-4">
                        <div className="h-14 px-3 rounded-xl bg-gradient-to-br from-[#051650] to-blue-700 text-white flex flex-col items-center justify-center shadow-md flex-shrink-0 min-w-[56px]">
                            <span className="text-[12px] font-bold text-blue-300 uppercase tracking-widest leading-none mb-0.5">#NUMPAC</span>
                            <span className="text-[13px] font-bold leading-tight tracking-tight whitespace-nowrap">{paciente.numPac}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
                                    {paciente.nombre} {paciente.apellidos}
                                </h2>
                                <Badge variant="blue" className="rounded-sm text-[12px] px-1.5 py-0">Premium</Badge>
                                {paciente.deuda && (
                                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#E03555] bg-[#FFF0F3] border border-[#FFC0CB] px-2 py-0.5 rounded">
                                        <CircleDollarSign className="w-3 h-3" /> Deuda
                                    </span>
                                )}
                                {!paciente.consentimientosFirmados && (
                                    <span
                                        onClick={() => onSubAreaChange('Documentos')}
                                        className="inline-flex items-center gap-1 text-[12px] font-bold text-[#051650] bg-[#FEFDE8] border border-[#FBFFA3] px-2 py-0.5 rounded cursor-pointer hover:bg-[#FEFCC4] transition-all"
                                    >
                                        <Gavel className="w-3 h-3" /> Firma pendiente
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-slate-400 text-[12px] font-semibold">
                                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{paciente.dni}</span>
                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{paciente.telefono}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{edad} años</span>
                            </div>
                        </div>
                    </div>

                    {/* Acciones rápidas */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => {
                                if (paciente?.telefono) {
                                    onNavigate('Whatsapp', undefined, undefined, {
                                        phone: paciente.telefono,
                                        name: `${paciente.nombre ?? ''} ${paciente.apellidos ?? ''}`.trim(),
                                    });
                                } else {
                                    showToast('Este paciente no tiene teléfono registrado');
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-bold uppercase tracking-wider hover:bg-[#051650] transition-all shadow-sm active:scale-95"
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                        <button
                            onClick={() => onNavigate('Agenda', undefined, {
                                nombrePaciente: `${paciente?.nombre ?? ''} ${paciente?.apellidos ?? ''}`.trim(),
                                pacienteNumPac: paciente?.numPac ?? '',
                            })}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-[12px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95"
                        >
                            <Calendar className="w-3.5 h-3.5" /> Nueva Cita
                        </button>
                        <button
                            onClick={() => setEditFiliacion(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-[#FEFDE8] border border-[#FBFFA3] text-[#051650] rounded-lg text-[12px] font-bold uppercase tracking-wider hover:bg-[#FEFCC4] transition-all active:scale-95"
                        >
                            <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                            onClick={() => { setIsSearchOpen(true); setSearchInitialView('search'); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-[#051650] text-white rounded-lg text-[12px] font-bold uppercase tracking-wider hover:bg-blue-900 transition-all shadow-sm active:scale-95"
                        >
                            <ArrowLeftRight className="w-3.5 h-3.5" /> Cambiar
                        </button>
                    </div>
                </div>

            </div>

            {/* ── MODAL EDICIÓN FILIACIÓN ──────────────────────────────── */}
            {editFiliacion && (
                <div className="bg-[#FEFDE8] border border-[#FBFFA3] rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[13px] font-bold text-[#051650] uppercase tracking-widest flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5" /> Editar datos de filiación
                        </h3>
                        <button onClick={() => setEditFiliacion(false)} className="p-1 hover:bg-[#FEFCC4] rounded-lg transition-all">
                            <X className="w-3.5 h-3.5 text-[#051650]" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { label: 'Nombre', key: 'nombre', value: editFiliacionData.nombre || paciente.nombre },
                            { label: 'Apellidos', key: 'apellidos', value: editFiliacionData.apellidos || paciente.apellidos },
                            { label: 'Teléfono', key: 'telefono', value: editFiliacionData.telefono || paciente.telefono },
                            { label: 'DNI / NIF', key: 'dni', value: editFiliacionData.dni || paciente.dni },
                            { label: 'Fecha nacimiento', key: 'fechaNacimiento', value: editFiliacionData.fechaNacimiento || paciente.fechaNacimiento },
                        ].map(field => (
                            <div key={field.key}>
                                <label className="block text-[12px] font-bold uppercase tracking-widest text-[#051650] mb-1">{field.label}</label>
                                <input
                                    type={field.key === 'fechaNacimiento' ? 'date' : 'text'}
                                    defaultValue={field.value}
                                    onChange={e => setEditFiliacionData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                    className="w-full px-2.5 py-1.5 text-[13px] border border-[#FBFFA3] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#FBFFA3] focus:border-[#F5F874]"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                        <button onClick={() => setEditFiliacion(false)} className="px-3 py-1.5 text-[12px] font-bold uppercase text-slate-500 hover:text-slate-700 transition-all">
                            Cancelar
                        </button>
                        <button
                            onClick={async () => {
                                if (!paciente.numPac) return;
                                const updates = {
                                    nombre: editFiliacionData.nombre || paciente.nombre,
                                    apellidos: editFiliacionData.apellidos || paciente.apellidos,
                                    telefono: editFiliacionData.telefono || paciente.telefono,
                                    dni: editFiliacionData.dni || paciente.dni,
                                    fechaNacimiento: editFiliacionData.fechaNacimiento || paciente.fechaNacimiento,
                                };
                                import('../services/pacientes.service').then(({ updatePaciente }) => {
                                    updatePaciente(paciente.numPac, updates).then(updated => {
                                        if (updated) {
                                            setPaciente(prev => ({ ...prev, ...updates }));
                                            showToast('Datos de filiación actualizados');
                                        } else {
                                            // FDW puede no soportar escritura — actualizamos localmente
                                            setPaciente(prev => ({ ...prev, ...updates }));
                                            showToast('Datos actualizados localmente');
                                        }
                                        setEditFiliacion(false);
                                    });
                                });
                            }}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#E8EA50] text-white text-[12px] font-bold uppercase rounded-lg hover:bg-amber-700 transition-all"
                        >
                            <Save className="w-3 h-3" /> Guardar cambios
                        </button>
                    </div>
                </div>
            )}

            {/* ── CONTENIDO ───────────────────────────────────────────── */}
            <div>{renderContent()}</div>

            {/* ── MODAL DE ZOOM MEJORADO ────────────────────────────────── */}
            {zoomImage && (
                <div
                    className="fixed inset-0 z-[9999] bg-slate-900/98 flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300 backdrop-blur-md"
                    onClick={() => setZoomImage(null)}
                >
                    {/* Botones de acción arriba */}
                    <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
                        <button
                            title="Abrir en nueva ventana"
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all group active:scale-95 flex items-center gap-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(zoomImage, '_blank', 'noopener,noreferrer');
                            }}
                        >
                            <ExternalLink className="w-5 h-5" />
                            <span className="text-[12px] font-bold uppercase tracking-widest hidden sm:inline">Nueva Ventana</span>
                        </button>
                        <button
                            title="Cerrar"
                            className="p-3 bg-red-500/80 hover:bg-[#E03555] rounded-full text-white transition-all group active:scale-95"
                            onClick={(e) => { e.stopPropagation(); setZoomImage(null); }}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div
                        className="relative w-full h-full max-w-[98vw] max-h-[96vh] flex items-center justify-center animate-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={zoomImage}
                            className="max-w-full max-h-full rounded-lg shadow-2xl border border-white/5 object-contain selection:bg-none"
                            alt="Zoom"
                        />
                    </div>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                        <p className="text-[12px] text-white/80 font-medium tracking-widest uppercase flex items-center gap-2">
                            <Maximize2 className="w-3 h-3" /> Click fuera para cerrar o usa el botón superior
                        </p>
                    </div>
                </div>
            )}

            <PatientSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelect={handleSelectPatient}
                initialView={searchInitialView}
            />
        </div>
    );
};

export default Pacientes;
