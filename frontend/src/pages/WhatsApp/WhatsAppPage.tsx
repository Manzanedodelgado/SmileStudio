import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
    Search, PlusCircle, Send, Paperclip, Smile, Zap,
    User, Phone, Tag, CheckCircle2, Trash2, Info, Brain,
    X, ChevronRight, Calendar, Clock, MessageSquare,
    Check, CheckCheck, MoreVertical, ArrowLeft, Filter,
    Volume2, VolumeX, Star, Archive, Copy, RotateCcw
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   WHATSAPP CRM — SmileStudio
   3 paneles: lista de chats | ventana de chat | info del paciente
   ═══════════════════════════════════════════════════════════════════ */

type MsgStatus = 'sending' | 'sent' | 'delivered' | 'read';

type Msg = {
    id: string;
    text: string;
    time: string;
    mine: boolean;
    ia?: boolean;
    status?: MsgStatus;
    date?: string;          // Para separadores de fecha
};

type Conversation = {
    id: string;
    name: string;
    phone: string;
    avatar: string;
    color: string;
    status: 'ABIERTO' | 'PENDIENTE' | 'RESUELTO';
    unread: number;
    lastMsg: string;
    lastTime: string;
    iaEnabled: boolean;
    muted: boolean;
    starred: boolean;
    tags: string[];
    messages: Msg[];
    patient?: {
        nextAppointment?: string;
        lastVisit?: string;
        treatment?: string;
        doctor?: string;
    };
};

