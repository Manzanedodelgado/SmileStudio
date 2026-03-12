import { useState } from 'react';
import {
    Search, Plus, Monitor, Zap, Palette, Database,
    Maximize2, Ruler, Edit3, RotateCcw, Share2, Grid
} from 'lucide-react';

/* ═══ STUDIORX — Visor DICOM High Fidelity (22.46.50) ═══ */

export default function RadiologiaPage() {
    const [brillo, setBrillo] = useState(0);
    const [contraste, setContraste] = useState(0);
    const [nitidez, setNitidez] = useState(0);
    const [activeLut, setActiveLut] = useState('Escala de grises');

    const LUT_PRESETS = [
        'Escala de grises', 'Hueso', 'Térmico', 'Dental Suave',
        'Dental Cálido', 'Arcoíris', 'Viridis', 'Frío'
    ];

    const metadata = [
        { label: 'Modalidad', value: 'PX' },
        { label: 'Fecha', value: '20250115' },
        { label: 'kVp', value: '64' },
        { label: 'Doctor', value: 'Dra. Rubio' },
        { label: 'Institución', value: 'Clínica Rubio García' }
    ];

    return (
        <div style={{ display: 'flex', height: '100%', background: '#000', fontFamily: "'Inter', sans-serif" }}>

            {/* ── SIDEBAR CONTROLES ────────────────────── */}
            <aside style={{ width: 280, background: '#101d3a', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '24px 20px', overflowY: 'auto' }}>

                {/* Search & New */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
                    <button style={topBtnStyle}><Search size={14} /> BUSCAR</button>
                    <button style={{ ...topBtnStyle, background: '#118DF0', color: '#fff' }}><Plus size={14} /> NUEVO</button>
                </div>

                {/* Brand Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Monitor size={22} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em' }}>RADIOLOGÍA</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>RADIOLOGÍA & IMAGEN</div>
                    </div>
                </div>

                {/* IA Imagen */}
                <section style={{ marginBottom: 40 }}>
                    <h4 style={sectionHeaderStyle}><Zap size={14} /> IA IMAGEN</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <ControlSlider label="BRILLO" value={brillo} onChange={setBrillo} />
                        <ControlSlider label="CONTRASTE" value={contraste} onChange={setContraste} />
                        <ControlSlider label="NITIDEZ" value={nitidez} onChange={setNitidez} />
                    </div>
                    <button style={{
                        width: '100%', padding: '14px', borderRadius: 12,
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        color: '#fff', fontSize: 11, fontWeight: 900, marginTop: 24, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(79,70,229,0.3)'
                    }}>
                        <Zap size={14} fill="#fff" /> MEJORAR CON IA
                    </button>
                </section>

                {/* Colorización */}
                <section style={{ marginBottom: 40 }}>
                    <h4 style={sectionHeaderStyle}><Palette size={14} /> COLORIZACIÓN</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        {LUT_PRESETS.map(lut => (
                            <button
                                key={lut}
                                style={{
                                    padding: '8px 4px', fontSize: 10, fontWeight: 700, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                                    background: activeLut === lut ? 'rgba(17, 141, 240, 0.1)' : 'rgba(255,255,255,0.05)',
                                    color: activeLut === lut ? '#118DF0' : '#fff',
                                    borderColor: activeLut === lut ? '#118DF0' : 'rgba(255,255,255,0.1)',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    boxShadow: activeLut === lut ? 'inset 0 0 0 1px #118DF0' : 'none'
                                }}
                                onClick={() => setActiveLut(lut)}
                            >
                                {lut}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Metadatos DICOM */}
                <section>
                    <h4 style={sectionHeaderStyle}><Database size={14} /> METADATOS DICOM</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {metadata.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{item.label}</span>
                                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Action Buttons Footer */}
                <div style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', gap: 10 }}>
                    <button style={{ ...footerBtnStyle, border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}><Grid size={13} /> CITA</button>
                    <button style={{ ...footerBtnStyle, background: '#e03555', color: '#fff', border: 'none' }}>URGENTE</button>
                </div>
            </aside>

            {/* ── MAIN VIEWER ─────────────────────────── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Top Toolbar */}
                <header style={{ height: 44, background: '#0a0a0b', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8, gap: 4 }}>
                            <button style={toolBtnStyle}><Grid size={14} /></button>
                            <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                            {['A', 'C', 'S', 'M'].map(l => <button key={l} style={toolBtnStyle}>{l}</button>)}
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <span style={toolInfoStyle}><RotateCcw size={14} style={{ opacity: 0.5 }} /> C:300 W:1500</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Ruler size={14} color="rgba(255,255,255,0.4)" />
                                <Edit3 size={14} color="rgba(255,255,255,0.4)" />
                                <RotateCcw size={14} color="rgba(255,255,255,0.4)" />
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>128×128×64</span>
                        <Share2 size={14} color="rgba(255,255,255,0.4)" />
                        <Maximize2 size={14} color="rgba(255,255,255,0.4)" />
                    </div>
                </header>

                {/* Viewport Grid */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 4, background: '#000', padding: 4 }}>
                    <DicomPanel title="AXIAL" color="#118DF0" info="33/64" img="https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=600&sat=-100" />
                    <DicomPanel title="CORONAL" color="#10b981" info="65/128" img="https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=600&sat=-100" />
                    <DicomPanel title="SAGITAL" color="#facc15" info="65/128" img="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600&sat=-100" />
                    <DicomPanel title="MIP 3D" color="#a78bfa" info="PROCESANDO..." img="https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=600&sat=-100" />
                </div>

                {/* Footer Info Bar */}
                <footer style={{ height: 32, background: '#0a0a0b', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
                        A/C/S/M <span style={keyStyle}>Vista</span> | <span style={keyStyle}>G</span> 4-up | <span style={keyStyle}>I</span> Invertir | <span style={keyStyle}>R</span> Reset | <span style={keyStyle}>Scroll</span> Cortes | <span style={keyStyle}>Ctrl+Click</span> W/L
                    </span>
                </footer>
            </main>
        </div>
    );
}

function DicomPanel({ title, color, info, img }: any) {
    return (
        <div style={{ position: 'relative', background: '#050505', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: 9, fontWeight: 900, color: color, letterSpacing: '0.05em' }}>{title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{info}</span>
                    <Maximize2 size={10} color="rgba(255,255,255,0.3)" />
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={img} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', opacity: 0.7, filter: 'contrast(1.2)' }} alt="" />
                <div style={{ position: 'absolute', width: 2, height: 40, background: 'rgba(255,255,255,0.05)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                <div style={{ position: 'absolute', height: 2, width: 40, background: 'rgba(255,255,255,0.05)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            </div>

            <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.4)' }}>
                <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.1)', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '60%', top: -3, width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
                </div>
            </div>
        </div>
    );
}

function ControlSlider({ label, value, onChange }: any) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>{value}</span>
            </div>
            <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.1)', position: 'relative' }}>
                <input
                    type="range" min="-100" max="100" value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    style={{ position: 'absolute', top: -4, left: 0, width: '100%', height: 10, opacity: 0, cursor: 'pointer' }}
                />
                <div style={{ position: 'absolute', left: `${(value + 100) / 2}%`, top: -3, width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
            </div>
        </div>
    );
}

const topBtnStyle = { flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#fff', color: '#101d3a', fontSize: 10, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 };
const sectionHeaderStyle = { fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 };
const toolBtnStyle = { border: 'none', background: 'transparent', color: '#fff', padding: '4px 8px', fontSize: 11, fontWeight: 900, borderRadius: 6, cursor: 'pointer' };
const toolInfoStyle = { fontSize: 10, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 };
const keyStyle = { padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: 4, color: 'rgba(255,255,255,0.5)', margin: '0 2px' };
const footerBtnStyle = { flex: 1, padding: '10px', borderRadius: 10, fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 };
