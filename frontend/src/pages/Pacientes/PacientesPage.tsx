import { useState } from 'react';
import {
    MessageCircle, Calendar as CalendarIcon, Edit3, RefreshCw,
    ChevronDown, Mic, CheckCircle2, Search, PlusCircle,
    Monitor, Image as ImageIcon, Camera, Users,
    FileText, Activity, BarChart3, FileCheck, CreditCard, ClipboardList,
    X, Upload, Stethoscope, AlertTriangle, Plus, ChevronRight,
    ZoomIn, ZoomOut, RotateCcw, Sun, Contrast, Layers, Download
} from 'lucide-react';
import { useOutletContext, useLocation } from 'react-router-dom';

/* ═══ PACIENTES — FULL IMPLEMENTATION ═══ */

const DEMO_PATIENT = {
    id: 4134,
    name: 'JUAN ANTONIO MANZANEDO DELGADO',
    dni: '52982664W',
    phone: '600 000 000',
    age: 38,
    tier: 'PREMIUM',
    signPending: true,
};

export default function PacientesPage() {
    const { activeSub } = useOutletContext<{ activeSub: string | null }>();
    const { pathname } = useLocation();
    const pathSub = pathname.split('/')[2];
    const sub = pathSub || activeSub || 'person';

    const [patient, setPatient] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    if (!patient) {
        return (
            <>
                <EmptyState onSearch={() => setShowModal(true)} onNew={() => setShowModal(true)} />
                {showModal && <PatientModal onClose={() => setShowModal(false)} onSelect={() => { setPatient(DEMO_PATIENT); setShowModal(false); }} />}
            </>
        );
    }

    return (
        <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Patient Banner */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: 16, background: '#051650', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 800 }}>#NUMPAC</span>
                            <span style={{ fontSize: 20, fontWeight: 900 }}>{patient.id}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <h1 style={{ fontSize: 20, fontWeight: 900, color: '#051650', margin: 0 }}>{patient.name}</h1>
                                <span style={{ padding: '4px 8px', borderRadius: 4, background: '#eff6ff', color: '#3b82f6', fontSize: 10, fontWeight: 900 }}>{patient.tier}</span>
                                {patient.signPending && <span style={{ padding: '4px 8px', borderRadius: 4, background: '#fef3c7', color: '#d97706', fontSize: 10, fontWeight: 900 }}>Firma pendiente</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 20, marginTop: 8, color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>
                                <span>🆔 {patient.dni}</span>
                                <span>📞 {patient.phone}</span>
                                <span>🎂 {patient.age} años</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <Btn icon={<MessageCircle size={14} />} label="WHATSAPP" primary />
                            <Btn icon={<CalendarIcon size={14} />} label="NUEVA CITA" />
                            <Btn icon={<Edit3 size={14} />} label="EDITAR" />
                            <Btn icon={<RefreshCw size={14} />} label="CAMBIAR" dark onClick={() => setPatient(null)} />
                        </div>
                    </div>
                </div>

                {/* Subview content */}
                {sub === 'person' && <HistoriaClinica />}
                {sub === 'steth' && <AnamnesisView />}
                {sub === 'tooth' && <OdontogramaView />}
                {sub === 'perio' && <SondajePeriodontalView />}
                {sub === 'docs' && <DocumentosView />}
                {sub === 'cc' && <CuentaCorrienteView />}
                {sub === 'presup' && <PresupuestosView />}
            </div>

            {/* Right column: media */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <MediaSection title="RX" label="DEMO" date="25 Mar 2024" type="rx" />
                <MediaSection title="FOTOS" label="DEMO" date="Frente" type="photo" />
            </div>
        </div>
    );
}