const INITIAL_CONVERSATIONS: Conversation[] = [
    {
        id: '1',
        name: 'María García López',
        phone: '+34 612 345 678',
        avatar: 'MG',
        color: '#118DF0',
        status: 'ABIERTO',
        unread: 2,
        lastMsg: '¿Tenéis hueco esta semana para una revisión?',
        lastTime: '12:37',
        iaEnabled: true,
        muted: false,
        starred: true,
        tags: ['Ortodoncia', 'Prioritario'],
        patient: {
            nextAppointment: 'Martes 18/03 a las 10:30',
            lastVisit: '05/03/2026 - Revisión Ortodoncia',
            treatment: 'Ortodoncia brackets metálicos',
            doctor: 'Dr. Rubio García',
        },
        messages: [
            { id: '1-1', text: 'Hola, buenos días. Quería consultar si tenéis disponibilidad para una revisión esta semana.', time: '09:14', mine: false, date: 'Hoy' },
            { id: '1-2', text: '¡Buenos días, María! Claro que sí. Tenemos hueco el martes a las 10:30 o el jueves a las 16:00. ¿Cuál te viene mejor?', time: '09:16', mine: true, ia: true, status: 'read' },
            { id: '1-3', text: 'El martes perfecto, muchas gracias!', time: '09:18', mine: false },
            { id: '1-4', text: 'Perfecto! Ya te he agendado para el martes 18/03 a las 10:30. Te mandaré una confirmación. Hasta entonces, si necesitas algo más no dudes en escribirnos 😊', time: '09:19', mine: true, ia: true, status: 'read' },
            { id: '1-5', text: '¿Tenéis hueco esta semana para una revisión?', time: '12:35', mine: false },
            { id: '1-6', text: 'Perdona, me refería a esta semana antes de la cita del martes, para hacerme una limpieza.', time: '12:37', mine: false },
        ],
    },
    {
        id: '2',
        name: 'Carlos Martínez',
        phone: '+34 698 765 432',
        avatar: 'CM',
        color: '#8b5cf6',
        status: 'PENDIENTE',
        unread: 0,
        lastMsg: 'Perfecto, hasta el lunes entonces',
        lastTime: 'Ayer',
        iaEnabled: false,
        muted: false,
        starred: false,
        tags: ['Implantes'],
        patient: {
            nextAppointment: 'Lunes 17/03 a las 11:00',
            lastVisit: '20/02/2026 - Colocación implante',
            treatment: 'Implantología - Fase 1',
            doctor: 'Dr. Rubio García',
        },
        messages: [
            { id: '2-1', text: 'Buenos días, llamo para preguntar por mi implante. Han pasado 4 días y noto un poco de molestia.', time: '10:22', mine: false, date: 'Ayer' },
            { id: '2-2', text: 'Buenos días, Carlos. Es normal sentir algo de molestia los primeros días tras la colocación. ¿Tienes fiebre o la zona está muy inflamada?', time: '10:25', mine: true, status: 'read' },
            { id: '2-3', text: 'No, no hay fiebre. Solo un pequeño dolor al masticar por ese lado.', time: '10:28', mine: false },
            { id: '2-4', text: 'Tranquilo, es normal. Toma el ibuprofeno que te recetamos si lo necesitas y evita masticar por ese lado esta semana. Si el dolor aumenta mucho o aparece fiebre, llámanos al momento. Te vemos el lunes para la revisión.', time: '10:30', mine: true, status: 'read' },
            { id: '2-5', text: 'Perfecto, hasta el lunes entonces', time: '10:31', mine: false },
        ],
    },
    {
        id: '3',
        name: 'Ana Fernández Rojo',
        phone: '+34 655 111 222',
        avatar: 'AF',
        color: '#22c55e',
        status: 'ABIERTO',
        unread: 1,
        lastMsg: '¿Podéis enviarme el presupuesto por aquí?',
        lastTime: '11:05',
        iaEnabled: true,
        muted: false,
        starred: false,
        tags: ['Primera Visita'],
        patient: {
            nextAppointment: 'Viernes 21/03 a las 17:00',
            lastVisit: '—',
            treatment: 'Primera visita (pendiente)',
            doctor: 'Dra. García',
        },
        messages: [
            { id: '3-1', text: 'Hola! Vi vuestra clínica en Instagram y me gustaría pedir cita para valoración de ortodoncia.', time: '10:58', mine: false, date: 'Hoy' },
            { id: '3-2', text: '¡Hola, Ana! Qué bien que nos hayas encontrado 😊 Por supuesto, podemos darte cita para una valoración gratuita de ortodoncia. Tenemos disponibilidad el viernes 21 a las 17:00 o el lunes 24 a las 09:30. ¿Cuál te va mejor?', time: '11:00', mine: true, ia: true, status: 'delivered' },
            { id: '3-3', text: 'El viernes perfecto!', time: '11:02', mine: false },
            { id: '3-4', text: '¿Podéis enviarme el presupuesto por aquí?', time: '11:05', mine: false },
        ],
    },
    {
        id: '4',
        name: 'Roberto Sánchez',
        phone: '+34 677 888 999',
        avatar: 'RS',
        color: '#f59e0b',
        status: 'RESUELTO',
        unread: 0,
        lastMsg: 'Muchas gracias por todo!',
        lastTime: 'Lun',
        iaEnabled: false,
        muted: true,
        starred: false,
        tags: ['Blanqueamiento'],
        patient: {
            nextAppointment: '—',
            lastVisit: '10/03/2026 - Blanqueamiento completado',
            treatment: 'Blanqueamiento dental profesional',
            doctor: 'Dra. García',
        },
        messages: [
            { id: '4-1', text: 'Me ha quedado genial el blanqueamiento, estoy muy contento.', time: '16:42', mine: false, date: 'Lunes' },
            { id: '4-2', text: '¡Nos alegra mucho, Roberto! 😊 Recuerda evitar alimentos con colorantes las primeras 48h. Cualquier consulta, aquí estamos.', time: '16:45', mine: true, status: 'read' },
            { id: '4-3', text: 'Muchas gracias por todo!', time: '16:46', mine: false },
        ],
    },
    {
        id: '5',
        name: 'Lucía Moreno',
        phone: '+34 633 444 555',
        avatar: 'LM',
        color: '#e03555',
        status: 'PENDIENTE',
        unread: 3,
        lastMsg: 'Urgente!! Me duele muchísimo',
        lastTime: '13:02',
        iaEnabled: true,
        muted: false,
        starred: true,
        tags: ['Urgencia'],
        patient: {
            nextAppointment: 'Hoy 15:00 - URGENCIA',
            lastVisit: '15/01/2026 - Endodoncia',
            treatment: 'Endodoncia molar inf. der.',
            doctor: 'Dr. Rubio García',
        },
        messages: [
            { id: '5-1', text: 'Hola necesito cita urgente me duele una muela', time: '12:58', mine: false, date: 'Hoy' },
            { id: '5-2', text: 'Hola, Lucía. Sentimos mucho que estés con dolor. ¿Cuánto llevas con el dolor y en qué zona? ¿Has tomado algún analgésico?', time: '12:59', mine: true, ia: true, status: 'delivered' },
            { id: '5-3', text: 'Desde anoche, la parte derecha abajo. Tomé nolotil pero no me hace efecto', time: '13:01', mine: false },
            { id: '5-4', text: 'Urgente!! Me duele muchísimo', time: '13:02', mine: false },
            { id: '5-5', text: 'Dame un momento que te busco hueco de urgencias', time: '13:02', mine: false },
        ],
    },
];

