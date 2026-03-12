import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    ChevronLeft, ChevronRight, CalendarDays, Settings,
    Lock, Unlock, Calendar, LayoutList, Clock, Activity, Monitor, Search
} from 'lucide-react';
import { getCitasVentana, getCitasByDate, dateToISO, type CitaAPI } from '../../services/appointments.api';
import { CitaCard, CitaSlot, CitaSkeleton } from '../../components/agenda/CitaCard';
import '../../components/agenda/CitaCard.css';

/* ═══ AGENDA — Grid de citas High Fidelity (22.41.15) ═══ */

const JUAN_ANTONIO_ID = 12;
const DOCTOR_MAP: Record<number, string> = {
    3: 'Dr. Mario Rubio',
    4: 'Dra. Irene Garcia',
    8: 'Dra. Virginia Tresgallo',
    10: 'Dra. Miriam Carrasco',
    13: 'Dr. Ignacio Ferrero',
};
const DEFAULT_COLUMN_NAMES = ['Doctor', 'Tc. Juan Antonio Manzanedo'];

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function generateTimeSlots(dayOfWeek: number): string[] {
    const slots: string[] = [];
    const addBlock = (startH: number, endH: number) => {
        for (let h = startH; h < endH; h++) {
            for (let m = 0; m < 60; m += 15) {
                slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            }
        }
    };
    if (dayOfWeek === 5) addBlock(10, 15);
    else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        addBlock(10, 14);
        addBlock(16, 20);
    }
    return slots;
}

function formatSlotLabel(slot: string): { main: string; isHour: boolean } {
    const [h, m] = slot.split(':');
    const isHour = m === '00';
    return { main: isHour ? `${h}:${m}` : `:${m}`, isHour };
}

