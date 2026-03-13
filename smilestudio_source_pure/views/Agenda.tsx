
import React, { useEffect, useRef, useState } from 'react';
import ConfiguracionAgenda from './ConfiguracionAgenda';
import { Cita, EstadoCita, TratamientoCategoria } from '../types';
import {
    Calendar,
    Clock,
    Activity,
    X,
    Search,
    AlertTriangle,
    Filter,
    Stethoscope,
    CircleDot,
    MoreVertical,
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    ChevronDown,
    Lock,
    Unlock,
    Settings,
    User,
    Check
} from 'lucide-react';
import { Badge } from '../components/UI';
import {
    getCitasByFecha, updateCita, updateEstadoCita, createCita, deleteCita,
    isDbConfigured as isDbCfg, dateToISO
} from '../services/citas.service';
import { searchPacientes, getPaciente } from '../services/pacientes.service';
import { crearContacto } from '../services/contactos.service';
import { generateId } from '../services/db';
import { logger } from '../services/logger';
import { sendTextMessage, isEvolutionConfigured } from '../services/evolution.service';
import { Paciente } from '../types';
import {
    loadAgendaConfig, TratamientoAgenda, EstadoCitaAgenda, DoctorAgenda
} from '../services/agenda-config.service';

interface AgendaProps {
    activeSubArea?: string;
    initialCita?: Partial<Cita>;
}

// Paleta pastel suave — referencia: cyan, yellow, pink, green
/** Colores por tipo de tratamiento */
const getTreatmentColor = (tto: string, estado: string): { main: string; light: string; text: string } => {
    if (estado === 'finalizada') return { main: '#9ca3af', light: '#d1d5db', text: '#4b5563' }; // gray
    if (tto === 'Primera Visita') return { main: '#FF4B68', light: '#FF7A90', text: '#fff' };
    return { main: '#93c5fd', light: '#bfdbfe', text: '#051650' }; // blue-300/200 → texto azul oscuro
};

const MIN_PX_PER_HOUR = 80; // must be divisible by 4 for clean 15-min grid