const QUICK_TEMPLATES = [
    { label: 'Confirmación cita', text: '¡Hola! Te confirmamos tu cita para el {fecha} a las {hora}. ¿Cualquier duda, escríbenos!' },
    { label: 'Recordatorio 24h', text: '¡Hola {nombre}! Te recordamos tu cita mañana a las {hora}. ¿Confirmas asistencia? Responde SÍ/NO 👇' },
    { label: 'Post-visita', text: '¡Hola {nombre}! Esperamos que la visita de hoy haya ido bien. ¿Cómo te encuentras? Cualquier duda, estamos aquí 😊' },
    { label: 'Instrucciones post-op', text: 'Recuerda las indicaciones post-operatorias: no comer en las próximas 2h, evitar masticar por el lado tratado y tomar la medicación según pauta. Ante cualquier problema llámanos.' },
    { label: 'Primera visita gratuita', text: '¡Hola! Te informamos que nuestra primera visita de valoración es completamente gratuita y sin compromiso. ¿Te gustaría reservar?' },
    { label: 'Presupuesto personalizado', text: 'Para enviarte un presupuesto personalizado necesitamos que vengas a una primera visita de valoración (gratuita). ¿Te ayudamos a reservar?' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    ABIERTO:   { bg: '#dcfce7', text: '#16a34a' },
    PENDIENTE: { bg: '#fef9c3', text: '#854d0e' },
    RESUELTO:  { bg: '#f1f5f9', text: '#64748b' },
    URGENCIA:  { bg: '#fee2e2', text: '#991b1b' },
};

/* ═══ COMPONENTE PRINCIPAL ═══════════════════════════════════════════ */
export default function WhatsAppPage() {
    const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
    const [selectedId, setSelectedId] = useState<string>('1');
    const [inputText, setInputText] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'TODOS' | 'ABIERTO' | 'PENDIENTE' | 'RESUELTO'>('TODOS');
    const [showInfo, setShowInfo] = useState(true);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const selected = conversations.find(c => c.id === selectedId) ?? conversations[0];

    const filtered = conversations.filter(c => {
        const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
        const matchFilter = filter === 'TODOS' || c.status === filter;
        return matchSearch && matchFilter;
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selected?.messages]);

    const sendMessage = (text: string) => {
        const t = text.trim();
        if (!t) return;
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const newMsg: Msg = { id: `${Date.now()}`, text: t, time, mine: true, status: 'sending' };
        setConversations(prev => prev.map(c => c.id === selectedId
            ? { ...c, messages: [...c.messages, newMsg], lastMsg: t, lastTime: time, unread: 0 }
            : c
        ));
        setInputText('');
        // Simular entrega
        setTimeout(() => {
            setConversations(prev => prev.map(c => c.id === selectedId
                ? { ...c, messages: c.messages.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m) }
                : c
            ));
        }, 800);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputText);
        }
    };

    const toggleIA = () => {
        setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, iaEnabled: !c.iaEnabled } : c));
    };

    const changeStatus = (status: Conversation['status']) => {
        setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, status } : c));
    };

    const toggleMute = () => {
        setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, muted: !c.muted } : c));
    };

    const toggleStar = () => {
        setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, starred: !c.starred } : c));
    };

    const markRead = (id: string) => {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
    };

    const totalUnread = conversations.reduce((acc, c) => acc + c.unread, 0);

    return (
        <div style={{ height: 'calc(100vh - 72px)', display: 'flex', background: '#f8fafc', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

            {/* ─── Panel 1: Lista de conversaciones ─── */}
            <aside style={{ width: 340, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                {/* Header lista */}
                <div style={{ padding: '20px 20px 0 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#051650', letterSpacing: '0.02em' }}>CONVERSACIONES</span>
                            {totalUnread > 0 && (
                                <span style={{ fontSize: 10, fontWeight: 900, background: '#e03555', color: '#fff', padding: '2px 7px', borderRadius: 20 }}>{totalUnread}</span>
                            )}
                        </div>
                        <button
                            onClick={() => setShowNewChat(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#118DF0', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <PlusCircle size={20} />
                        </button>
                    </div>

                    {/* Buscador */}
                    <div style={{ position: 'relative', marginBottom: 14 }}>
                        <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid #f1f5f9', background: '#f8fafc', fontSize: 12, fontWeight: 500, outline: 'none', boxSizing: 'border-box', color: '#334155' }}
                            placeholder="Buscar paciente o número..."
                        />
                    </div>

                    {/* Filtros */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8, overflowX: 'auto', paddingBottom: 4 }}>
                        {(['TODOS', 'ABIERTO', 'PENDIENTE', 'RESUELTO'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)} style={{
                                padding: '5px 10px', borderRadius: 16, border: 'none', fontSize: 9, fontWeight: 900,
                                background: filter === f ? '#051650' : '#f1f5f9',
                                color: filter === f ? '#fff' : '#94a3b8',
                                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                            }}>{f}</button>
                        ))}
                    </div>
                </div>

                {/* Lista */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filtered.length === 0 && (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
                            Sin conversaciones
                        </div>
                    )}
                    {filtered.map(conv => (
                        <ChatListItem
                            key={conv.id}
                            conv={conv}
                            active={conv.id === selectedId}
                            onClick={() => { setSelectedId(conv.id); markRead(conv.id); }}
                        />
                    ))}
                </div>
            </aside>

            {/* ─── Panel 2: Ventana de chat ─── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fcfdfe' }}>
                {/* Header chat */}
                <header style={{ height: 64, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: selected.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>
                            {selected.avatar}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 900, color: '#051650' }}>{selected.name}</span>
                                <span style={{
                                    fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 10,
                                    background: STATUS_COLORS[selected.status]?.bg,
                                    color: STATUS_COLORS[selected.status]?.text
                                }}>{selected.status}</span>
                                {selected.starred && <Star size={12} color="#f59e0b" fill="#f59e0b" />}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{selected.phone}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Toggle IA */}
                        <button
                            onClick={toggleIA}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
                                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                background: selected.iaEnabled ? '#118DF0' : '#f1f5f9',
                                color: selected.iaEnabled ? '#fff' : '#64748b',
                            }}>
                            <Brain size={12} />
                            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.05em' }}>IA {selected.iaEnabled ? 'ON' : 'OFF'}</span>
                        </button>

                        {/* Cambiar estado */}
                        <div style={{ display: 'flex', gap: 4 }}>
                            {selected.status !== 'RESUELTO' && (
                                <button onClick={() => changeStatus('RESUELTO')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#051650', fontSize: 10, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <CheckCircle2 size={12} /> RESOLVER
                                </button>
                            )}
                            {selected.status === 'RESUELTO' && (
                                <button onClick={() => changeStatus('ABIERTO')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #118DF0', background: '#fff', color: '#118DF0', fontSize: 10, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <RotateCcw size={12} /> REABRIR
                                </button>
                            )}
                        </div>

                        <HeaderIconBtn onClick={toggleStar} title={selected.starred ? 'Quitar estrella' : 'Marcar favorito'}>
                            <Star size={16} fill={selected.starred ? '#f59e0b' : 'none'} color={selected.starred ? '#f59e0b' : '#94a3b8'} />
                        </HeaderIconBtn>
                        <HeaderIconBtn onClick={toggleMute} title={selected.muted ? 'Activar notificaciones' : 'Silenciar'}>
                            {selected.muted ? <VolumeX size={16} color="#94a3b8" /> : <Volume2 size={16} color="#94a3b8" />}
                        </HeaderIconBtn>
                        <HeaderIconBtn onClick={() => setShowInfo(v => !v)} title="Info del paciente">
                            <Info size={16} color={showInfo ? '#118DF0' : '#94a3b8'} />
                        </HeaderIconBtn>
                    </div>
                </header>

                {/* Área de mensajes */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '24px 32px',
                    display: 'flex', flexDirection: 'column', gap: 6,
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #f1f5f9 1px, transparent 0)',
                    backgroundSize: '24px 24px',
                }}>
                    {selected.messages.map((m, i) => {
                        const prev = selected.messages[i - 1];
                        const showDate = !prev || prev.date !== m.date;
                        return (
                            <div key={m.id}>
                                {showDate && m.date && (
                                    <div style={{ textAlign: 'center', margin: '16px 0 8px' }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', background: '#fff', padding: '4px 14px', borderRadius: 20, border: '1px solid #f1f5f9' }}>{m.date}</span>
                                    </div>
                                )}
                                <MessageBubble msg={m} />
                            </div>
                        );
                    })}
                    {selected.iaEnabled && !selected.messages[selected.messages.length - 1]?.mine && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
                            <Brain size={12} color="#118DF0" />
                            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>IA respondiendo...</span>
                            <div style={{ display: 'flex', gap: 2 }}>
                                <TypingDot delay={0} />
                                <TypingDot delay={200} />
                                <TypingDot delay={400} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Panel de plantillas rápidas */}
                {showTemplates && (
                    <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '16px 24px', maxHeight: 220, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>PLANTILLAS RÁPIDAS</span>
                            <button onClick={() => setShowTemplates(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={14} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {QUICK_TEMPLATES.map((tpl, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setInputText(tpl.text); setShowTemplates(false); inputRef.current?.focus(); }}
                                    style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: '1px solid #f1f5f9', background: '#f8fafc', cursor: 'pointer', fontSize: 12, color: '#334155' }}>
                                    <div style={{ fontSize: 10, fontWeight: 900, color: '#118DF0', marginBottom: 3 }}>{tpl.label}</div>
                                    <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#64748b' }}>{tpl.text}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer de input */}
                <footer style={{ padding: '14px 24px', background: '#fff', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
                    {selected.iaEnabled && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '6px 12px', background: '#eff6ff', borderRadius: 8 }}>
                            <Brain size={12} color="#118DF0" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#1e40af' }}>IA respondiendo automáticamente — los mensajes manuales también se envían</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 10, color: '#94a3b8', paddingBottom: 4 }}>
                            <ActionBtn title="Adjuntar archivo"><Paperclip size={18} /></ActionBtn>
                            <ActionBtn title="Emoji"><Smile size={18} /></ActionBtn>
                            <ActionBtn title="Plantillas rápidas" onClick={() => setShowTemplates(v => !v)} active={showTemplates}>
                                <Zap size={18} color={showTemplates ? '#118DF0' : undefined} />
                            </ActionBtn>
                        </div>
                        <textarea
                            ref={inputRef}
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            style={{
                                flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0',
                                background: '#f8fafc', fontSize: 13, fontWeight: 500, outline: 'none',
                                resize: 'none', fontFamily: 'inherit', color: '#1e293b', lineHeight: 1.5,
                                maxHeight: 100, overflowY: 'auto',
                            }}
                            placeholder={`Escribe a ${selected.name.split(' ')[0]}... (Enter para enviar, Shift+Enter nueva línea)`}
                        />
                        <button
                            onClick={() => sendMessage(inputText)}
                            disabled={!inputText.trim()}
                            style={{
                                width: 44, height: 44, borderRadius: 12, border: 'none',
                                background: inputText.trim() ? '#118DF0' : '#e2e8f0',
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: inputText.trim() ? 'pointer' : 'default', transition: 'all 0.15s', flexShrink: 0,
                            }}>
                            <Send size={18} />
                        </button>
                    </div>
                </footer>
            </main>

            {/* ─── Panel 3: Info del paciente ─── */}
            {showInfo && (
                <aside style={{ width: 300, background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
                    {/* Header info */}
                    <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>FICHA DEL PACIENTE</span>
                            <button onClick={() => setShowInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={14} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: selected.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900 }}>
                                {selected.avatar}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 14, fontWeight: 900, color: '#051650' }}>{selected.name}</div>
                                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{selected.phone}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {selected.tags.map(tag => (
                                    <span key={tag} style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 10, background: '#f0f9ff', color: '#0369a1' }}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Acciones rápidas */}
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <InfoActionBtn icon={<User size={13} />} label="Ver ficha" />
                            <InfoActionBtn icon={<Calendar size={13} />} label="Nueva cita" />
                            <InfoActionBtn icon={<Phone size={13} />} label="Llamar" />
                            <InfoActionBtn icon={<Archive size={13} />} label="Archivar" />
                        </div>
                    </div>

                    {/* Detalles clínicos */}
                    {selected.patient && (
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>DATOS CLÍNICOS</div>
                            <InfoRow icon={<Calendar size={13} color="#118DF0" />} label="Próxima cita" value={selected.patient.nextAppointment ?? '—'} accent={selected.patient.nextAppointment?.includes('URGENCIA')} />
                            <InfoRow icon={<Clock size={13} color="#94a3b8" />} label="Última visita" value={selected.patient.lastVisit ?? '—'} />
                            <InfoRow icon={<MessageSquare size={13} color="#94a3b8" />} label="Tratamiento" value={selected.patient.treatment ?? '—'} />
                            <InfoRow icon={<User size={13} color="#94a3b8" />} label="Doctor" value={selected.patient.doctor ?? '—'} />
                        </div>
                    )}

                    {/* Estado conversación */}
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>ESTADO</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(['ABIERTO', 'PENDIENTE', 'RESUELTO'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => changeStatus(s)}
                                    style={{
                                        padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                                        background: selected.status === s ? STATUS_COLORS[s].bg : '#f8fafc',
                                        color: selected.status === s ? STATUS_COLORS[s].text : '#64748b',
                                        fontSize: 11, fontWeight: selected.status === s ? 900 : 600,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    }}>
                                    {s}
                                    {selected.status === s && <Check size={12} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Etiquetas */}
                    <div style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ETIQUETAS</div>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#118DF0' }}><PlusCircle size={14} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {selected.tags.map(tag => (
                                <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>
                                    <Tag size={9} /> {tag}
                                    <X size={9} style={{ cursor: 'pointer', opacity: 0.5 }} />
                                </span>
                            ))}
                        </div>
                    </div>
                </aside>
            )}
        </div>
    );
}

/* ═══ SUB-COMPONENTES ════════════════════════════════════════════════ */

function ChatListItem({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            style={{
                padding: '14px 20px', display: 'flex', gap: 12, cursor: 'pointer',
                background: active ? '#eff6ff' : 'transparent',
                borderLeft: active ? '3px solid #118DF0' : '3px solid transparent',
                transition: 'all 0.12s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
        >
            <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: conv.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff' }}>
                    {conv.avatar}
                </div>
                {conv.iaEnabled && (
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#118DF0', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Brain size={8} color="#fff" />
                    </div>
                )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#051650', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.name}</span>
                        {conv.starred && <Star size={10} color="#f59e0b" fill="#f59e0b" />}
                        {conv.muted && <VolumeX size={10} color="#94a3b8" />}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: conv.unread > 0 ? '#118DF0' : '#94a3b8', flexShrink: 0 }}>{conv.lastTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: conv.unread > 0 ? 700 : 500, color: conv.unread > 0 ? '#334155' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {conv.lastMsg}
                    </span>
                    {conv.unread > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 900, background: '#118DF0', color: '#fff', padding: '2px 6px', borderRadius: 20, marginLeft: 6, flexShrink: 0 }}>{conv.unread}</span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    <span style={{
                        fontSize: 8, fontWeight: 900, padding: '1px 6px', borderRadius: 8,
                        background: STATUS_COLORS[conv.status]?.bg,
                        color: STATUS_COLORS[conv.status]?.text,
                    }}>{conv.status}</span>
                    {conv.tags[0] && <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: '#f1f5f9', color: '#64748b' }}>{conv.tags[0]}</span>}
                </div>
            </div>
        </div>
    );
}

function MessageBubble({ msg }: { msg: Msg }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.mine ? 'flex-end' : 'flex-start' }}>
            {msg.ia && !msg.mine && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                    <Brain size={10} color="#118DF0" />
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#118DF0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>IA Dental</span>
                </div>
            )}
            <div style={{
                maxWidth: '72%', padding: '12px 16px', borderRadius: msg.mine ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                background: msg.mine ? (msg.ia ? '#0f6fd4' : '#118DF0') : '#fff',
                color: msg.mine ? '#fff' : '#051650',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                fontSize: 13, fontWeight: 500, lineHeight: 1.55,
                border: msg.mine ? 'none' : '1px solid #f1f5f9',
            }}>
                {msg.ia && msg.mine && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                        <Brain size={10} color="rgba(255,255,255,0.7)" />
                        <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>IA</span>
                    </div>
                )}
                <span>{msg.text}</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 6, opacity: 0.7 }}>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>{msg.time}</span>
                    {msg.mine && <StatusTick status={msg.status} />}
                </div>
            </div>
        </div>
    );
}