export default function AgendaPage() {
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [viewMode, setViewMode] = useState<'dia' | 'semana'>('dia');
    const [allCitas, setAllCitas] = useState<CitaAPI[]>([]);

    useEffect(() => {
        getCitasVentana().then(setAllCitas).catch(() => setAllCitas([]));
    }, []);

    const citasDelDia = useMemo(() => {
        const fechaStr = dateToISO(currentDate);
        return allCitas.filter(c => c.fecha === fechaStr);
    }, [allCitas, currentDate]);

    const COLUMN_NAMES = useMemo(() => {
        const doctorCitas = citasDelDia.filter(c => c.gabinete !== JUAN_ANTONIO_ID);
        if (doctorCitas.length > 0) {
            const firstDoc = doctorCitas[0];
            const doctorName = firstDoc.odontologo || DOCTOR_MAP[firstDoc.gabinete] || DEFAULT_COLUMN_NAMES[0];
            return [doctorName, DEFAULT_COLUMN_NAMES[1]];
        }
        return DEFAULT_COLUMN_NAMES;
    }, [citasDelDia]);

    const dayOfWeek = currentDate.getDay();
    const dayName = DAYS_ES[dayOfWeek];
    const dayNumber = currentDate.getDate();
    const monthName = MONTHS_ES[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    const timeSlots = useMemo(() => generateTimeSlots(dayOfWeek), [dayOfWeek]);
    const ROW_HEIGHT = 28;

    const positionedCitas = useMemo(() => {
        const result: any[] = [];
        const slotIndex = (timeStr: string): number => {
            const i = timeSlots.indexOf(timeStr);
            return i >= 0 ? i : -1;
        };
        const horaToSlotKey = (hora: string): string => {
            const [h, m] = hora.split(':').map(Number);
            const slotMin = Math.floor(m / 15) * 15;
            return `${String(h).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
        };

        for (const cita of citasDelDia) {
            const colIdx = cita.gabinete === JUAN_ANTONIO_ID ? 1 : 0;
            const slotKey = horaToSlotKey(cita.hora || '00:00');
            const idx = slotIndex(slotKey);
            if (idx < 0) continue;
            const top = idx * ROW_HEIGHT;
            const slotsSpan = Math.max(1, Math.ceil((cita.duracion || 15) / 15));
            const height = slotsSpan * ROW_HEIGHT;
            result.push({ cita, top, height, left: '0%', width: '100%', colIdx });
        }
        for (const col of [0, 1]) {
            const colCitas = result.filter(c => c.colIdx === col).sort((a, b) => a.top - b.top);
            const groups: any[][] = [];
            for (const pc of colCitas) {
                let added = false;
                for (const group of groups) {
                    const groupEnd = Math.max(...group.map(g => g.top + g.height));
                    if (pc.top < groupEnd) { group.push(pc); added = true; break; }
                }
                if (!added) groups.push([pc]);
            }
            for (const group of groups) {
                const n = group.length;
                group.forEach((pc, i) => { pc.left = `${(i / n) * 100}%`; pc.width = `${100 / n}%`; });
            }
        }
        return result;
    }, [citasDelDia, timeSlots]);

    const goToday = () => setCurrentDate(new Date());
    const goPrev = () => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
    const goNext = () => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });

    const isToday = (() => {
        const now = new Date();
        return currentDate.getDate() === now.getDate() &&
            currentDate.getMonth() === now.getMonth() &&
            currentDate.getFullYear() === now.getFullYear();
    })();

    return (
        <div className="agenda-page" style={{ display: 'flex', height: '100%', background: '#fff' }}>

            {/* ── SIDEBAR AGENDA ────────────────────────────────────────────── */}
            <aside style={{ width: 320, background: 'linear-gradient(135deg, #0c2a80, #051650)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>

                {/* BUSCAR / NUEVO */}
                <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 16px' }}>
                    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                        <button style={{ flex: 1, height: 36, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                            <Search size={14} />
                            <span>BUSCAR</span>
                        </button>
                        <button style={{ flex: 1, height: 36, borderRadius: 6, border: 'none', background: '#0ea5e9', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                            <CalendarDays size={14} />
                            <span>NUEVO</span>
                        </button>
                    </div>
                </div>

                {/* Área Title */}
                <div style={{ padding: '20px 24px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={18} color="#0ea5e9" />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em' }}>AGENDA</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>AGENDA CLÍNICA</div>
                        </div>
                    </div>
                    <div style={{ height: 1, background: 'linear-gradient(to right, rgba(14,165,233,0.4), transparent)' }} />
                </div>

                {/* Queue Stats */}
                <div style={{ flex: 1, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em' }}>
                            <Clock size={12} />
                            <span>SALA DE ESPERA</span>
                        </div>
                        <span style={badgeStyle}>0</span>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em' }}>
                                <Activity size={12} />
                                <span>EN GABINETE</span>
                            </div>
                            <span style={badgeStyle}>1</span>
                        </div>

                        {/* Presence Card */}
                        <div style={{ background: '#fff', borderRadius: 10, padding: '8px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#051650', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff' }}>G1</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>Maria Carmen</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Dr. Rubio · 35m</div>
                            </div>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'orange', boxShadow: '0 0 10px rgba(255,165,0,0.6)' }} />
                        </div>
                    </div>

                </div>

                {/* Footer actions */}
                <div style={{ padding: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button style={{ height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: '#0a2150', color: '#fff', textTransform: 'uppercase' }}>
                            <CalendarDays size={16} />
                            <span>CITA</span>
                        </button>
                        <button style={{ height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: '#C02040', color: '#fff', textTransform: 'uppercase' }}>
                            <Monitor size={16} />
                            <span>URGENTE</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── MAIN CONTENT ─────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 24px', background: '#fff', borderBottom: '1px solid #f1f5f9'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={goPrev} style={navBtnStyle}><ChevronLeft size={16} /></button>
                            <button onClick={goNext} style={navBtnStyle}><ChevronRight size={16} /></button>
                        </div>
                        <h1 style={{ fontSize: 18, fontWeight: 900, color: '#051650', margin: 0, letterSpacing: '-0.02em' }}>
                            {dayName}, {dayNumber} de {monthName}
                        </h1>
                        <button onClick={goToday} style={{
                            fontSize: 10, fontWeight: 900, color: isToday ? '#fff' : '#051650',
                            background: isToday ? '#051650' : '#f1f5f9', border: 'none',
                            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', letterSpacing: '0.05em'
                        }}>HOY</button>
                    </div>

                    <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
                        <button onClick={() => setViewMode('dia')} style={{
                            border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 11, fontWeight: 900,
                            background: viewMode === 'dia' ? '#fff' : 'transparent',
                            color: viewMode === 'dia' ? '#051650' : '#94a3b8',
                            boxShadow: viewMode === 'dia' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none'
                        }}>DÍA</button>
                        <button onClick={() => setViewMode('semana')} style={{
                            border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 11, fontWeight: 900,
                            background: viewMode === 'semana' ? '#fff' : 'transparent',
                            color: viewMode === 'semana' ? '#051650' : '#94a3b8',
                            boxShadow: viewMode === 'semana' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none'
                        }}>SEMANA</button>
                    </div>
                </div>

                <div style={{ flex: 1, overflow: 'auto', background: '#fcfdfe' }}>
                    <div style={{ minWidth: 800 }}>
                        <div style={{ display: 'flex', sticky: 'top', background: '#fff', borderBottom: '1px solid #f1f5f9', zIndex: 10 }}>
                            <div style={{ width: 80 }} />
                            {COLUMN_NAMES.map((name, i) => (
                                <div key={i} style={{ flex: 1, padding: '20px', fontSize: 12, fontWeight: 900, color: '#051650', textAlign: 'center', borderLeft: '1px solid #f1f5f9', letterSpacing: '0.05em' }}>
                                    {name.toUpperCase()}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', position: 'relative' }}>
                            <div style={{ width: 80, flexShrink: 0 }}>
                                {timeSlots.map(slot => (
                                    <div key={slot} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', borderBottom: '1px solid #f8fafc' }}>
                                        {formatSlotLabel(slot).isHour ? slot : ''}
                                    </div>
                                ))}
                            </div>
                            {COLUMN_NAMES.map((_, colIdx) => (
                                <div key={colIdx} style={{ flex: 1, position: 'relative', borderLeft: '1px solid #f1f5f9' }}>
                                    {timeSlots.map(slot => (<div key={slot} style={{ height: ROW_HEIGHT, borderBottom: '1px solid #f8fafc' }} />))}
                                    {positionedCitas.filter(pc => pc.colIdx === colIdx).map((pc, i) => (
                                        <div key={pc.cita.id} style={{ position: 'absolute', top: pc.top, left: pc.left, width: pc.width, height: pc.height - 1, padding: '1px', zIndex: 5 }}>
                                            <CitaCard cita={pc.cita} colorIndex={i} />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const badgeStyle = { width: 28, height: 28, borderRadius: 8, background: '#118DF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' };
const navBtnStyle = { width: 36, height: 36, borderRadius: 10, border: '1px solid #f1f5f9', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#051650' };