const Agenda: React.FC<AgendaProps> = ({ activeSubArea, initialCita }) => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const timeline2Ref = useRef<HTMLDivElement>(null);
    const slotsG1Ref = useRef<HTMLDivElement>(null);

    // V-010: Catálogos dinámicos desde FDW
    const [agendaTratamientos, setAgendaTratamientos] = useState<TratamientoAgenda[]>([]);
    const [agendaEstados, setAgendaEstados] = useState<EstadoCitaAgenda[]>([]);
    const [agendaDoctores, setAgendaDoctores] = useState<DoctorAgenda[]>([]);

    useEffect(() => {
        loadAgendaConfig().then(({ tratamientos, estados, doctores }) => {
            setAgendaTratamientos(tratamientos);
            setAgendaEstados(estados);
            setAgendaDoctores(doctores);
        });
    }, []);
    const slotsG2Ref = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [pxPerHour, setPxPerHour] = useState(MIN_PX_PER_HOUR);

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; cita: Cita } | null>(null);
    const [clipboard, setClipboard] = useState<{ cita: Cita; action: 'copy' | 'cut' } | null>(null);
    const [altaCargaQuirurgica, setAltaCargaQuirurgica] = useState(false);
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loadingCitas, setLoadingCitas] = useState(true);
    const [citasError, setCitasError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const d = new Date(); d.setHours(0, 0, 0, 0); return d;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
    const [showDoctorsMenu, setShowDoctorsMenu] = useState(false);
    // ── Estado para formulario de contacto (Primera Visita) ─────────
    const [contactoForm, setContactoForm] = useState({ nombre: '', apellidos: '', telefono: '', email: '' });
    const [contactoSaving, setContactoSaving] = useState(false);
    const [contactoError, setContactoError] = useState<string | null>(null);
    // Menor de edad
    const [esMenorForm, setEsMenorForm] = useState(false);
    const [tutorForm, setTutorForm] = useState({ nombre: '', apellidos: '', telefono: '', email: '', relacion: '' });
    // Checkbox Primera Visita (independiente del tratamiento seleccionado)
    const [isPrimeraVisita, setIsPrimeraVisita] = useState(false);
    const [vistaTemporal, setVistaTemporal] = useState<'dia' | 'semana'>('dia');
    // Modal justificante editable
    const [justificanteModal, setJustificanteModal] = useState<{
        paciente: string;
        telefono: string;
        fecha: string;
        hora: string;
        tratamiento: string;
        doctor: string;
        texto: string;
    } | null>(null);
    const [editingCita, setEditingCita] = useState<Cita | null>(
        initialCita ? {
            id: generateId(),
            gabinete: 'G1',
            pacienteNumPac: initialCita.pacienteNumPac ?? '',
            nombrePaciente: initialCita.nombrePaciente ?? '',
            horaInicio: '09:00',
            duracionMinutos: 30,
            tratamiento: 'Control',
            categoria: 'Diagnostico' as TratamientoCategoria,
            estado: 'planificada' as EstadoCita,
            doctor: 'Dr. Mario Rubio',
            alertasMedicas: [],
            alertasLegales: [],
            alertasFinancieras: false,
            notas: '',
            ...initialCita,
        } : null
    );

    const [vistaGabinete, setVistaGabinete] = useState<'ALL' | 'G1' | 'G2'>('ALL');
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showConfiguracion, setShowConfiguracion] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [blockForm, setBlockForm] = useState({ gabinete: 'G1', hora: '10:00', duracion: 30, motivo: 'Bioseguridad' });

    // Patient search state for edit modal
    const [patientQuery, setPatientQuery] = useState('');
    const [patientResults, setPatientResults] = useState<Paciente[]>([]);
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const patientSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const toggleDoctor = (doc: string) => {
        setSelectedDoctors(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]);
    };

    const goDay = (delta: number) => setSelectedDate(prev => {
        const d = new Date(prev); d.setDate(d.getDate() + delta); return d;
    });
    const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setSelectedDate(d); };
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const dateLabel = `${DIAS_ES[selectedDate.getDay()]} ${selectedDate.getDate()} ${MESES_ES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

    const toggleVista = () => setVistaGabinete(prev => prev === 'ALL' ? 'G1' : (prev === 'G1' ? 'G2' : 'ALL'));
    const blockSlots = () => {
        setBlockForm(prev => ({ ...prev, gabinete: vistaGabinete === 'G2' ? 'G2' : 'G1' }));
        setShowBlockModal(true);
    };
    const confirmBlockSlots = () => {
        const newBio: Cita = {
            id: String(Math.random()),
            pacienteNumPac: 'bio',
            nombrePaciente: blockForm.motivo || 'Bioseguridad',
            doctor: 'Sistema',
            tratamiento: 'Bloqueo Agenda',
            categoria: 'Diagnostico',
            horaInicio: blockForm.hora,
            duracionMinutos: blockForm.duracion,
            estado: 'bloqueo_bio',
            gabinete: blockForm.gabinete as 'G1' | 'G2',
            alertasMedicas: [],
            alertasLegales: [],
            alertasFinancieras: false
        };
        createCita(newBio, selectedDate).then(saved => {
            if (saved) setCitas(prev => [...prev, saved]);
            setShowBlockModal(false);
        });
    };
    const unblockSlots = () => {
        const bios = citas.filter(c => c.estado === 'bloqueo_bio');
        bios.forEach(b => deleteCita(b.id));
        setCitas(prev => prev.filter(c => c.estado !== 'bloqueo_bio'));
    };

    // ── Working hours — mañana 09:00-14:00, tarde 16:00-20:00 ────────────────
    const workingSegments: [number, number][] = [[10, 14], [16, 20]];

    const totalHours = workingSegments.reduce((acc, [s, e]) => acc + (e - s), 0);
    const totalHeight = totalHours * pxPerHour; // px dinámico

    // FIX SCROLL: pxPerHour fijo a 100px para que el timeline siempre genere scroll.
    // totalHours=9 → 900px mañana + 400px tarde = 1300px > pantalla → overflow-y-auto activo.
    // El ResizeObserver previo colapsaba el layout (h/totalHours ≈ clientHeight → sin scroll).
    useEffect(() => {
        setPxPerHour(100);
    }, []);

    // Helper: hora:min → número de fila grid (1-indexed)
    // ROW 1 = header, ROW 2 = primera franja de tiempo (workingSegments[0][0]:00)
    // Cada fila = 15 minutos
    const timeToGridRow = (horaInicio: string): number => {
        const [h, m] = horaInicio.split(':').map(Number);
        let offsetQuarters = 0;
        let found = false;
        for (const [start, end] of workingSegments) {
            if (h >= start && h < end) {
                offsetQuarters += (h - start) * 4 + Math.floor(m / 15);
                found = true;
                break;
            } else if (h >= end) {
                offsetQuarters += (end - start) * 4;
            }
        }
        if (!found) {
            // Hora fuera de jornada — colocamos al final
            offsetQuarters = workingSegments.reduce((a, [s, e]) => a + (e - s) * 4, 0);
        }
        return offsetQuarters + 2; // +1 por 1-indexed, +1 por la fila de cabecera (row 1)
    };

    // Helper legacy (usado aún en drag-and-drop)
    const minutesToPx = (horaInicio: string): number => {
        const [h, m] = horaInicio.split(':').map(Number);
        let offsetHours = 0;
        for (const [start, end] of workingSegments) {
            if (h >= start && h < end) { offsetHours += (h - start); break; }
            else if (h >= end) { offsetHours += (end - start); }
        }
        return offsetHours * pxPerHour + m * (pxPerHour / 60);
    };


    // ── Cargar citas reales por fecha ────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        // Timeout de seguridad: si en 8s no hay respuesta, quitamos el spinner
        const safetyTimer = setTimeout(() => {
            if (!cancelled) setLoadingCitas(false);
        }, 8000);

        if (isDbCfg()) {
            setLoadingCitas(true);
            getCitasByFecha(selectedDate).then(dbCitas => {
                if (cancelled) return;
                setCitas(dbCitas);
                const minCir = dbCitas.filter(c => c.categoria === 'Cirugía' && c.estado !== 'bloqueo_bio').reduce((a, c) => a + c.duracionMinutos, 0);
                setAltaCargaQuirurgica((minCir / 300) > 0.4);
            }).catch(err => {
                if (cancelled) return;
                console.warn('[Agenda] Error al cargar citas:', err?.message ?? err);
                setCitas([]);
            }).finally(() => {
                clearTimeout(safetyTimer);
                if (!cancelled) setLoadingCitas(false);
            });
        } else {
            setCitas([]);
            setLoadingCitas(false);
            clearTimeout(safetyTimer);
        }
        return () => { cancelled = true; clearTimeout(safetyTimer); };
    }, [selectedDate]);

    // ── State actions ─────────────────────────────────────────────────────────
    const updateCitaEstado = async (estado: EstadoCita, citaId?: string) => {
        const id = citaId ?? contextMenu?.cita.id;
        if (!id) return;
        setCitas(prev => prev.map(c => c.id === id ? { ...c, estado } : c));
        setContextMenu(null);
        await updateEstadoCita(id, estado);
    };

    const handleAction = async (action: string) => {
        if (!contextMenu) return;
        const cita = contextMenu.cita;         // captura local antes de cualquier await
        setContextMenu(null);                  // cierra el menú inmediatamente
        switch (action) {
            case 'copy': setClipboard({ cita, action: 'copy' }); break;
            case 'cut': setClipboard({ cita, action: 'cut' }); break;
            case 'paste':
                if (clipboard) {
                    const newCita: Cita = { ...clipboard.cita, id: String(Math.random()), horaInicio: cita.horaInicio, gabinete: cita.gabinete };
                    setCitas(prev => {
                        const next = [...prev, newCita];
                        return clipboard.action === 'cut' ? next.filter(c => c.id !== clipboard.cita.id) : next;
                    });
                    // Persistir en BD
                    createCita(newCita, selectedDate).then(saved => {
                        if (saved) setCitas(prev => prev.map(c => c.id === newCita.id ? saved : c));
                    });
                    if (clipboard.action === 'cut') deleteCita(clipboard.cita.id);
                    setClipboard(null);
                }
                break;
            case 'cancel': updateCitaEstado('fallada'); return;
            case 'print': window.print(); break;
            case 'justificante': {
                const fechaStr = selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                // Intentar obtener teléfono del paciente
                let telefono = '';
                try {
                    if (cita.pacienteNumPac) {
                        const pac = await getPaciente(cita.pacienteNumPac);
                        telefono = pac?.telefono ?? '';
                    }
                } catch { }
                setJustificanteModal({
                    paciente: cita.nombrePaciente,
                    telefono,
                    fecha: fechaStr,
                    hora: cita.horaInicio,
                    tratamiento: cita.tratamiento,
                    doctor: cita.doctor,
                    texto: 'El/La paciente arriba indicado/a ha asistido a la consulta dental en la fecha y hora especificados. Este documento acredita dicha asistencia a efectos laborales, escolares o de cualquier otra índole.',
                });
                break;
            }
            case 'whatsapp': {
                const fecha = selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                const txt = `👋 Hola ${cita.nombrePaciente.split(',')[0].trim()}, te confirmamos tu cita en Rubio García Dental:\n\n📅 ${fecha}\n⏰ ${cita.horaInicio} h\n🦷 ${cita.tratamiento}\n👨‍⚕️ ${cita.doctor}\n\n¿Necesitas cambiarla? Respóndenos a este mensaje. ¡Hasta pronto! 😊`;
                let tel = '';
                try {
                    if (cita.pacienteNumPac) {
                        const pac = await getPaciente(cita.pacienteNumPac);
                        tel = pac?.telefono ?? '';
                    }
                } catch { }
                if (!tel) { alert('No hay teléfono registrado para este paciente'); break; }
                if (isEvolutionConfigured()) {
                    await sendTextMessage(tel, txt);
                } else {
                    window.open(`https://api.smilestudio.io '')}?text=${encodeURIComponent(txt)}`, '_blank');
                }
                break;
            }
        }
        setContextMenu(null);
    };

    // Close context menu and settings menu on outside click
    useEffect(() => {
        const close = (e: MouseEvent) => {
            // No cerrar si el click fue DENTRO del menú contextual
            if ((e.target as Element)?.closest('[data-context-menu]')) return;
            setContextMenu(null);
            setShowSettingsMenu(false);
            setShowDoctorsMenu(false);
        };
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, []);

    // ── Filtrado y asignación de columnas (solapamientos) ─────────────────────
    const term = searchTerm.trim().toLowerCase();
    const filteredCitas = citas.filter(c =>
        (!term ||
            c.nombrePaciente.toLowerCase().includes(term) ||
            c.tratamiento.toLowerCase().includes(term) ||
            c.doctor.toLowerCase().includes(term))
        && (selectedDoctors.length === 0 || selectedDoctors.includes(c.doctor) || c.estado === 'bloqueo_bio')
    );

    const getTimeRange = (c: typeof citas[0]) => {
        const [hh, mm] = c.horaInicio.split(':').map(Number);
        const startMin = hh * 60 + mm;
        return { start: startMin, end: startMin + c.duracionMinutos };
    };
    const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) =>
        a.start < b.end && b.start < a.end;

    const colAssignment = new Map<string, { col: number; totalCols: number }>();
    ['G1', 'G2'].forEach(gab => {
        const gabCitas = filteredCitas.filter(c => c.gabinete === gab && c.estado !== 'bloqueo_bio');
        const ranges = gabCitas.map(c => ({ id: c.id, ...getTimeRange(c) }));
        const cols: { id: string; start: number; end: number }[][] = [];
        ranges.forEach(r => {
            let placed = false;
            for (let ci = 0; ci < cols.length; ci++) {
                if (!cols[ci].some(ex => overlaps(ex, r))) {
                    cols[ci].push(r);
                    colAssignment.set(r.id, { col: ci, totalCols: 0 });
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                cols.push([r]);
                colAssignment.set(r.id, { col: cols.length - 1, totalCols: 0 });
            }
        });
        ranges.forEach(r => {
            const assignment = colAssignment.get(r.id)!;
            let maxCols = 0;
            for (let ci = 0; ci < cols.length; ci++) {
                if (cols[ci].some(ex => overlaps(ex, r))) maxCols++;
            }
            assignment.totalCols = maxCols;
        });
    });

    // ── DATA REMOVED: renderCita implementation deleted as per user request ──
    const renderCita = (cita: any, gab: string) => {
        return (
            <div key={cita.id} style={{ gridColumn: gab === 'G1' ? '2' : '3', gridRow: '1', display: 'none' }}>
                {/* DATA REMOVED */}
            </div>
        );
    };


    if (activeSubArea === 'Gestión de Citas' || showConfiguracion) {
        return (
            <div className="flex flex-col h-full bg-gradient-to-br from-[#0c2a80] to-[#051650] relative">
                {showConfiguracion && (
                    <div className="px-4 pt-4 pb-0 flex justify-start flex-shrink-0">
                        <button
                            onClick={() => setShowConfiguracion(false)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-[13px] font-bold uppercase"
                        >
                            <ChevronLeft className="w-4 h-4" /> Volver a Agenda
                        </button>
                    </div>
                )}
                {/* FIX: overflow-y-auto + padding para que ConfiguracionAgenda tenga scroll */}
                <div className="flex-1 overflow-y-auto relative">
                    <div className="px-4 py-4 bg-[#f8fafc] min-h-full rounded-t-2xl">
                        <ConfiguracionAgenda />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-3 p-4 relative overflow-hidden bg-[#f8f9fa]">

            {/* Floating Context Menu */}
            {contextMenu && (
                <div
                    data-context-menu="true"
                    className="fixed z-[200] bg-white border border-slate-200 shadow-2xl rounded-xl py-1.5 w-52 select-none"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                        <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Acciones</p>
                        <p className="text-[12px] font-bold text-slate-800 truncate">{contextMenu.cita.nombrePaciente}</p>
                    </div>
                    <div className="px-1">
                        {[
                            { label: 'Copiar', key: 'copy', hint: '⌘C' },
                            { label: 'Cortar', key: 'cut', hint: '⌘X' },
                        ].map(({ label, key, hint }) => (
                            <button key={key} onClick={() => handleAction(key)} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 text-[12px] font-medium text-slate-700">
                                {label}<span className="text-[13px] text-slate-400 font-mono">{hint}</span>
                            </button>
                        ))}
                        <button onClick={() => handleAction('paste')} disabled={!clipboard} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[12px] font-medium text-slate-700 ${clipboard ? 'hover:bg-slate-50' : 'opacity-30 cursor-not-allowed'}`}>
                            Pegar<span className="text-[13px] text-slate-400 font-mono">⌘V</span>
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        {/* Estado submenu */}
                        <div className="group/sub relative">
                            <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 text-[12px] font-medium text-slate-700">
                                Cambiar Estado <MoreVertical className="w-3 h-3 text-slate-400" />
                            </button>
                            <div className="absolute left-full top-0 ml-1 hidden group-hover/sub:flex flex-col bg-white border border-slate-200 shadow-xl rounded-xl py-1 w-36 z-10">
                                {(['confirmada', 'espera', 'gabinete', 'finalizada'] as EstadoCita[]).map(e => (
                                    <button key={e} onClick={() => updateCitaEstado(e)} className="text-left px-3 py-1.5 hover:bg-slate-50 text-[13px] font-bold uppercase text-slate-600 capitalize">{e}</button>
                                ))}
                            </div>
                        </div>

                        <div className="my-1 border-t border-slate-100" />
                        <button onClick={() => handleAction('print')} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-[12px] font-medium text-slate-700">Imprimir Cita</button>
                        <button onClick={() => handleAction('justificante')} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-[12px] font-medium text-slate-700">Justificante</button>
                        <button onClick={() => handleAction('whatsapp')} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#25D366]/10 text-[12px] font-medium text-[#25D366]">&#128172; Enviar por WhatsApp</button>

                        <div className="my-1 border-t border-slate-100" />
                        <button onClick={() => handleAction('cancel')} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#FFF0F3] text-[12px] font-bold text-[#E03555]">Anular Cita</button>
                    </div>
                </div>
            )}

            {/* Single Unified Toolbar Row */}
            <header className="flex items-center justify-between rounded-xl p-2.5 shadow-sm flex-shrink-0 bg-white border border-slate-200">

                {/* Left: Date Nav & Search */}
                <div className="flex items-center gap-3">
                    {/* DATE NAV */}
                    <div className="flex items-center gap-1 rounded-lg overflow-hidden bg-slate-50 border border-slate-200">
                        <button
                            onClick={() => goDay(-1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center justify-center bg-transparent h-8 px-2 transition-all">
                            <input
                                type="date"
                                value={dateToISO(selectedDate)}
                                onChange={e => {
                                    if (e.target.value) {
                                        const d = new Date(e.target.value + 'T00:00:00');
                                        setSelectedDate(d);
                                    }
                                }}
                                className="bg-transparent text-[13px] font-bold text-slate-800 tracking-wide focus:outline-none cursor-pointer"
                                title="Haz clic para seleccionar un día concreto del calendario"
                            />
                        </div>
                        <button
                            onClick={() => goDay(1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={!isToday ? goToday : undefined}
                        className={`text-[13px] font-bold px-3 py-1.5 rounded-md transition-all text-white shadow-sm`}
                        style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', cursor: isToday ? 'default' : 'pointer' }}
                    >
                        Hoy
                    </button>

                    <div className="h-5 w-px bg-slate-200 mx-1" />

                    {/* SEARCH */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar paciente o cita..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-1.5 text-[13px] font-medium text-slate-700 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 w-56 bg-slate-50 border border-slate-200"
                        />
                    </div>
                </div>

                {/* Right: Actions, Filters & Alert */}
                <div className="flex items-center gap-3">
                    {/* ALARM */}
                    {altaCargaQuirurgica && (
                        <div className="flex items-center gap-2 bg-[#FFF0F3] text-[#E03555] px-3 py-1.5 rounded-lg border border-rose-100 animate-in fade-in zoom-in duration-300 shadow-sm mr-2">
                            <Activity className="w-3.5 h-3.5 animate-pulse shrink-0" />
                            <span className="text-[13px] font-bold uppercase tracking-wider hidden xl:inline">Carga Quirúrgica &gt;40%</span>
                            <button onClick={() => setAltaCargaQuirurgica(false)} className="ml-1 hover:bg-[#FFC0CB]/50 rounded-full p-0.5"><X className="w-3.5 h-3.5" /></button>
                        </div>
                    )}

                    {/* VIEW TABS - Day/Week */}
                    <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                        <button
                            onClick={() => setVistaTemporal('dia')}
                            className={`text-[13px] font-bold px-3 py-1.5 rounded-md transition-all ${vistaTemporal === 'dia' ? 'text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            style={vistaTemporal === 'dia' ? { background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' } : {}}
                        >
                            Día
                        </button>
                        <button
                            onClick={() => setVistaTemporal('semana')}
                            disabled
                            className="text-[13px] font-bold px-3 py-1.5 rounded-md transition-all text-slate-300 cursor-not-allowed"
                            title="Vista Semana — Próximamente"
                        >
                            Semana
                        </button>
                    </div>

                    <div className="relative isolate z-[100]">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowDoctorsMenu(prev => !prev); }}
                            className="flex items-center gap-1.5 text-[13px] font-bold uppercase px-3 py-1.5 rounded-lg text-slate-600 transition-all bg-slate-50 border border-slate-200 hover:bg-slate-100"
                        >
                            <User className="w-3.5 h-3.5" /> Doctores <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {showDoctorsMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-200 py-2 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                <div className="px-3 pb-2 mb-1 border-b border-slate-100">
                                    <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Filtrar por Especialista</p>
                                </div>
                                {(Array.from(new Set(citas.filter(c => c.doctor).map(c => c.doctor))) as string[])
                                    .sort((a, b) => a.localeCompare(b))
                                    .map(doc => {
                                        const isSelected = selectedDoctors.includes(doc);
                                        return (
                                            <button
                                                key={doc}
                                                onClick={() => toggleDoctor(doc)}
                                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                                            >
                                                <span className={`text-[12px] font-bold ${isSelected ? 'text-[#051650]' : 'text-slate-600'}`}>{doc}</span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                            </button>
                                        );
                                    })}
                                {selectedDoctors.length > 0 && (
                                    <div className="px-3 pt-2 mt-1 border-t border-slate-100">
                                        <button onClick={() => setSelectedDoctors([])} className="text-[13px] font-bold text-red-500 hover:text-[#E03555] uppercase w-full text-center">Limpiar Filtros</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="h-5 w-px bg-slate-200" />

                    {/* TOOLS - CONFIGURACIÓN CENTRALIZADA */}
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowSettingsMenu(prev => !prev); }}
                            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${showSettingsMenu ? 'bg-[#051650] text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                            title="Opciones de Agenda"
                        >
                            <Settings className="w-4 h-4" />
                        </button>

                        {/* Settings Dropdown */}
                        {showSettingsMenu && (
                            <div
                                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-[100] overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-slate-400" />
                                    <span className="text-[13px] font-bold text-[#051650] uppercase tracking-wide">Opciones Agenda</span>
                                </div>

                                <button
                                    onClick={() => { setShowConfiguracion(true); setShowSettingsMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors group"
                                >
                                    <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors"><Settings className="w-3.5 h-3.5" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-bold text-slate-700 leading-none">Gestión de Citas</span>
                                        <span className="text-[13px] text-slate-400 font-medium">Configurar horarios y reglas</span>
                                    </div>
                                </button>

                                <div className="h-px bg-slate-100 my-1 mx-2" />

                                <button
                                    onClick={() => { toggleVista(); setShowSettingsMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors group"
                                >
                                    <div className="w-6 h-6 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors"><Filter className="w-3.5 h-3.5" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-bold text-slate-700 leading-none">Vistas: {vistaGabinete === 'ALL' ? 'Todos Doctores' : (vistaGabinete === 'G1' ? 'Dr. Rubio' : 'Dra. García')}</span>
                                        <span className="text-[13px] text-slate-400 font-medium">Alternar agendas visibles</span>
                                    </div>
                                </button>

                                <div className="h-px bg-slate-100 my-1 mx-2" />

                                <button
                                    onClick={() => { blockSlots(); setShowSettingsMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors group"
                                >
                                    <div className="w-6 h-6 rounded-md bg-[#FFF0F3] text-[#E03555] flex items-center justify-center shrink-0 group-hover:bg-[#FFE0E6] transition-colors"><Lock className="w-3.5 h-3.5" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-bold text-slate-700 leading-none">Bloquear Tramos</span>
                                        <span className="text-[13px] text-slate-400 font-medium">Insertar bloqueo selectivo</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => { unblockSlots(); setShowSettingsMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors group"
                                >
                                    <div className="w-6 h-6 rounded-md bg-blue-50 text-[#051650] flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors"><Unlock className="w-3.5 h-3.5" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-bold text-slate-700 leading-none">Desbloquear Tramos</span>
                                        <span className="text-[13px] text-slate-400 font-medium">Liberar bloqueos (bio)</span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header >

            {/* Main grid — TABLA HTML REAL para alineación perfecta entre header y grid */}
            <main className="flex-1 flex flex-col rounded-xl overflow-hidden bg-white" style={{ border: '1px solid #dadce0', boxShadow: '0 1px 3px rgba(60,64,67,0.15)' }}>


                {/* ── TABLA HTML REAL — Fix definitivo de alineación —
                    El colgroup define los anchos una sola vez.
                    El navegador los aplica idénticos a thead (sticky) y tbody (scroll).
                    Es imposible que el scrollbar desalinee nada. Fin del problema. */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative" style={{ background: '#fff' }}>

                    {loadingCitas && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-3">
                            <div className="w-8 h-8 border-4 border-[#002855]/20 border-t-[#002855] rounded-full animate-spin" />
                            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Cargando agenda...</p>
                        </div>
                    )}

                    {citasError && !loadingCitas && (
                        <div className="absolute top-4 left-4 right-4 z-50 flex items-center gap-3 bg-[#FFF0F3] border border-[#FFC0CB] rounded-xl px-4 py-3 shadow">
                            <span className="text-lg">⚠️</span>
                            <p className="text-[12px] font-semibold text-[#C02040] flex-1">{citasError}</p>
                            <button onClick={() => setCitasError(null)} className="text-[#FF4B68] hover:text-[#E03555] text-[13px] font-bold">✕</button>
                        </div>
                    )}

                    {/* ── CALENDAR GRID ─────────────────────────────────────────────────────
                        Columnas: 80px hora | 1fr G1 | 1fr G2   (3 columnas)
                        Filas:    48px header + repeat(N, 25px)
                        Líneas:   gap: 1px + background: #eee  (igual que en la imagen ref.)
                        Las citas: grid-row: startRow / span durationRows  (col 2 G1, col 3 G2)
                    ─────────────────────────────────────────────────────────────────────── */}
                    {(() => {
                        const totalRows = workingSegments.reduce((a, [s, e]) => a + (e - s) * 4, 0);
                        const rowH = pxPerHour / 4; // 25px

                        const cols = vistaGabinete === 'ALL' ? '80px 1fr 1fr' : '80px 1fr';
                        const g1Col = 2;
                        const g2Col = vistaGabinete === 'ALL' ? 3 : 2;

                        // ── drag-and-drop ──
                        const handleDrop = (gab: 'G1' | 'G2') => (e: React.DragEvent) => {
                            e.preventDefault();
                            const citaId = e.dataTransfer?.getData('text/plain');
                            if (!citaId) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const snapMin = Math.floor(Math.floor((e.clientY - rect.top) / rowH) * 15);
                            let rem = snapMin, newH = workingSegments[0][0], newM = 0;
                            for (const [s, end] of workingSegments) {
                                const segMin = (end - s) * 60;
                                if (rem < segMin) { newH = s + Math.floor(rem / 60); newM = rem % 60; break; }
                                rem -= segMin;
                            }
                            const newTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
                            const citaMovida = citas.find(c => c.id === citaId);
                            const hayConflicto = citaMovida ? citas.some(c => {
                                if (c.id === citaId || c.gabinete !== gab || c.estado === 'bloqueo_bio') return false;
                                const [ch, cm] = c.horaInicio.split(':').map(Number);
                                const [nh, nm] = newTime.split(':').map(Number);
                                const cS = ch * 60 + cm, nS = nh * 60 + nm;
                                return nS < cS + c.duracionMinutos && cS < nS + (citaMovida.duracionMinutos ?? 30);
                            }) : false;
                            if (hayConflicto) return;
                            setCitas(prev => prev.map(c => c.id === citaId ? { ...c, horaInicio: newTime, gabinete: gab } : c));
                            updateCita(citaId, { horaInicio: newTime, gabinete: gab }, selectedDate);
                        };

                        // ── etiquetas de hora — col 1 ──
                        // Fondo blanco: las líneas las hace el gap del grid-parent (#eee)
                        const timeSlots = workingSegments.flatMap(([start, end], segIdx) =>
                            Array.from({ length: (end - start) * 4 }, (_, i) => {
                                const segOffset = workingSegments.slice(0, segIdx).reduce((a, [s, e]) => a + (e - s) * 4, 0);
                                const gridRow = segOffset + i + 2;
                                const quarter = i % 4;
                                const hour = start + Math.floor(i / 4);
                                const isHour = quarter === 0;
                                const isHalfHour = quarter === 2;
                                const label = isHour
                                    ? `${String(hour).padStart(2, '0')}:00`
                                    : isHalfHour
                                        ? `${String(hour).padStart(2, '0')}:30`
                                        : quarter === 1 ? ':15' : ':45';
                                return (
                                    <div key={`ts-${segIdx}-${i}`} style={{
                                        gridColumn: 1,
                                        gridRow,
                                        display: 'flex',
                                        alignItems: isHour ? 'flex-start' : 'center',
                                        justifyContent: 'flex-end',
                                        paddingRight: '8px',
                                        paddingTop: isHour ? '2px' : 0,
                                        background: '#fff',
                                        userSelect: 'none',
                                    }}>
                                        <span style={{
                                            fontSize: isHour ? '13px' : '12px',
                                            fontWeight: isHour ? 600 : 400,
                                            color: isHour ? '#5f6368' : '#9aa0a6',
                                            fontVariantNumeric: 'tabular-nums',
                                            lineHeight: 1,
                                        }}>{label}</span>
                                    </div>
                                );
                            })
                        );

                        // ── celdas de fondo del gabinete — cols 2 y 3 ──
                        // Sin borders individuales — las líneas vienen del gap del grid
                        const gabCells = (gab: 'G1' | 'G2', colIndex: number) =>
                            workingSegments.flatMap(([start, end], segIdx) =>
                                Array.from({ length: (end - start) * 4 }, (_, i) => {
                                    const segOffset = workingSegments.slice(0, segIdx).reduce((a, [s, e]) => a + (e - s) * 4, 0);
                                    const gridRow = segOffset + i + 2;
                                    const quarter = i % 4;
                                    const hour = start + Math.floor(i / 4);
                                    const doctor = gab === 'G1' ? 'Dr. Mario Rubio' : 'Dra. Irene Garcia';
                                    return (
                                        <div key={`gc-${gab}-${segIdx}-${i}`}
                                            onClick={e => {
                                                e.stopPropagation();
                                                const horaStr = `${String(hour).padStart(2, '0')}:${String(quarter * 15).padStart(2, '0')}`;
                                                setEditingCita({ id: generateId(), gabinete: gab, pacienteNumPac: '', nombrePaciente: '', horaInicio: horaStr, duracionMinutos: 30, tratamiento: 'Control', categoria: 'Diagnostico', estado: 'planificada', doctor, alertasMedicas: [], alertasLegales: [], alertasFinancieras: false, notas: '' });
                                            }}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={handleDrop(gab)}
                                            style={{ gridColumn: colIndex, gridRow, background: '#fff', cursor: 'pointer', position: 'relative' }}
                                        />
                                    );
                                })
                            );

                        {/* ── DATA REMOVED: main grid implementation deleted as per user request ── */ }
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                            [GRID DESIGN DATA REMOVED]
                        </div>
                    })()}
                </div>
            </main>


            {/* Modal Justificante EDITABLE */}
            {justificanteModal && (
                <div className="fixed inset-0 z-[400] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setJustificanteModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#051650] px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold text-sm tracking-tight">📄 Justificante de Asistencia</h3>
                                <p className="text-blue-300 text-[13px] mt-0.5">Edita los campos antes de imprimir</p>
                            </div>
                            <button onClick={() => setJustificanteModal(null)} className="text-slate-300 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paciente</label>
                                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-[#051650] focus:outline-none focus:ring-2 focus:ring-[#051650]/20"
                                        value={justificanteModal.paciente}
                                        onChange={e => setJustificanteModal({ ...justificanteModal, paciente: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha</label>
                                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-[#051650] focus:outline-none focus:ring-2 focus:ring-[#051650]/20"
                                        value={justificanteModal.fecha}
                                        onChange={e => setJustificanteModal({ ...justificanteModal, fecha: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hora</label>
                                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-[#051650] focus:outline-none focus:ring-2 focus:ring-[#051650]/20"
                                        value={justificanteModal.hora}
                                        onChange={e => setJustificanteModal({ ...justificanteModal, hora: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tratamiento</label>
                                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-[#051650] focus:outline-none focus:ring-2 focus:ring-[#051650]/20"
                                        value={justificanteModal.tratamiento}
                                        onChange={e => setJustificanteModal({ ...justificanteModal, tratamiento: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1">Doctor/a</label>
                                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-[#051650] focus:outline-none focus:ring-2 focus:ring-[#051650]/20"
                                        value={justificanteModal.doctor}
                                        onChange={e => setJustificanteModal({ ...justificanteModal, doctor: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1">Texto del documento</label>
                                    <textarea rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#051650]/20 resize-none"
                                        value={justificanteModal.texto}
                                        onChange={e => setJustificanteModal({ ...justificanteModal, texto: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="px-5 pb-5 flex gap-3">
                            <button onClick={() => setJustificanteModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    const jm = justificanteModal;
                                    const w = window.open('', '_blank', 'width=700,height=900');
                                    if (!w) { alert('Activa las ventanas emergentes para imprimir el justificante'); return; }
                                    w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Justificante de Asistencia</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; padding: 60px; color: #1e293b; }
                                      h1 { color: #051650; font-size: 22px; margin: 0 0 4px; }
                                      .sub { color: #64748b; font-size: 13px; margin-bottom: 40px; }
                                      .box { border: 2px solid #e2e8f0; border-radius: 12px; padding: 28px; margin: 24px 0; }
                                      .label { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 4px; }
                                      .value { font-size: 15px; font-weight: 700; color: #0f172a; }
                                      .firma { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 24px; display: flex; justify-content: space-between; }
                                      .firma-box { width: 200px; text-align: center; }
                                      .firma-line { border-top: 1px solid #94a3b8; margin-bottom: 8px; height: 50px; }
                                      @media print { body { padding: 30px; } }
                                    </style></head><body>
                                    <h1>RUBIO GARCÍA DENTAL</h1>
                                    <p class="sub">Clínica Dental · CIF: B12345678 · Tel. 943 000 000 · Donostia-San Sebastián</p>
                                    <hr style="border:1px solid #e2e8f0; margin-bottom:32px">
                                    <h2 style="font-size:18px;color:#051650;text-align:center;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:32px">Justificante de Asistencia a Consulta Médica</h2>
                                    <div class="box">
                                      <div class="label">Paciente</div>
                                      <div class="value">${jm.paciente}</div>
                                    </div>
                                    <div class="box">
                                      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
                                        <div><div class="label">Fecha</div><div class="value">${jm.fecha}</div></div>
                                        <div><div class="label">Hora</div><div class="value">${jm.hora} h</div></div>
                                        <div><div class="label">Tratamiento</div><div class="value">${jm.tratamiento}</div></div>
                                        <div><div class="label">Doctor/a</div><div class="value">${jm.doctor}</div></div>
                                      </div>
                                    </div>
                                    <p style="font-size:13px;color:#64748b;margin-top:24px">${jm.texto}</p>
                                    <div class="firma">
                                      <div class="firma-box">
                                        <div class="firma-line"></div>
                                        <p style="font-size:11px;color:#94a3b8">Firma del/la Doctor/a</p>
                                        <p style="font-size:12px;font-weight:700">${jm.doctor}</p>
                                      </div>
                                      <div style="text-align:right;font-size:11px;color:#94a3b8">
                                        <p>Donostia, ${new Date().toLocaleDateString('es-ES')}</p>
                                        <p style="margin-top:8px;font-size:10px">Sello de la clínica</p>
                                        <div style="border:1px solid #e2e8f0;width:120px;height:60px;margin-left:auto;margin-top:4px;border-radius:8px"></div>
                                      </div>
                                    </div>
                                    </body></html>`);
                                    w.document.close();
                                    w.print();
                                    setJustificanteModal(null);
                                }}
                                className="flex-1 py-2.5 bg-[#051650] text-white rounded-xl text-sm font-bold hover:bg-[#0056b3] transition-all flex items-center justify-center gap-2">
                                🖨️ Imprimir
                            </button>
                        </div>
                        {/* WhatsApp */}
                        {justificanteModal.telefono && (
                            <div className="px-5 pb-4">
                                <button
                                    onClick={() => {
                                        const jm = justificanteModal;
                                        const txt = `📄 Justificante de asistencia\n\nPaciente: ${jm.paciente}\nFecha: ${jm.fecha}\nHora: ${jm.hora} h\nTratamiento: ${jm.tratamiento}\nDoctor/a: ${jm.doctor}\n\n${jm.texto}\n\n— Rubio García Dental`;
                                        if (isEvolutionConfigured()) {
                                            sendTextMessage(jm.telefono, txt);
                                        } else {
                                            window.open(`https://api.smilestudio.io '')}?text=${encodeURIComponent(txt)}`, '_blank');
                                        }
                                        setJustificanteModal(null);
                                    }}
                                    className="w-full py-2 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1ebe5a] transition-all flex items-center justify-center gap-2">
                                    💬 Enviar por WhatsApp
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Block Modal */}
            {
                showBlockModal && (
                    <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="bg-[#051650] px-5 py-4 flex items-center justify-between pointer-events-none">
                                <h3 className="text-white font-bold text-[14px] flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-[#FF4B68]" />
                                    Bloquear Tramo
                                </h3>
                                <button onClick={() => setShowBlockModal(false)} className="text-slate-300 hover:text-white transition-colors pointer-events-auto">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-5 flex flex-col gap-4">
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Doctor / Agenda</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={blockForm.gabinete}
                                        onChange={e => setBlockForm({ ...blockForm, gabinete: e.target.value })}
                                    >
                                        <option value="G1">Dr. Mario Rubio</option>
                                        <option value="G2">Dra. Irene García</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hora Inicio</label>
                                        <input
                                            type="time"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={blockForm.hora}
                                            onChange={e => setBlockForm({ ...blockForm, hora: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duración</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={blockForm.duracion}
                                            onChange={e => setBlockForm({ ...blockForm, duracion: Number(e.target.value) })}
                                        >
                                            <option value={15}>15 minutos</option>
                                            <option value={30}>30 minutos</option>
                                            <option value={45}>45 minutos</option>
                                            <option value={60}>1 hora</option>
                                            <option value={120}>2 horas</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Motivo / Etiqueta</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 font-medium"
                                        placeholder="Ej: Bioseguridad, Mantenimiento..."
                                        value={blockForm.motivo}
                                        onChange={e => setBlockForm({ ...blockForm, motivo: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex gap-2 justify-end mt-2">
                                <button
                                    onClick={() => setShowBlockModal(false)}
                                    className="px-4 py-2 rounded-lg text-[12px] font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmBlockSlots}
                                    className="px-5 py-2 rounded-lg text-[12px] font-bold text-white bg-red-500 hover:bg-[#E03555] shadow-lg shadow-rose-500/30 transition-all flex items-center gap-2"
                                >
                                    <Lock className="w-3.5 h-3.5" />
                                    Insertar Bloqueo
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Quick Edit Modal Placeholder */}
            {
                editingCita && (
                    <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="bg-[#051650] px-5 py-4 flex items-center justify-between pointer-events-none">
                                <h3 className="text-white font-bold text-[14px]">Detalle de Cita</h3>
                                <button onClick={() => setEditingCita(null)} className="text-slate-300 hover:text-white transition-colors pointer-events-auto">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {/* Banner Primera Visita check */}
                            <div className="pointer-events-auto px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-2">
                                    <input
                                        id="pv-check"
                                        type="checkbox"
                                        checked={isPrimeraVisita}
                                        onChange={e => {
                                            setIsPrimeraVisita(e.target.checked);
                                            if (e.target.checked) {
                                                setEditingCita({ ...editingCita, tratamiento: 'Primera Visita' });
                                                setEsMenorForm(false);
                                                setContactoForm({ nombre: '', apellidos: '', telefono: '', email: '' });
                                                setTutorForm({ nombre: '', apellidos: '', telefono: '', email: '', relacion: '' });
                                            }
                                        }}
                                        className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
                                    />
                                    <label htmlFor="pv-check" className="text-[12px] font-bold text-slate-700 cursor-pointer select-none">
                                        🏥 Primera Visita
                                        <span className="ml-1 text-[13px] font-normal text-slate-400">— sin NumPac en GELITE</span>
                                    </label>
                                </div>
                                {isPrimeraVisita && (
                                    <span className="text-[13px] font-bold text-pink-600 bg-pink-50 border border-pink-200 rounded-full px-2 py-0.5">🔴 CITA ROSA</span>
                                )}
                            </div>
                            <div className="p-5">
                                {/* ── PRIMERA VISITA: Formulario de Contacto ───────────────── */}
                                {(isPrimeraVisita || editingCita.tratamiento === 'Primera Visita') ? (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl">
                                            <span className="text-orange-500 text-lg">👤</span>
                                            <div>
                                                <p className="text-[13px] font-bold text-orange-700 uppercase tracking-wide">Contacto Nuevo — Sin NumPac</p>
                                                <p className="text-[13px] text-orange-500">El paciente no tiene expediente en GELITE todavía. Se asignará NumPac al acudir.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre <span className="text-[#FF4B68]">*</span></label>
                                                <input
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-orange-300 focus:outline-none"
                                                    placeholder="Juan"
                                                    value={contactoForm.nombre}
                                                    onChange={e => setContactoForm(p => ({ ...p, nombre: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Apellidos</label>
                                                <input
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-orange-300 focus:outline-none"
                                                    placeholder="García López"
                                                    value={contactoForm.apellidos}
                                                    onChange={e => setContactoForm(p => ({ ...p, apellidos: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Teléfono <span className="text-[#FF4B68]">*</span></label>
                                                <input
                                                    type="tel"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-orange-300 focus:outline-none"
                                                    placeholder="+34 600 000 000"
                                                    value={contactoForm.telefono}
                                                    onChange={e => setContactoForm(p => ({ ...p, telefono: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
                                                <input
                                                    type="email"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-orange-300 focus:outline-none"
                                                    placeholder="juan@ejemplo.com"
                                                    value={contactoForm.email}
                                                    onChange={e => setContactoForm(p => ({ ...p, email: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        {/* Toggle menor */}
                                        <div className="mt-3 flex items-center gap-2">
                                            <input
                                                id="menor-check"
                                                type="checkbox"
                                                checked={esMenorForm}
                                                onChange={e => setEsMenorForm(e.target.checked)}
                                                className="w-4 h-4 rounded accent-blue-500"
                                            />
                                            <label htmlFor="menor-check" className="text-[13px] font-bold text-slate-600 cursor-pointer select-none">
                                                👶 Es menor de edad — datos del tutor requeridos
                                            </label>
                                        </div>
                                        {/* Datos tutor */}
                                        {esMenorForm && (
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                                <p className="text-[13px] font-bold text-blue-700 uppercase tracking-wide mb-2">👨‍👦 Datos del Tutor Legal</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[13px] font-bold text-blue-600 mb-1">Nombre tutor <span className="text-[#FF4B68]">*</span></label>
                                                        <input className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-[12px] font-bold text-[#051650] focus:ring-1 focus:ring-blue-300 focus:outline-none"
                                                            placeholder="María" value={tutorForm.nombre}
                                                            onChange={e => setTutorForm(p => ({ ...p, nombre: e.target.value }))} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[13px] font-bold text-blue-600 mb-1">Apellidos tutor</label>
                                                        <input className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-[12px] font-bold text-[#051650] focus:ring-1 focus:ring-blue-300 focus:outline-none"
                                                            placeholder="García" value={tutorForm.apellidos}
                                                            onChange={e => setTutorForm(p => ({ ...p, apellidos: e.target.value }))} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[13px] font-bold text-blue-600 mb-1">Teléfono tutor <span className="text-[#FF4B68]">*</span></label>
                                                        <input type="tel" className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-[12px] font-bold text-[#051650] focus:ring-1 focus:ring-blue-300 focus:outline-none"
                                                            placeholder="+34 600 000 000" value={tutorForm.telefono}
                                                            onChange={e => setTutorForm(p => ({ ...p, telefono: e.target.value }))} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[13px] font-bold text-blue-600 mb-1">Email tutor</label>
                                                        <input type="email" className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-[12px] font-bold text-[#051650] focus:ring-1 focus:ring-blue-300 focus:outline-none"
                                                            placeholder="maria@ejemplo.com" value={tutorForm.email}
                                                            onChange={e => setTutorForm(p => ({ ...p, email: e.target.value }))} />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-[13px] font-bold text-blue-600 mb-1">Relación</label>
                                                        <select className="w-full bg-white border border-blue-200 rounded-lg px-2 py-1.5 text-[12px] font-bold text-[#051650] focus:ring-1 focus:ring-blue-300 focus:outline-none"
                                                            value={tutorForm.relacion} onChange={e => setTutorForm(p => ({ ...p, relacion: e.target.value }))}>
                                                            <option value="">Seleccionar...</option>
                                                            <option value="padre">Padre</option>
                                                            <option value="madre">Madre</option>
                                                            <option value="tutor_legal">Tutor legal</option>
                                                            <option value="otro">Otro</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {contactoError && <p className="text-[13px] text-red-500 mt-2">⚠️ {contactoError}</p>}
                                    </div>
                                ) : (
                                    <div className="mb-4 relative">
                                        <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Paciente</label>
                                        <div className="flex gap-2 mb-1">
                                            <div className="flex-1 relative">
                                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    placeholder="Buscar por nombre, ID, teléfono..."
                                                    value={patientQuery || editingCita.nombrePaciente}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setPatientQuery(val);
                                                        setEditingCita({ ...editingCita, nombrePaciente: val });
                                                        if (patientSearchTimer.current) clearTimeout(patientSearchTimer.current);
                                                        patientSearchTimer.current = setTimeout(async () => {
                                                            if (val.trim().length >= 2) {
                                                                const results = await searchPacientes(val.trim());
                                                                setPatientResults(results);
                                                                setShowPatientDropdown(true);
                                                            } else {
                                                                setPatientResults([]);
                                                                setShowPatientDropdown(false);
                                                            }
                                                        }, 300);
                                                    }}
                                                    onFocus={async () => {
                                                        if (patientQuery.trim().length >= 2) {
                                                            setShowPatientDropdown(true);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="w-20">
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    placeholder="ID"
                                                    value={editingCita.pacienteNumPac}
                                                    onChange={e => setEditingCita({ ...editingCita, pacienteNumPac: e.target.value })}
                                                    title="NumPac / ID del paciente"
                                                />
                                            </div>
                                        </div>
                                        {/* Dropdown de resultados */}
                                        {showPatientDropdown && patientResults.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full z-50 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-1">
                                                {patientResults.map(p => (
                                                    <button
                                                        key={p.numPac}
                                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-0"
                                                        onClick={() => {
                                                            setEditingCita({
                                                                ...editingCita,
                                                                nombrePaciente: `${p.apellidos}, ${p.nombre}`.trim(),
                                                                pacienteNumPac: p.numPac,
                                                            });
                                                            setPatientQuery('');
                                                            setShowPatientDropdown(false);
                                                        }}
                                                    >
                                                        <span className="text-[13px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>{p.numPac}</span>
                                                        <span className="text-[12px] font-bold text-slate-800 truncate">{p.apellidos}, {p.nombre}</span>
                                                        {p.telefono && <span className="text-[13px] text-slate-400 ml-auto shrink-0">📞 {p.telefono}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {showPatientDropdown && patientResults.length === 0 && patientQuery.trim().length >= 2 && (
                                            <div className="absolute left-0 right-0 top-full z-50 bg-white border border-slate-200 rounded-xl shadow-xl mt-1 p-3 text-center">
                                                <p className="text-[13px] text-slate-400">Sin resultados</p>
                                                <button
                                                    className="text-[13px] font-bold text-blue-600 mt-1 hover:underline"
                                                    onClick={() => {
                                                        setEditingCita({ ...editingCita, nombrePaciente: patientQuery, pacienteNumPac: '' });
                                                        setShowPatientDropdown(false);
                                                    }}
                                                >
                                                    + Paciente nuevo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )} {/* End Primera Visita / Paciente conditional */}

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tratamiento</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={editingCita.tratamiento}
                                            onChange={e => setEditingCita({ ...editingCita, tratamiento: e.target.value })}
                                        >
                                            {agendaTratamientos.map(t => <option key={t.idIcono} value={t.descripcion}>{t.descripcion}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Doctor</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={editingCita.doctor}
                                            onChange={e => setEditingCita({ ...editingCita, doctor: e.target.value })}
                                        >
                                            {agendaDoctores.map(d => <option key={d.idUsu} value={d.nombre}>{d.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hora Inicio</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={editingCita.horaInicio}
                                            onChange={e => setEditingCita({ ...editingCita, horaInicio: e.target.value })}
                                        >
                                            {Array.from({ length: 14 * 4 }, (_, i) => {
                                                const h = Math.floor(i / 4) + 8;
                                                const m = (i % 4) * 15;
                                                const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                                                return <option key={val} value={val}>{val}</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duración</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={editingCita.duracionMinutos}
                                            onChange={e => setEditingCita({ ...editingCita, duracionMinutos: Number(e.target.value) })}
                                        >
                                            {[15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180].map(m => (
                                                <option key={m} value={m}>{m} minutos</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Situación Cita</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-bold text-[#051650] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={editingCita.estado}
                                        onChange={e => setEditingCita({ ...editingCita, estado: e.target.value as any })}
                                    >
                                        {agendaEstados.map(e => (
                                            <option key={e.idSitC} value={e.descripcion.toLowerCase()}>{e.descripcion}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Notas / Observaciones</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-[#051650] focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                        rows={3}
                                        placeholder="Notas libres sobre la cita..."
                                        value={editingCita.notas || ''}
                                        onChange={e => setEditingCita({ ...editingCita, notas: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-6 border-t border-slate-100 pt-4">
                                    <button onClick={() => setEditingCita(null)} className="px-5 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
                                    <button onClick={async () => {
                                        // Primera Visita: crear contacto primero
                                        if (isPrimeraVisita || editingCita.tratamiento === 'Primera Visita') {
                                            if (!contactoForm.nombre.trim() || !contactoForm.telefono.trim()) {
                                                setContactoError('Nombre y teléfono son obligatorios');
                                                return;
                                            }
                                            if (esMenorForm && (!tutorForm.nombre.trim() || !tutorForm.telefono.trim())) {
                                                setContactoError('Nombre y teléfono del tutor son obligatorios para menores');
                                                return;
                                            }
                                            setContactoSaving(true);
                                            setContactoError(null);
                                            try {
                                                const fechaCita = new Date(`${dateToISO(selectedDate)}T${editingCita.horaInicio}`);
                                                // Detectar si la cita es en menos de 24h
                                                const horasHastaCita = (fechaCita.getTime() - Date.now()) / 36e5;
                                                const esUrgente = horasHastaCita < 24;
                                                const { contacto, linkCuestionario } = await crearContacto({
                                                    nombre: contactoForm.nombre,
                                                    apellidos: contactoForm.apellidos,
                                                    telefono: contactoForm.telefono,
                                                    email: contactoForm.email,
                                                    fechaCita,
                                                    doctorAsignado: editingCita.doctor,
                                                    tratamientoAdicional: editingCita.tratamiento !== 'Primera Visita' ? editingCita.tratamiento : undefined,
                                                    esMenor: esMenorForm,
                                                    nombreTutor: esMenorForm ? tutorForm.nombre : undefined,
                                                    apellidosTutor: esMenorForm ? tutorForm.apellidos : undefined,
                                                    telefonoTutor: esMenorForm ? tutorForm.telefono : undefined,
                                                    emailTutor: esMenorForm ? tutorForm.email : undefined,
                                                    relacionTutor: esMenorForm ? tutorForm.relacion : undefined,
                                                    canalEntrada: 'recepcion',
                                                });
                                                logger.info('[Agenda] Contacto creado:', contacto.id, '| Urgente:', esUrgente, '| Link cuest:', linkCuestionario);
                                                // Color rosa para Primera Visita
                                                const citaConContacto = {
                                                    ...editingCita,
                                                    tratamiento: 'Primera Visita',
                                                    nombrePaciente: `👤 ${[contactoForm.nombre, contactoForm.apellidos].filter(Boolean).join(' ')}`,
                                                    pacienteNumPac: `CTX-${contacto.id.substring(0, 8)}`,
                                                };
                                                setCitas(prev => [...prev.filter(c => c.id !== editingCita.id), citaConContacto]);
                                                await createCita(citaConContacto, selectedDate);
                                                setContactoForm({ nombre: '', apellidos: '', telefono: '', email: '' });
                                                setTutorForm({ nombre: '', apellidos: '', telefono: '', email: '', relacion: '' });
                                                setEsMenorForm(false);
                                                setIsPrimeraVisita(false);
                                                setEditingCita(null);
                                            } catch (e) {
                                                setContactoError(e instanceof Error ? e.message : 'Error al crear contacto');
                                            } finally {
                                                setContactoSaving(false);
                                            }
                                            return;
                                        }
                                        // Paciente existente: flujo normal
                                        setCitas(prev => prev.map(c => c.id === editingCita.id ? editingCita : c));
                                        updateCita(editingCita.id, editingCita, selectedDate);
                                        setEditingCita(null);
                                    }} className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center gap-2 disabled:opacity-50" disabled={contactoSaving}>
                                        {contactoSaving ? '⏳ Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Agenda;