/* ─── EMPTY STATE ────────────────────────────────────── */
function EmptyState({ onSearch, onNew }: any) {
    return (
        <div style={{ height: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f4f7f9', gap: 32 }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 120, height: 120, borderRadius: 32, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', margin: '0 auto 24px' }}>
                    <Users size={64} style={{ color: '#cbd5e1' }} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#051650', marginBottom: 8 }}>NINGÚN PACIENTE SELECCIONADO</h2>
                <p style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Busca una ficha existente o crea un paciente nuevo.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={onSearch} style={{ background: '#051650', color: '#fff', fontWeight: 900, fontSize: 13, padding: '14px 28px', borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Search size={16} /> BUSCAR PACIENTE
                </button>
                <button onClick={onNew} style={{ background: '#fff', color: '#051650', fontWeight: 900, fontSize: 13, padding: '14px 28px', borderRadius: 14, border: '2px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PlusCircle size={16} /> NUEVO PACIENTE
                </button>
            </div>
        </div>
    );
}

/* ─── PATIENT MODAL (BUSCAR / NUEVO) ─────────────────── */
function PatientModal({ onClose, onSelect }: any) {
    const [tab, setTab] = useState<'buscar' | 'nuevo'>('buscar');
    const [query, setQuery] = useState('');
    const [inputFocused, setInputFocused] = useState(false);

    const showResult = query.length >= 4;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,2,39,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
                {/* Modal header — navy */}
                <div style={{ background: '#0D1B4B', height: 60, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Search size={18} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '0.06em' }}>BUSCAR PACIENTE</div>
                            <div style={{ fontSize: 11, color: '#67e8f9', fontWeight: 600, marginTop: 1 }}>Por nombre, apellidos, Nº paciente o teléfono</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Tabs — underline style */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 24px', background: '#fff' }}>
                    {(['buscar', 'nuevo'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                padding: '14px 20px',
                                border: 'none',
                                background: 'transparent',
                                borderBottom: tab === t ? '3px solid #0D1B4B' : '3px solid transparent',
                                color: tab === t ? '#0D1B4B' : '#94a3b8',
                                fontWeight: 900,
                                fontSize: 12,
                                cursor: 'pointer',
                                letterSpacing: '0.06em',
                                marginBottom: -1,
                                transition: 'all 0.15s',
                            }}
                        >
                            {t === 'buscar' ? 'BUSCAR' : '+ NUEVO PACIENTE'}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                    {tab === 'buscar' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{
                                    flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                                    background: '#f8fafc',
                                    border: inputFocused ? '1px solid #0D1B4B' : '1px solid #e2e8f0',
                                    borderRadius: 12, padding: '12px 16px',
                                    boxShadow: inputFocused ? '0 0 0 3px rgba(13,27,75,0.08)' : 'none',
                                    transition: 'all 0.15s',
                                }}>
                                    <Search size={16} color={inputFocused ? '#0D1B4B' : '#94a3b8'} />
                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        onFocus={() => setInputFocused(true)}
                                        onBlur={() => setInputFocused(false)}
                                        placeholder="Mínimo 4 caracteres: nombre, apellidos, Nº paciente o teléfono..."
                                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1, color: '#051650' }}
                                    />
                                </div>
                            </div>
                            {!showResult && (
                                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 600, padding: '40px 0' }}>Introduce al menos 4 caracteres para buscar</p>
                            )}
                            {showResult && (
                                <div onClick={onSelect} style={{ padding: '16px 20px', borderRadius: 12, border: '2px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#0D1B4B')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#0D1B4B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <span style={{ fontSize: 8, fontWeight: 800 }}>#NUMPAC</span>
                                        <span style={{ fontSize: 14, fontWeight: 900 }}>4134</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 900, color: '#051650', fontSize: 14 }}>JUAN ANTONIO MANZANEDO DELGADO</div>
                                        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>52982664W · 600 000 000 · 38 años</div>
                                    </div>
                                    <span style={{ padding: '3px 8px', borderRadius: 4, background: '#eff6ff', color: '#3b82f6', fontSize: 10, fontWeight: 900 }}>PREMIUM</span>
                                    <ChevronRight size={16} color="#94a3b8" />
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'nuevo' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Photo + ID */}
                            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                                <div style={{ width: 100, height: 100, borderRadius: 16, background: '#f1f5f9', border: '2px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
                                    <Upload size={20} color="#94a3b8" />
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>FOTO</span>
                                </div>
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <FormInput label="Nombre *" placeholder="Nombre" />
                                    <FormInput label="Apellidos *" placeholder="Apellidos" />
                                    <FormInput label="DNI / NIE" placeholder="00000000X" />
                                    <FormInput label="Fecha de nacimiento" placeholder="DD/MM/AAAA" />
                                </div>
                            </div>

                            <SectionTitle title="DATOS DE CONTACTO" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <FormInput label="Teléfono móvil *" placeholder="+34 600 000 000" />
                                <FormInput label="Email" placeholder="email@ejemplo.com" />
                                <FormInput label="Teléfono fijo" placeholder="+34 91 000 00 00" />
                                <FormInput label="WhatsApp" placeholder="Mismo que móvil si vacío" />
                            </div>

                            <SectionTitle title="DIRECCIÓN" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <FormInput label="Dirección" placeholder="Calle, número, piso..." style={{ gridColumn: 'span 2' }} />
                                <FormInput label="Código Postal" placeholder="28000" />
                                <FormInput label="Ciudad" placeholder="Madrid" />
                                <FormInput label="Provincia" placeholder="Madrid" />
                                <FormInput label="País" placeholder="España" />
                            </div>

                            <SectionTitle title="HISTORIAL MÉDICO" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                                <FormInput label="Alergias" placeholder="Ej: Látex, penicilina, ibuprofeno..." multiline />
                                <FormInput label="Medicación actual" placeholder="Medicamentos que toma habitualmente..." multiline />
                                <FormInput label="Observaciones médicas" placeholder="Enfermedades crónicas, antecedentes relevantes..." multiline />
                            </div>

                            <button style={{ background: '#051650', color: '#fff', fontWeight: 900, fontSize: 14, padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer', letterSpacing: '0.06em', marginTop: 8 }}>
                                CREAR FICHA DE PACIENTE
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── HISTORIA CLÍNICA ───────────────────────────────── */
function HistoriaClinica() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: 12, fontWeight: 900, color: '#051650', margin: 0 }}>ENTRADAS MÉDICAS</h3>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8' }}>4</span>
                </div>
                <TimelineEntry date="17" month="MAY" year="2021" title="ODONTOLOGÍA GENERAL" doctor="Alicia" note="LIMPIEZA hecha a Alberto Manzanedo" />
                <TimelineEntry date="11" month="NOV" year="2020" title="ODONTOLOGÍA GENERAL" doctor="Lydia Abalos" note="REBASE Y COMPOSTURA MIGUEL PLAZA. TRABAJO FACTURADO A TRIDENTAL" />
                <TimelineEntry date="27" month="AGO" year="2020" title="ODONTOLOGÍA GENERAL" doctor="Virginia Tresgallo" note="LIMPIEZA" />
                <div style={{ padding: '12px 24px', background: '#051650', color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>ⓘ</span>
                    <span style={{ fontSize: 12, fontWeight: 600, fontStyle: 'italic' }}>Paciente con recurrencia en dolor. Alergia al látex activa — asegurar protocolo AEMPS</span>
                </div>
            </div>

            <div className="card" style={{ padding: 24, borderRadius: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 900, color: '#051650', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#051650', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <Mic size={16} />
                        </div>
                        NUEVO EVOLUTIVO
                    </h3>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <DropBtn label="11/03/2026" icon={<CalendarIcon size={14} />} />
                        <DropBtn label="GENERAL / LIBRE" icon={<ChevronDown size={14} />} />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#f43f5e', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e' }} /> TRATAMIENTO (obligatorio)
                        </div>
                        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Search size={16} color="#cbd5e1" /> Buscar tratamiento...
                        </div>
                    </div>
                    <SoapField label="S — SUBJETIVO" placeholder="Motivo de consulta, palabras del paciente..." color="#2563eb" />
                    <SoapField label="O — OBJETIVO" placeholder="Hallazgos físicos, pruebas, radiografías..." color="#d946ef" />
                    <SoapField label="A — ANÁLISIS" placeholder="Juicio clínico y pronóstico..." color="#059669" />
                    <SoapField label="P — PLAN" placeholder="Tratamiento ejecutado, medicación, instrucciones..." color="#1e293b" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>El registro se bloquea legalmente 24h tras la firma electrónica.</p>
                    <button style={{ padding: '12px 32px', borderRadius: 12, background: '#051650', color: '#fff', fontSize: 13, fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileCheck size={18} /> FIRMAR
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── ANAMNESIS ──────────────────────────────────────── */
function AnamnesisView() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h3 style={{ fontSize: 13, fontWeight: 900, color: '#051650', margin: 0 }}>CUESTIONARIO DE SALUD</h3>
                        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>Anamnesis médica completa — última actualización: —</p>
                    </div>
                    <button style={{ padding: '10px 20px', borderRadius: 10, background: '#051650', color: '#fff', fontWeight: 900, fontSize: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PlusCircle size={14} /> INICIAR CUESTIONARIO
                    </button>
                </div>
                <div style={{ padding: '60px 40px', textAlign: 'center', background: '#f8fafc', borderRadius: 16, border: '1px dashed #e2e8f0' }}>
                    <Stethoscope size={48} style={{ color: '#cbd5e1', marginBottom: 16 }} />
                    <h3 style={{ fontSize: 13, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>CUESTIONARIO PENDIENTE</h3>
                    <p style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, marginTop: 8 }}>El paciente aún no ha completado el cuestionario de salud</p>
                </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 12, fontWeight: 900, color: '#051650', marginBottom: 20 }}>ALERTAS MÉDICAS ACTIVAS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <AlertRow label="ALERGIA AL LÁTEX" level="danger" />
                    <AlertRow label="Sin medicación activa registrada" level="ok" />
                    <AlertRow label="Sin enfermedades sistémicas registradas" level="ok" />
                </div>
            </div>
        </div>
    );
}

function AlertRow({ label, level }: { label: string; level: 'danger' | 'warn' | 'ok' }) {
    const color = level === 'danger' ? '#ef4444' : level === 'warn' ? '#f59e0b' : '#22c55e';
    const bg = level === 'danger' ? '#fef2f2' : level === 'warn' ? '#fefce8' : '#f0fdf4';
    return (
        <div style={{ padding: '10px 16px', borderRadius: 10, background: bg, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={14} style={{ color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{label}</span>
        </div>
    );
}

/* ─── ODONTOGRAMA FDI ────────────────────────────────── */
const FDI_UPPER = [
    [18,17,16,15,14,13,12,11],
    [21,22,23,24,25,26,27,28]
];
const FDI_LOWER = [
    [48,47,46,45,44,43,42,41],
    [31,32,33,34,35,36,37,38]
];

const TOOTH_COLORS: Record<string, string> = {
    sano: '#22c55e',
    caries: '#f59e0b',
    extraccion: '#ef4444',
    corona: '#3b82f6',
    endodoncia: '#8b5cf6',
    implante: '#0ea5e9',
    ausente: '#94a3b8',
};

const TOOLS = [
    { id: 'sano', label: 'Sano', color: '#22c55e' },
    { id: 'caries', label: 'Caries', color: '#f59e0b' },
    { id: 'extraccion', label: 'Extracción', color: '#ef4444' },
    { id: 'corona', label: 'Corona', color: '#3b82f6' },
    { id: 'endodoncia', label: 'Endodoncia', color: '#8b5cf6' },
    { id: 'implante', label: 'Implante', color: '#0ea5e9' },
    { id: 'ausente', label: 'Ausente', color: '#94a3b8' },
];

function OdontogramaView() {
    const [selectedTool, setSelectedTool] = useState('caries');
    const [teeth, setTeeth] = useState<Record<number, string>>({});
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

    const paintTooth = (num: number) => {
        setTeeth(prev => ({ ...prev, [num]: selectedTool }));
        setSelectedTooth(num);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: 13, fontWeight: 900, color: '#051650', margin: 0 }}>ODONTOGRAMA FDI</h3>
                        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>32 dientes · Sistema FDI (ISO 3950)</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: '#051650' }}>LIMPIAR</button>
                        <button style={{ padding: '8px 16px', borderRadius: 8, background: '#051650', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: '#fff' }}>GUARDAR</button>
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {TOOLS.map(t => (
                        <button key={t.id} onClick={() => setSelectedTool(t.id)} style={{ padding: '6px 14px', borderRadius: 8, border: `2px solid ${selectedTool === t.id ? t.color : '#e2e8f0'}`, background: selectedTool === t.id ? `${t.color}18` : '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: selectedTool === t.id ? t.color : '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Teeth grid */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Superior */}
                    <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 4 }}>MAXILAR SUPERIOR</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                        {FDI_UPPER[0].map(n => <ToothIcon key={n} num={n} color={teeth[n] ? TOOTH_COLORS[teeth[n]] : undefined} selected={selectedTooth === n} onClick={() => paintTooth(n)} />)}
                        <div style={{ width: 24 }} />
                        {FDI_UPPER[1].map(n => <ToothIcon key={n} num={n} color={teeth[n] ? TOOTH_COLORS[teeth[n]] : undefined} selected={selectedTooth === n} onClick={() => paintTooth(n)} />)}
                    </div>
                    <div style={{ borderTop: '2px dashed #e2e8f0', margin: '4px 0', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '50%', top: -8, transform: 'translateX(-50%)', background: '#fff', padding: '0 8px', fontSize: 9, fontWeight: 800, color: '#94a3b8' }}>LÍNEA MEDIA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                        {FDI_LOWER[0].map(n => <ToothIcon key={n} num={n} color={teeth[n] ? TOOTH_COLORS[teeth[n]] : undefined} selected={selectedTooth === n} onClick={() => paintTooth(n)} lower />)}
                        <div style={{ width: 24 }} />
                        {FDI_LOWER[1].map(n => <ToothIcon key={n} num={n} color={teeth[n] ? TOOTH_COLORS[teeth[n]] : undefined} selected={selectedTooth === n} onClick={() => paintTooth(n)} lower />)}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', marginTop: 4 }}>MANDÍBULA INFERIOR</div>
                </div>
            </div>

            {/* IA Panel */}
            <div style={{ background: 'linear-gradient(135deg, #051650, #1F027F)', borderRadius: 16, padding: 24, color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: 13, fontWeight: 900, margin: 0 }}>IA DENTAL ANALYSIS</h3>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginTop: 4 }}>Análisis automático del estado del odontograma con sugerencias de tratamiento</p>
                    </div>
                    <button style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                        ANALIZAR CON IA →
                    </button>
                </div>
            </div>
        </div>
    );
}

function ToothIcon({ num, color, selected, onClick, lower }: any) {
    return (
        <div onClick={onClick} title={`Diente ${num}`} style={{ display: 'flex', flexDirection: lower ? 'column-reverse' : 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
            <span style={{ fontSize: 8, fontWeight: 800, color: selected ? '#051650' : '#94a3b8' }}>{num}</span>
            <div style={{ width: 28, height: 32, borderRadius: lower ? '0 0 6px 6px' : '6px 6px 0 0', background: color || '#f1f5f9', border: `2px solid ${selected ? '#051650' : color || '#e2e8f0'}`, transition: 'all 0.15s' }} />
        </div>
    );
}

/* ─── SONDAJE PERIODONTAL ───────────────────────────── */
const PERIO_TEETH = [17,16,15,14,13,12,11,21,22,23,24,25,26,27];

function SondajePeriodontalView() {
    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: 13, fontWeight: 900, color: '#051650', margin: 0 }}>SONDAJE PERIODONTAL</h3>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Registro de profundidad de sondaje (mm) — Sistema de 6 puntos por diente</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: '#051650' }}>NUEVO REGISTRO</button>
                    <button style={{ padding: '8px 16px', borderRadius: 8, background: '#051650', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}><Download size={12} /> EXPORTAR</button>
                </div>
            </div>

            <div style={{ overflowX: 'auto', padding: 24 }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '2px 0', fontSize: 11 }}>
                    <thead>
                        <tr>
                            <td style={{ width: 60, fontSize: 10, fontWeight: 900, color: '#94a3b8', padding: '0 8px 8px' }}>DIENTE</td>
                            {PERIO_TEETH.map(t => (
                                <td key={t} style={{ textAlign: 'center', fontWeight: 900, color: '#051650', padding: '0 2px 8px' }}>{t}</td>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {['VESTIBULAR', 'PALATINO'].map(face => (
                            ['MB', 'B', 'DB'].map((point, pi) => (
                                <tr key={`${face}-${point}`}>
                                    {pi === 0 && <td rowSpan={3} style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', padding: '4px 8px', writingMode: 'vertical-rl', textAlign: 'center', letterSpacing: '0.1em' }}>{face}</td>}
                                    {pi !== 0 && null}
                                    {PERIO_TEETH.map(t => (
                                        <td key={t} style={{ padding: '2px' }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>—</div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ─── DOCUMENTOS ─────────────────────────────────────── */
function DocumentosView() {
    const [tab, setTab] = useState<'pendientes' | 'historial'>('pendientes');
    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 0 }}>
                    {(['pendientes', 'historial'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: tab === t ? '#051650' : 'transparent', color: tab === t ? '#fff' : '#94a3b8', fontWeight: 900, fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em' }}>
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
                <button style={{ padding: '8px 16px', borderRadius: 8, background: '#051650', border: 'none', fontSize: 11, fontWeight: 900, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={12} /> NUEVO DOCUMENTO
                </button>
            </div>
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                <FileCheck size={48} style={{ color: '#cbd5e1', marginBottom: 16 }} />
                <h3 style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>
                    {tab === 'pendientes' ? 'SIN DOCUMENTOS PENDIENTES' : 'SIN HISTORIAL DE DOCUMENTOS'}
                </h3>
                <p style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, marginTop: 8 }}>Los documentos firmados digitalmente aparecerán aquí</p>
            </div>
        </div>
    );
}

/* ─── CUENTA CORRIENTE ───────────────────────────────── */
function CuentaCorrienteView() {
    const entries = [
        { date: '17/05/2021', concept: 'Limpieza dental', debit: 0, credit: 85, balance: -85 },
        { date: '17/05/2021', concept: 'Pago efectivo', debit: 85, credit: 0, balance: 0 },
        { date: '11/11/2020', concept: 'Rebase y compostura', debit: 0, credit: 120, balance: -120 },
        { date: '11/11/2020', concept: 'Pago tarjeta', debit: 120, credit: 0, balance: 0 },
    ];
    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: 13, fontWeight: 900, color: '#051650', margin: 0 }}>CUENTA CORRIENTE</h3>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Saldo actual: <strong style={{ color: '#22c55e' }}>€0,00</strong></p>
                </div>
                <button style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: '#051650', display: 'flex', alignItems: 'center', gap: 6 }}><Download size={12} /> EXPORTAR</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                    <tr style={{ background: '#f8fafc' }}>
                        {['FECHA', 'CONCEPTO', 'CARGO', 'ABONO', 'SALDO'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {entries.map((e, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 700 }}>{e.date}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b' }}>{e.concept}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 800, color: e.debit > 0 ? '#22c55e' : '#94a3b8' }}>{e.debit > 0 ? `€${e.debit.toFixed(2)}` : '—'}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 800, color: e.credit > 0 ? '#ef4444' : '#94a3b8' }}>{e.credit > 0 ? `€${e.credit.toFixed(2)}` : '—'}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 900, color: e.balance === 0 ? '#22c55e' : '#ef4444' }}>€{Math.abs(e.balance).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ─── PRESUPUESTOS ───────────────────────────────────── */
function PresupuestosView() {
    const budgets = [
        { id: 'P-2024-001', date: '17/05/2024', title: 'Ortodoncia completa + Blanqueamiento', total: 3200, status: 'ACEPTADO' },
        { id: 'P-2023-008', date: '10/01/2023', title: 'Corona cerámica diente 26', total: 680, status: 'COMPLETADO' },
        { id: 'P-2022-022', date: '05/06/2022', title: 'Implante unitario mandíbula', total: 1450, status: 'PENDIENTE' },
    ];
    const statusColor = (s: string) => s === 'ACEPTADO' ? { bg: '#dcfce7', color: '#16a34a' } : s === 'COMPLETADO' ? { bg: '#eff6ff', color: '#2563eb' } : { bg: '#fef9c3', color: '#ca8a04' };

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 13, fontWeight: 900, color: '#051650', margin: 0 }}>PRESUPUESTOS</h3>
                <button style={{ padding: '8px 16px', borderRadius: 8, background: '#051650', border: 'none', fontSize: 11, fontWeight: 900, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={12} /> NUEVO PRESUPUESTO
                </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {budgets.map(b => {
                    const sc = statusColor(b.status);
                    return (
                        <div key={b.id} style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 900, color: '#051650' }}>{b.title}</span>
                                    <span style={{ padding: '3px 8px', borderRadius: 4, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 900 }}>{b.status}</span>
                                </div>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{b.id} · {b.date}</div>
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#051650' }}>€{b.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                            <ChevronRight size={16} color="#94a3b8" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── HELPERS ────────────────────────────────────────── */
function MediaSection({ title, label, date, type }: any) {
    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {type === 'rx' ? <Monitor size={16} /> : <ImageIcon size={16} />}
                    <span style={{ fontSize: 12, fontWeight: 900 }}>{title}</span>
                    <span style={{ fontSize: 10, background: '#fef3c7', padding: '2px 4px', borderRadius: 4 }}>{label}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{date}</span>
            </div>
            <div style={{ height: 220, background: type === 'rx' ? '#000' : '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                {type === 'rx' ? (
                    <>
                        <div style={{ position: 'absolute', top: 12, left: 12, color: '#fff', fontSize: 11, fontWeight: 500 }}>Panorámica</div>
                        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4 }}>
                            {[ZoomIn, ZoomOut, RotateCcw, Sun, Contrast].map((Icon, i) => (
                                <button key={i} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={12} />
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 5px, #e2e8f0 5px, #e2e8f0 10px)' }} />
                )}
            </div>
            <div style={{ display: 'flex', padding: 8, gap: 6 }}>
                {type === 'rx' ? (
                    <>
                        <Thumb date="25 Mar 2024" active />
                        <Thumb date="10 Ene 2023" />
                        <Thumb date="05 Jun 2022" />
                        <div style={{ width: 44, height: 44, borderRadius: 8, border: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Camera size={14} color="#cbd5e1" />
                        </div>
                    </>
                ) : (
                    <>
                        <Thumb label="Frente" active />
                        <Thumb label="Derecha" />
                        <Thumb label="Izquierda" />
                    </>
                )}
            </div>
        </div>
    );
}

function Btn({ icon, label, primary, dark, onClick }: any) {
    return (
        <button onClick={onClick} style={{ padding: '8px 14px', borderRadius: 8, border: primary ? 'none' : '1px solid #e2e8f0', background: primary ? '#3b82f6' : dark ? '#051650' : '#fff', color: primary || dark ? '#fff' : '#051650', fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon} {label}
        </button>
    );
}

function DropBtn({ icon, label }: any) {
    return (
        <div style={{ padding: '8px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            {label} {icon}
        </div>
    );
}

function TimelineEntry({ date, month, year, title, doctor, note }: any) {
    return (
        <div style={{ padding: '20px 24px', display: 'flex', gap: 24, borderBottom: '1px solid #f8fafc' }}>
            <div style={{ width: 42, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#051650' }}>{date}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>{month}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#cbd5e1' }}>{year}</span>
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#051650' }}>{title}</span>
                    <CheckCircle2 size={12} color="#3b82f6" />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginTop: 4 }}>{doctor}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#64748b', marginTop: 8, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 800, color: '#94a3b8' }}>OBS: </span>{note}
                </div>
            </div>
            <Edit3 size={14} color="#cbd5e1" style={{ cursor: 'pointer', flexShrink: 0 }} />
        </div>
    );
}

function SoapField({ label, placeholder, color }: any) {
    return (
        <div>
            <div style={{ fontSize: 10, fontWeight: 900, color, letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} /> {label}
            </div>
            <textarea placeholder={placeholder} style={{ width: '100%', minHeight: 90, padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.5, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
    );
}

function Thumb({ date, label, active }: any) {
    return (
        <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', border: active ? '2px solid #3b82f6' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
            {date ? (
                <>
                    <span style={{ fontSize: 8, fontWeight: 900, color: '#051650', lineHeight: 1 }}>{date.split(' ')[0]}</span>
                    <span style={{ fontSize: 7, fontWeight: 800, color: '#94a3b8' }}>{date.split(' ')[1]}</span>
                </>
            ) : (
                <span style={{ fontSize: 8, fontWeight: 800, color: '#94a3b8' }}>{label}</span>
            )}
        </div>
    );
}

function SectionTitle({ title }: { title: string }) {
    return (
        <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.15em', borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginTop: 4 }}>
            {title}
        </div>
    );
}

function FormInput({ label, placeholder, multiline, style: extraStyle }: any) {
    const shared = { width: '100%', padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const };
    return (
        <div style={extraStyle}>
            <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{label}</label>
            {multiline
                ? <textarea placeholder={placeholder} rows={3} style={{ ...shared, resize: 'vertical' }} />
                : <input placeholder={placeholder} style={shared} />
            }
        </div>
    );
}