function StatusTick({ status }: { status?: MsgStatus }) {
    if (status === 'sending') return <Clock size={10} color="rgba(255,255,255,0.6)" />;
    if (status === 'sent') return <Check size={10} color="rgba(255,255,255,0.7)" />;
    if (status === 'delivered') return <CheckCheck size={10} color="rgba(255,255,255,0.7)" />;
    if (status === 'read') return <CheckCheck size={10} color="#93c5fd" />;
    return null;
}

function TypingDot({ delay }: { delay: number }) {
    return (
        <div style={{
            width: 4, height: 4, borderRadius: '50%', background: '#94a3b8',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${delay}ms`,
        }} />
    );
}

function HeaderIconBtn({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
    return (
        <button onClick={onClick} title={title} style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {children}
        </button>
    );
}

function ActionBtn({ children, onClick, title, active }: { children: React.ReactNode; onClick?: () => void; title?: string; active?: boolean }) {
    return (
        <button onClick={onClick} title={title} style={{ background: 'none', border: 'none', cursor: 'pointer', color: active ? '#118DF0' : '#94a3b8', padding: '4px', borderRadius: 6, display: 'flex', transition: 'color 0.15s' }}>
            {children}
        </button>
    );
}

function InfoActionBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <button style={{ padding: '8px', borderRadius: 8, border: '1px solid #f1f5f9', background: '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ color: '#051650' }}>{icon}</div>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b' }}>{label}</span>
        </button>
    );
}

function InfoRow({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
    return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ flexShrink: 0, marginTop: 1 }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: accent ? '#e03555' : '#1e293b', wordBreak: 'break-word' }}>{value}</div>
            </div>
        </div>
    );
}
