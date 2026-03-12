import { useOutletContext, useLocation } from 'react-router-dom';
import {
    Brain, Zap, Activity, ShieldCheck, Cpu,
    MessageSquare, GitBranch, FileText, ClipboardList,
    CheckCircle2, ChevronDown, ChevronUp,
    MessageCircle, Send, Save, Settings,
    Plus, Trash2, Clock, Mail, ArrowRight,
    FileCode, Copy, Edit2, Search, X
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { iaApi, type AIConfigData, type AutomationData } from '../../services/ia.api';

type OutletCtx = { activeSub: string | null };
type ChatMsg = { role: 'user' | 'ai'; text: string };

/* ═══════════════════════════════════════════════════════════════════
   IA & AUTOMATIZACIÓN — Cerebro Digital
   ═══════════════════════════════════════════════════════════════════ */

export default function IAAutomationPage() {
    const { activeSub } = useOutletContext<OutletCtx>();
    const { pathname } = useLocation();
    const pathSub = pathname.split('/')[2];
    const sub = pathSub || activeSub || 'panel';

    const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
        { role: 'ai', text: 'Hola, soy IA Dental, el asistente de Rubio García Dental. ¿En qué puedo ayudarte?' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMsgs]);

    const sendChat = async () => {
        const msg = chatInput.trim();
        if (!msg || chatLoading) return;
        setChatInput('');
        setChatMsgs(prev => [...prev, { role: 'user', text: msg }]);
        setChatLoading(true);
        try {
            const res = await iaApi.copilotChat(msg);
            setChatMsgs(prev => [...prev, { role: 'ai', text: res.text }]);
        } catch {
            setChatMsgs(prev => [...prev, { role: 'ai', text: 'Error al contactar con la IA. Verifica la configuración de API keys.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    const renderHeaderTitle = () => {
        if (sub === 'panel') return <><Zap size={14} color="#118df0" /> PANEL IA</>;
        if (sub === 'dental') return <><Zap size={14} color="#118df0" /> IA DENTAL ✦</>;
        if (sub === 'auto') return <><Zap size={14} color="#118df0" /> AUTOMATIZACIONES</>;
        if (sub === 'flows') return <><Zap size={14} color="#118df0" /> FLUJOS</>;
        if (sub === 'editor') return <><Zap size={14} color="#118df0" /> EDITOR</>;
        if (sub === 'tpl') return <><Zap size={14} color="#118df0" /> PLANTILLAS</>;
        if (sub === 'docsIA') return <><Zap size={14} color="#118df0" /> DOCUMENTOS</>;
        return 'IA & AUTOMATIZACIÓN';
    };

    return (
        <div style={{ padding: '0px 0px', display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'Inter', sans-serif" }}>

            <div style={{ padding: '24px 32px 0 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 900, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {renderHeaderTitle()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#118df0', boxShadow: '0 0 6px rgba(17,141,240,0.6)' }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#101d3a', letterSpacing: '0.05em' }}>Motor activo</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
                <main style={{ flex: 1, padding: '0 32px 32px 32px', overflowY: 'auto' }}>
                    {sub === 'panel' && <IADashboard />}
                    {sub === 'dental' && <IADentalConfig />}
                    {sub === 'auto' && <AutomatizacionesView />}
                    {sub === 'flows' && <FlujosCView />}
                    {sub === 'editor' && <EditorView />}
                    {sub === 'tpl' && <PlantillasView />}
                    {sub === 'docsIA' && <DocumentosView />}
                </main>

                {/* Simulador (Solo en pestaña dental) */}
                {sub === 'dental' && (
                    <aside style={{ width: 380, borderLeft: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', position: 'sticky', top: 0 }}>
                        <div style={{ background: '#FF4B68', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Brain size={14} color="#fff" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IA DENTAL — SIMULADOR EN VIVO</div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>✦ {chatLoading ? 'Procesando...' : 'IA Groq Activa'}</div>
                                </div>
                            </div>
                        </div>
                        <div style={{ flex: 1, background: '#f8fafc', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {chatMsgs.map((m, i) => (
                                <div key={i} style={m.role === 'ai'
                                    ? { background: '#fff', border: '1px solid #e2e8f0', padding: 16, borderRadius: '0 16px 16px 16px', maxWidth: '85%' }
                                    : { background: '#118DF0', padding: 16, borderRadius: '16px 0 16px 16px', maxWidth: '85%', alignSelf: 'flex-end' }}>
                                    {m.role === 'ai' && <div style={{ fontSize: 10, fontWeight: 900, color: '#118DF0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>IA DENTAL</div>}
                                    <p style={{ margin: 0, fontSize: 13, color: m.role === 'ai' ? '#334155' : '#fff', fontWeight: 500, lineHeight: 1.5 }}>{m.text}</p>
                                </div>
                            ))}
                            {chatLoading && (
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '0 16px 16px 16px', maxWidth: '85%' }}>
                                    <div style={{ fontSize: 10, fontWeight: 900, color: '#118DF0', marginBottom: 4, textTransform: 'uppercase' }}>IA DENTAL</div>
                                    <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Escribiendo...</p>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                                    style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
                                    placeholder="Simula un mensaje..."
                                    disabled={chatLoading}
                                />
                                <button
                                    onClick={sendChat}
                                    disabled={chatLoading || !chatInput.trim()}
                                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: 8, background: chatInput.trim() ? '#118DF0' : '#e2e8f0', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: chatInput.trim() ? 'pointer' : 'default' }}>
                                    <Send size={12} />
                                </button>
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}

/* ─── PANEL IA ─────────────────────────────────────── */
function IADashboard() {
    const [insights, setInsights] = useState<{ stats: { total: number; active: number; avgSuccess: number }; insights: string[] } | null>(null);

    useEffect(() => {
        iaApi.getInsights().then(setInsights).catch(() => {});
    }, []);

    const topAutos = [
        { name: 'Recordatorio 24h antes', envios: '1248 envíos', pct: '94%' },
        { name: 'Confirmación al crear/modificar cita', envios: '892 envíos', pct: '99%' },
        { name: 'Seguimiento Post-Visita', envios: '892 envíos', pct: '88%' },
        { name: 'Actualización estado según respuesta', envios: '834 envíos', pct: '98%' },
    ];

    const activeCount = insights?.stats.active ?? 27;
    const totalCount = insights?.stats.total ?? 30;
    const avgSuccess = insights?.stats.avgSuccess ?? 94;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200 }}>
            {/* Banner Cerebro Digital */}
            <div style={{
                background: '#1652a8',
                padding: '28px 32px', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 10px 30px rgba(22, 82, 168, 0.15)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
                    }}>
                        <Brain size={28} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '0.05em', marginBottom: 2 }}>CEREBRO DIGITAL - IA DENTAL</div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>Motor de automatización clínica - LLaMA 3.3 70B via Groq - Supabase Edge</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>IA ACTIVA</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#118DF0', boxShadow: '0 0 8px rgba(17,141,240,0.8)' }} />
                </div>
            </div>

            {/* 4 KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <KPICard label="MOTOR IA" value="Groq LLaMA 3.3" sub="Conectado - <500ms" icon={<Cpu size={14} />} />
                <KPICard label="AUTOMATIZACIONES" value={`${activeCount}/${totalCount}`} sub={`${totalCount - activeCount} pausadas`} icon={<Zap size={14} />} valueColor="#118df0" />
                <KPICard label="TASA DE ÉXITO" value={`${avgSuccess}%`} sub="Mejor: Recordatorio 24h antes..." icon={<Activity size={14} />} valueColor="#101d3a" />
                <KPICard label="PRIVACIDAD" value="RGPD ✓" sub="Datos encriptados en tránsito" icon={<ShieldCheck size={14} />} />
            </div>

            {/* Accesos Rápidos */}
            <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>ACCESOS RÁPIDOS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <QuickCard title="IA Dental ✦" sub="Configurar agente y simulador" icon={<Brain size={16} />} bg="#f0f9ff" borderColor="#bae6fd" />
                    <QuickCard title="Automatizaciones" sub="Gestionar reglas activas" icon={<Zap size={16} />} bg="#fefce8" borderColor="#fef08a" />
                    <QuickCard title="Flujos" sub="Secuencias conversacionales" icon={<GitBranch size={16} />} bg="#faf5ff" borderColor="#e9d5ff" />
                    <QuickCard title="Plantillas" sub="WhatsApp, Email, SMS" icon={<MessageSquare size={16} />} bg="#f0fdf4" borderColor="#bbf7d0" />
                    <QuickCard title="Documentos" sub="Consentimientos, cuestionarios" icon={<FileText size={16} />} bg="#fff1f2" borderColor="#fecdd3" />
                </div>
            </div>

            {/* Estado del Motor & Top Auts wrapper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Estado del Motor */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Activity size={14} color="#94a3b8" />
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ESTADO DEL MOTOR</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <StatusItem name="Edge Function groq-proxy" sub="ltfstsjfybpbtiakopor.supabase.co/functions/v1/groq-proxy" />
                        <StatusItem name="Modelo LLaMA 3.3 70B (Groq)" sub="llama-3.3-70b-versatile - max 1000 tokens" />
                        <StatusItem name="Motor de automatizaciones" sub="27 reglas activas procesando eventos" />
                        <StatusItem name="Persistencia chat_history" sub="Supabase - 20 mensajes por sesión" isLast />
                    </div>
                </div>

                {/* Top Automatizaciones */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock size={14} color="#94a3b8" />
                            <span style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOP AUTOMATIZACIONES</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#118DF0', cursor: 'pointer' }}>Ver todas →</span>
                    </div>
                    <div>
                        {topAutos.map((a, i) => (
                            <div key={i} style={{ padding: '16px 20px', borderBottom: i < topAutos.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#118df0', marginRight: 12 }} />
                                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{a.name}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginRight: 24 }}>{a.envios}</div>
                                <div style={{ fontSize: 13, fontWeight: 900, color: '#118df0' }}>{a.pct}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── IA DENTAL CONFIG ─────────────────────────────── */
function IADentalConfig() {
    const DEFAULT_KNOWLEDGE = [
        'Servicios: Implantes, Ortodoncia, Endodoncia, Cirugía, Higiene, Blanqueamiento, Prótesis',
        'Horario: Lunes a Viernes 8:30-20:00, Sábados 9:00-14:00',
        'Dirección: Rubio García Dental, Madrid',
        'Teléfono urgencias fuera de horario: consultar web',
        'Formas de pago: Efectivo, Tarjeta, Bizum, Financiación hasta 24 meses',
        'Primera visita gratuita para nuevos pacientes',
    ];
    const DEFAULT_ESCALADOS = [
        { cond: 'SI: dolor severo / sangrado', action: 'Escalar a recepción inmediatamente' },
        { cond: 'SI: solicitud de presupuesto detallado', action: 'Derivar a secretaria para cita de diagnóstico' },
        { cond: 'SI: queja o insatisfacción', action: 'Disculparse, escalar a dirección' },
        { cond: 'SI: pregunta médica específica', action: 'Responder con cautela, sugerir consulta presencial' },
    ];

    const [config, setConfig] = useState<AIConfigData | null>(null);
    const [knowledge, setKnowledge] = useState<string[]>(DEFAULT_KNOWLEDGE);
    const [newKnowledge, setNewKnowledge] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        iaApi.getConfig().then(data => {
            if (data) {
                setConfig(data);
                if (data.knowledge?.length) setKnowledge(data.knowledge);
            }
        }).catch(() => {});
    }, []);

    const escalados = (config?.escalationRules as { condition: string; action: string }[] | undefined)
        ?.map(r => ({ cond: r.condition, action: r.action })) ?? DEFAULT_ESCALADOS;

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: Omit<AIConfigData, 'id'> = {
                agentName: config?.agentName || 'IA Dental',
                language: config?.language || 'es',
                welcomeMsg: config?.welcomeMsg || 'Hola, soy IA Dental de Rubio García Dental. ¿En qué puedo ayudarte?',
                tone: config?.tone || { empathy: 90, proactivity: 75, formality: 'warm' },
                knowledge,
                escalationRules: DEFAULT_ESCALADOS.map(e => ({ condition: e.cond, action: e.action })),
            };
            const saved = await iaApi.saveConfig(payload);
            setConfig(saved);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            alert('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingRight: 16 }}>
            {/* Identidad del agente */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff' }}>
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: '#118df0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Settings size={14} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#101d3a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IDENTIDAD DEL AGENTE</span>
                </div>
                <div style={{ padding: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                            <label style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>NOMBRE DEL AGENTE</label>
                            <div style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#1e293b', background: '#fff' }}>IA Dental</div>
                        </div>
                        <div>
                            <label style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>IDIOMA</label>
                            <div style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#1e293b', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Español neutro</span>
                                <ChevronDown size={14} color="#94a3b8" />
                            </div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>MENSAJE DE BIENVENIDA</label>
                            <textarea style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#64748b', resize: 'none', background: '#f8fafc', outline: 'none' }} defaultValue="Hola, soy IA Dental, el asistente virtual de Smile Pro 2026. ¿En qué puedo ayudarte?" rows={2} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tono y actitud */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff' }}>
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 14 }}>☆</div>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#101d3a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TONO Y ACTITUD</span>
                </div>
                <div style={{ padding: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#053e9c', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}>Cálida y empática</div>
                        <div style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}>Profesional y formal</div>
                        <div style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}>Cercana y amigable</div>
                        <div style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}>Eficiente y directa</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <MetricBar label="EMPATÍA" value={90} />
                        <MetricBar label="PROACTIVIDAD" value={75} />
                        <MetricBar label="FORMALIDAD" value={45} />
                    </div>
                </div>
            </div>

            {/* Base de Conocimiento */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff' }}>
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 14 }}>📖</div>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#101d3a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BASE DE CONOCIMIENTO</span>
                </div>
                <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                        {knowledge.map((k, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#118df0' }} />
                                <span style={{ flex: 1, fontSize: 12, color: '#475569', fontWeight: 500 }}>{k}</span>
                                <Trash2 size={12} color="#cbd5e1" style={{ cursor: 'pointer' }} onClick={() => setKnowledge(prev => prev.filter((_, j) => j !== i))} />
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            value={newKnowledge}
                            onChange={e => setNewKnowledge(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && newKnowledge.trim()) { setKnowledge(prev => [...prev, newKnowledge.trim()]); setNewKnowledge(''); } }}
                            style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, outline: 'none' }}
                            placeholder="Añadir conocimiento..."
                        />
                        <button
                            onClick={() => { if (newKnowledge.trim()) { setKnowledge(prev => [...prev, newKnowledge.trim()]); setNewKnowledge(''); } }}
                            style={{ width: 38, height: 38, background: '#053e9c', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Reglas de escalado */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff' }}>
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ color: '#FF4B68' }}><ShieldCheck size={16} /></div>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#101d3a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REGLAS DE ESCALADO</span>
                </div>
                <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {escalados.map((e, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                                <span style={{ background: '#fff1f2', color: '#e03555', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 12 }}>{e.cond}</span>
                                <ArrowRight size={12} color="#cbd5e1" />
                                <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{e.action}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    background: saved ? '#16a34a' : '#053e9c', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 24px', fontSize: 12, fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', alignSelf: 'flex-start', opacity: saving ? 0.7 : 1
                }}>
                <Save size={14} /> {saving ? 'GUARDANDO...' : saved ? 'GUARDADO!' : 'GUARDAR CONFIGURACIÓN DE IA DENTAL'}
            </button>
        </div>
    );
}

/* ─── AUTOMATIZACIONES ─────────────────────────────── */
const AUTO_GROUPS = [
    {
        emoji: '🔔', name: 'Recordatorios', count: '5/6', color: '#fef3c7', textColor: '#92400e',
        items: [
            { name: 'Recordatorio 24h antes', detail: '24 horas · WhatsApp', pct: '94%', on: true },
            { name: 'Recordatorio 2h (no confirmados)', detail: '24 horas · SMS', pct: '81%', on: true },
            { name: 'Confirmación al crear/modificar cita', detail: '24 horas · WhatsApp', pct: '99%', on: true },
            { name: 'Revisión Ortodoncia — 2 meses', detail: '24 horas · WhatsApp', pct: '86%', on: true },
            { name: 'Revisión Ortodoncia — 6 meses', detail: '24 horas · WhatsApp', pct: '83%', on: true },
            { name: 'Recordatorio pediátrico al tutor', detail: '24 horas · WhatsApp', pct: '89%', on: false },
        ],
    },
    {
        emoji: '💙', name: 'Seguimiento Clínico', count: '6/6', color: '#eff6ff', textColor: '#1e40af',
        items: [
            { name: 'Seguimiento Post-Visita', detail: '24 horas · WhatsApp', pct: '88%', on: true },
            { name: 'Protocolo Post-Quirúrgico', detail: '24 horas · Multi', pct: '97%', on: true },
            { name: 'Seguimiento implante 2-3 meses', detail: '24 horas · WhatsApp', pct: '94%', on: true },
            { name: 'Recomendaciones post-tratamiento', detail: '24 horas · WhatsApp', pct: '92%', on: true },
        ],
    },
    {
        emoji: '📄', name: 'Documentos y Legal', count: '3/4', color: '#f5f3ff', textColor: '#5b21b6',
        items: [
            { name: 'Consentimiento tras confirmar cita', detail: '24 horas · Email', pct: '91%', on: true },
            { name: 'Notificación consentimiento firmado', detail: '24 horas · Interno', pct: '100%', on: true },
            { name: 'Cuestionario Primera Visita', detail: '24 horas · WhatsApp', pct: '87%', on: true },
            { name: 'Envío mensual a gestoría', detail: '24 horas · Email', pct: '100%', on: false },
        ],
    },
    {
        emoji: '👤', name: 'Primera Visita', count: '4/4', color: '#f0fdf4', textColor: '#166534',
        items: [
            { name: 'Confirmación reserva Primera Visita', detail: 'Inmediato · WhatsApp', pct: '—', on: true },
            { name: 'Envío formularios 24h antes PV', detail: '24 horas · WhatsApp', pct: '—', on: true },
            { name: 'Confirmación formularios completados', detail: 'Tras envío · Multi', pct: '—', on: true },
            { name: 'Redirección al tutor (menor)', detail: 'Si menor · WhatsApp', pct: '—', on: true },
        ],
    },
    {
        emoji: '💳', name: 'Cobros y Facturación', count: '2/3', color: '#fdf4ff', textColor: '#6b21a8',
        items: [
            { name: 'Factura tras pago realizado', detail: 'Tras pago · Email', pct: '100%', on: true },
            { name: 'Recibo WhatsApp pago efectivo', detail: 'Tras pago · WhatsApp', pct: '100%', on: true },
            { name: 'Recordatorio deuda pendiente', detail: '7 días · Email', pct: '58%', on: false },
        ],
    },
    {
        emoji: '📅', name: 'Gestión de Agenda', count: '2/2', color: '#f0f9ff', textColor: '#075985',
        items: [
            { name: 'Gestión No Presentado', detail: '15 min después · WhatsApp', pct: '54%', on: true },
            { name: 'Actualización estado según respuesta', detail: 'En tiempo real · Interno', pct: '98%', on: true },
        ],
    },
    {
        emoji: '🚨', name: 'Urgencias', count: '1/1', color: '#fef2f2', textColor: '#991b1b',
        items: [
            { name: 'Respuesta Automática Urgencias', detail: 'Fuera de horario · WhatsApp', pct: '100%', on: true },
        ],
    },
];

function AutomatizacionesView() {
    const [open, setOpen] = useState<string[]>(['Recordatorios', 'Seguimiento Clínico', 'Documentos y Legal']);
    const [dbAutomations, setDbAutomations] = useState<AutomationData[]>([]);
    const [localEnabled, setLocalEnabled] = useState<Record<string, boolean>>({});

    useEffect(() => {
        iaApi.getAutomations().then(setDbAutomations).catch(() => {});
    }, []);

    // Build lookup by normalized name
    const dbByName = new Map(dbAutomations.map(a => [a.name.toLowerCase().trim(), a]));

    const getEnabled = (name: string, defaultOn: boolean): boolean => {
        if (name in localEnabled) return localEnabled[name];
        const db = dbByName.get(name.toLowerCase().trim());
        return db ? db.enabled : defaultOn;
    };

    const handleToggle = async (name: string, currentEnabled: boolean) => {
        const newVal = !currentEnabled;
        setLocalEnabled(prev => ({ ...prev, [name]: newVal }));
        const db = dbByName.get(name.toLowerCase().trim());
        if (db) {
            try {
                await iaApi.toggleAutomation(db.id, newVal);
            } catch {
                setLocalEnabled(prev => ({ ...prev, [name]: currentEnabled }));
            }
        }
    };

    const toggle = (name: string) =>
        setOpen(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 900 }}>
            {AUTO_GROUPS.map(g => {
                const isOpen = open.includes(g.name);
                const enabledCount = g.items.filter(item => getEnabled(item.name, item.on)).length;
                return (
                    <div key={g.name} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
                        <button
                            onClick={() => toggle(g.name)}
                            style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', borderBottom: isOpen ? '1px solid #f1f5f9' : 'none' }}>
                            <span style={{ fontSize: 16 }}>{g.emoji}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#101d3a', flex: 1, textAlign: 'left' }}>{g.name}</span>
                            <span style={{ background: g.color, color: g.textColor, fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 20 }}>{enabledCount}/{g.items.length}</span>
                            {isOpen ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                        </button>
                        {isOpen && g.items.map((item, i) => {
                            const on = getEnabled(item.name, item.on);
                            return (
                                <div key={i} style={{ padding: '14px 20px', borderBottom: i < g.items.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'center', gap: 12, opacity: on ? 1 : 0.45 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{item.name}</div>
                                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{item.detail}</div>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#118DF0', marginRight: 12 }}>{item.pct} éxito</span>
                                    {/* Toggle */}
                                    <div
                                        onClick={() => handleToggle(item.name, on)}
                                        style={{ width: 36, height: 20, borderRadius: 10, background: on ? '#118DF0' : '#e2e8f0', display: 'flex', alignItems: 'center', padding: '0 3px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', transform: on ? 'translateX(16px)' : 'translateX(0)', transition: 'all 0.2s' }} />
                                    </div>
                                    <ChevronDown size={14} color="#cbd5e1" />
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function FlujosCView() {
    const FLUJOS = [
        {
            title: 'Flujo: Confirmación de Cita', trigger: '▶ Cita programada en agenda', color: '#053e9c',
            steps: ['Recordatorio 24h — WhatsApp con datos de cita', 'SÍ → Estado confirmada', 'Consentimiento digital — Email', 'Guardado en ficha, doctor notificado']
        },
        {
            title: 'Flujo: Cancelación', trigger: '▶ Paciente responde NO o CANCELAR', color: '#e03555',
            steps: ['NO / CANCELAR recibido — Estado cancelado', 'Mensaje de reagendado', '3 huecos disponibles — Propuesta']
        },
        {
            title: 'Flujo: No Presentado', trigger: '▶ Sin check-in 15 min post-cita', color: '#f59e0b',
            steps: ['Detección de ausencia automática', 'WhatsApp: ¿Pudiste venir? Reagendamos sin problema', 'Sin respuesta en 24h: Estado No Presentado']
        },
        {
            title: 'Flujo: Quirúrgico Implante', trigger: '▶ Implante completado en odontograma', color: '#8b5cf6',
            steps: ['Día 0: Instrucciones post-op (WhatsApp)', 'Día 2: ¿Cómo estás? (WhatsApp)', 'Día 7: Recordatorio cita de revisión', 'Mes 3: Seguimiento implante oseointegración']
        },
        {
            title: 'Flujo: Cobro Realizado', trigger: '▶ Pago registrado en sistema', color: '#22c55e',
            steps: ['Factura PDF por Email (Verifactu)', 'Recibo WhatsApp (pago efectivo)', 'Exportación automática a gestoría', 'Registro en cuenta corriente paciente']
        },
        {
            title: 'Flujo: Primera Visita', trigger: '▶ Nueva cita tipo Primera Visita', color: '#0ea5e9',
            steps: ['Confirmación inmediata + datos clínica', 'Cuestionario anamnesis (24h antes)', 'Recordatorio 2h antes', 'Post-visita: valoración + próximos pasos']
        },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {FLUJOS.map((f, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ height: 4, background: f.color }} />
                    <div style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{f.title}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 16 }}>{f.trigger}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {f.steps.map((s, j) => (
                                <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <div style={{ marginTop: 2, width: 12, height: 12, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EditorView() {
    const [name, setName] = useState('');
    const [trigger, setTrigger] = useState('');
    const [canal, setCanal] = useState('whatsapp');
    const [steps, setSteps] = useState([{ delay: '0', action: 'Enviar mensaje', msg: '' }]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const addStep = () => setSteps(prev => [...prev, { delay: '24h', action: 'Enviar mensaje', msg: '' }]);

    const handleSave = async () => {
        if (!name.trim() || !trigger) return;
        setSaving(true);
        try {
            await iaApi.createAutomation({
                name: name.trim(),
                trigger,
                canal,
                steps: steps.map(s => ({ delay: parseInt(s.delay) || 0, action: s.action, template: s.msg || undefined })),
                enabled: true,
            });
            setName('');
            setTrigger('');
            setCanal('whatsapp');
            setSteps([{ delay: '0', action: 'Enviar mensaje', msg: '' }]);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            alert('Error al guardar la automatización');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 860 }}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: '#118DF0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={14} color="#fff" /></div>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#101d3a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NUEVA AUTOMATIZACIÓN</span>
                </div>
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <IAFormField label="NOMBRE DE LA AUTOMATIZACIÓN" placeholder="Ej: Recordatorio 24h Ortodoncia">
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Recordatorio 24h Ortodoncia" style={inputStyle} />
                        </IAFormField>
                        <IAFormField label="CANAL DE ENVÍO">
                            <select value={canal} onChange={e => setCanal(e.target.value)} style={inputStyle}>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="multi">Multi-canal</option>
                            </select>
                        </IAFormField>
                    </div>
                    <IAFormField label="DISPARADOR (TRIGGER)">
                        <select value={trigger} onChange={e => setTrigger(e.target.value)} style={inputStyle}>
                            <option value="">Seleccionar evento...</option>
                            <option>Cita programada en agenda</option>
                            <option>Cita confirmada por paciente</option>
                            <option>Cita cancelada</option>
                            <option>Tratamiento completado</option>
                            <option>Primera visita creada</option>
                            <option>Documento firmado</option>
                            <option>Pago registrado</option>
                        </select>
                    </IAFormField>

                    <div>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 12 }}>PASOS DE LA AUTOMATIZACIÓN</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {steps.map((step, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#118DF0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 10, flex: 1 }}>
                                        <input value={step.delay} onChange={e => setSteps(prev => prev.map((s, j) => j === i ? { ...s, delay: e.target.value } : s))} placeholder="Retraso" style={{ ...inputStyle, fontSize: 12 }} />
                                        <select value={step.action} onChange={e => setSteps(prev => prev.map((s, j) => j === i ? { ...s, action: e.target.value } : s))} style={{ ...inputStyle, fontSize: 12 }}>
                                            <option>Enviar mensaje</option>
                                            <option>Enviar documento</option>
                                            <option>Cambiar estado</option>
                                            <option>Notificar interno</option>
                                        </select>
                                        <input value={step.msg} onChange={e => setSteps(prev => prev.map((s, j) => j === i ? { ...s, msg: e.target.value } : s))} placeholder="Contenido o plantilla..." style={{ ...inputStyle, fontSize: 12 }} />
                                    </div>
                                    {i > 0 && <button onClick={() => setSteps(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Trash2 size={14} /></button>}
                                </div>
                            ))}
                        </div>
                        <button onClick={addStep} style={{ marginTop: 10, padding: '8px 16px', borderRadius: 8, border: '1px dashed #e2e8f0', background: 'transparent', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: '#118DF0', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Plus size={12} /> AÑADIR PASO
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                        <button
                            onClick={() => { setName(''); setTrigger(''); setCanal('whatsapp'); setSteps([{ delay: '0', action: 'Enviar mensaje', msg: '' }]); }}
                            style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', color: '#64748b' }}>CANCELAR</button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !name.trim() || !trigger}
                            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: saved ? '#16a34a' : '#053e9c', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: (saving || !name.trim() || !trigger) ? 0.6 : 1 }}>
                            <Save size={14} /> {saving ? 'GUARDANDO...' : saved ? 'GUARDADA!' : 'GUARDAR AUTOMATIZACIÓN'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const TPL_CATEGORIES = [
    { emoji: '🔔', label: 'Recordatorios', count: 8 },
    { emoji: '💙', label: 'Seguimiento', count: 6 },
    { emoji: '🔄', label: 'Recaptación', count: 4 },
    { emoji: '📋', label: 'Gestión', count: 5 },
    { emoji: '💳', label: 'Pagos', count: 3 },
    { emoji: '📄', label: 'Docs Legales', count: 7 },
    { emoji: '🏥', label: 'Gestión Interna', count: 4 },
    { emoji: '✍️', label: 'Consentimientos', count: 9 },
    { emoji: '📝', label: 'Instrucciones', count: 6 },
    { emoji: '❓', label: 'Cuestionarios', count: 5 },
];

const SAMPLE_TEMPLATES = [
    { cat: 'Recordatorios', name: 'Recordatorio 24h cita', canal: 'WhatsApp', vars: ['{{nombre}}', '{{fecha}}', '{{hora}}'], preview: 'Hola {{nombre}}, te recordamos tu cita mañana {{fecha}} a las {{hora}}. ¿Confirmas? Responde SÍ/NO 👇' },
    { cat: 'Recordatorios', name: 'Recordatorio 2h cita', canal: 'WhatsApp', vars: ['{{nombre}}', '{{hora}}'], preview: '⏰ {{nombre}}, tu cita es HOY a las {{hora}}. ¡Te esperamos!' },
    { cat: 'Seguimiento', name: 'Post-visita general', canal: 'WhatsApp', vars: ['{{nombre}}', '{{doctor}}'], preview: 'Hola {{nombre}} 😊 Esperamos que te haya ido bien con {{doctor}}. ¿Cómo te encuentras?' },
    { cat: 'Consentimientos', name: 'Consentimiento implante', canal: 'Email', vars: ['{{nombre}}', '{{link}}'], preview: 'Estimado/a {{nombre}}, adjuntamos el consentimiento informado para el tratamiento de implantología. Por favor, firme digitalmente: {{link}}' },
];

function PlantillasView() {
    const [selectedCat, setSelectedCat] = useState('Recordatorios');
    const [search, setSearch] = useState('');
    const [preview, setPreview] = useState<any>(null);

    const filtered = SAMPLE_TEMPLATES.filter(t => t.cat === selectedCat && (t.name.toLowerCase().includes(search.toLowerCase()) || !search));

    return (
        <div style={{ display: 'flex', gap: 20, maxWidth: 1100 }}>
            {/* Category sidebar */}
            <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {TPL_CATEGORIES.map(cat => (
                    <button key={cat.label} onClick={() => setSelectedCat(cat.label)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', background: selectedCat === cat.label ? '#053e9c' : '#fff', color: selectedCat === cat.label ? '#fff' : '#1e293b', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                        <span>{cat.emoji}</span>
                        <span style={{ flex: 1 }}>{cat.label}</span>
                        <span style={{ fontSize: 10, opacity: 0.7 }}>{cat.count}</span>
                    </button>
                ))}
            </div>

            {/* Main list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
                        <Search size={14} color="#94a3b8" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar plantilla..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1 }} />
                    </div>
                    <button style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#053e9c', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={12} /> NUEVA
                    </button>
                </div>
                {filtered.length === 0 && (
                    <div style={{ padding: '60px 40px', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                        <FileCode size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Sin plantillas en esta categoría</p>
                    </div>
                )}
                {filtered.map((tpl, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{tpl.name}</span>
                                <span style={{ padding: '2px 8px', borderRadius: 4, background: tpl.canal === 'WhatsApp' ? '#dcfce7' : '#eff6ff', color: tpl.canal === 'WhatsApp' ? '#16a34a' : '#2563eb', fontSize: 10, fontWeight: 900 }}>{tpl.canal}</span>
                            </div>
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{tpl.preview}</p>
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                {tpl.vars.map(v => <span key={v} style={{ padding: '2px 8px', borderRadius: 4, background: '#f0f9ff', color: '#0369a1', fontSize: 10, fontWeight: 700 }}>{v}</span>)}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button onClick={() => setPreview(tpl)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: '#051650' }}>PREVIEW</button>
                            <button style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#f1f5f9', fontSize: 11, fontWeight: 800, cursor: 'pointer', color: '#051650', display: 'flex', alignItems: 'center', gap: 4 }}><Copy size={11} /> USAR</button>
                            <button style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><Edit2 size={12} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview modal */}
            {preview && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPreview(null)}>
                    <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 480, width: '90%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 900, color: '#051650', margin: 0 }}>{preview.name}</h3>
                            <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={16} /></button>
                        </div>
                        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, fontSize: 13, color: '#1e293b', lineHeight: 1.6, marginBottom: 16 }}>{preview.preview}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 8 }}>VARIABLES</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {preview.vars.map((v: string) => <span key={v} style={{ padding: '4px 10px', borderRadius: 6, background: '#f0f9ff', color: '#0369a1', fontSize: 11, fontWeight: 700 }}>{v}</span>)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const DOCS_LIST = [
    { name: 'Consentimiento Informado — Implantología', category: 'Consentimientos', status: 'ACTIVO', signed: 42, pending: 3 },
    { name: 'Consentimiento Informado — Ortodoncia', category: 'Consentimientos', status: 'ACTIVO', signed: 28, pending: 1 },
    { name: 'Consentimiento Blanqueamiento', category: 'Consentimientos', status: 'ACTIVO', signed: 15, pending: 0 },
    { name: 'Cuestionario de Salud — Primera Visita', category: 'Cuestionarios', status: 'ACTIVO', signed: 67, pending: 8 },
    { name: 'Cuestionario Anamnesis Periodontal', category: 'Cuestionarios', status: 'ACTIVO', signed: 14, pending: 2 },
    { name: 'Instrucciones Post-Cirugía', category: 'Instrucciones', status: 'ACTIVO', signed: 0, pending: 0 },
    { name: 'Instrucciones Post-Implante', category: 'Instrucciones', status: 'ACTIVO', signed: 0, pending: 0 },
];

function DocumentosView() {
    const [search, setSearch] = useState('');
    const filtered = DOCS_LIST.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || !search);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 960 }}>
            <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
                    <Search size={14} color="#94a3b8" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar documento..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1 }} />
                </div>
                <button style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#053e9c', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={12} /> NUEVO DOCUMENTO
                </button>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            {['DOCUMENTO', 'CATEGORÍA', 'ESTADO', 'FIRMADOS', 'PENDIENTES', ''].map(h => (
                                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((doc, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#1e293b' }}>{doc.name}</td>
                                <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: 600 }}>{doc.category}</td>
                                <td style={{ padding: '14px 16px' }}>
                                    <span style={{ padding: '3px 8px', borderRadius: 4, background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 900 }}>{doc.status}</span>
                                </td>
                                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#22c55e' }}>{doc.signed}</td>
                                <td style={{ padding: '14px 16px', fontWeight: 800, color: doc.pending > 0 ? '#f59e0b' : '#94a3b8' }}>{doc.pending || '—'}</td>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 10, fontWeight: 800, cursor: 'pointer', color: '#051650' }}>EDITAR</button>
                                        <button style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#94a3b8' }}><Copy size={11} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit', color: '#1e293b', boxSizing: 'border-box' };

function IAFormField({ label, children }: { label: string; children: React.ReactNode; placeholder?: string }) {
    return (
        <div>
            <label style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>{label}</label>
            {children}
        </div>
    );
}

/* ─── HELPERS ────────────────────────────────────────── */
function KPICard({ label, value, sub, icon, valueColor }: any) {
    return (
        <div style={{ border: '1px solid #e2e8f0', padding: 20, borderRadius: 16, flex: 1, background: '#fff' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ color: '#94a3b8' }}>{icon}</div>
                {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: valueColor || '#1e293b', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{sub}</div>
        </div>
    );
}

function QuickCard({ title, sub, icon, bg, borderColor }: any) {
    return (
        <div style={{
            padding: 16, borderRadius: 12, border: `1px solid ${borderColor}`, background: bg,
            display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ color: '#101d3a' }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#101d3a' }}>{title}</div>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500, lineHeight: 1.4 }}>{sub}</div>
        </div>
    );
}

function StatusItem({ name, sub, isLast }: any) {
    return (
        <div style={{ padding: '12px 20px', borderBottom: isLast ? 'none' : '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '2px solid #118DF0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#118DF0' }} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{name}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>{sub}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800, color: '#101d3a', border: '1px solid #e2e8f0' }}>OK</div>
        </div>
    );
}

function MetricBar({ label, value }: any) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#101d3a' }}>{value}%</span>
            </div>
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${value}%`, background: '#053e9c', borderRadius: 6 }} />
            </div>
        </div>
    );
}
