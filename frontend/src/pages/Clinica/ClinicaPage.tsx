import { useState } from 'react';
import {
    Calendar, Activity, TrendingUp, ChevronRight, FileText, Landmark, MessageSquare, Brain
} from 'lucide-react';
import TablasBD from './TablasBD';
import { useOutletContext } from 'react-router-dom';

/* ═══ CLÍNICA — MÉTRICAS · ÚLTIMOS 7 DÍAS (22.40.51) ═══ */

export default function ClinicaPage() {
    const { activeSub } = useOutletContext<{ activeSub: string | null }>();

    if (activeSub === 'tablas') return <TablasBD />;

    const dayData = [
        { day: 'M', value: 23 },
        { day: 'X', value: 23 },
        { day: 'J', value: 11 },
        { day: 'V', value: 4 },
        { day: 'S', value: 3 },
        { day: 'D', value: 0 },
        { day: 'L', value: 0, active: true },
    ];

    return (
        <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>

            {/* Header Titles */}
            <div style={{ marginBottom: 32 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.15em' }}>MÉTRICAS · ÚLTIMOS 7 DÍAS</span>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#101d3a', margin: '4px 0 0' }}>Rendimiento de la Clínica</h1>
            </div>

            {/* Top 3 KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
                <StatCard
                    label="FACTURACIÓN TOTAL"
                    value="€0.00"
                    sub="0 facturas"
                    icon={<div style={{ width: 44, height: 44, borderRadius: '50%', background: '#118DF0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 900 }}>€</div>}
                />
                <StatCard
                    label="CITAS ESTA SEMANA"
                    value="64"
                    sub="0 canceladas"
                    icon={<div style={{ width: 44, height: 44, borderRadius: 10, background: '#101d3a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Calendar size={20} /></div>}
                />
                <StatCard
                    label="TASA CANCELACIÓN"
                    value="0%"
                    sub="En rango normal"
                    icon={<div style={{ width: 44, height: 44, borderRadius: 10, background: '#FBFFA3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#101d3a' }}><TrendingUp size={20} /></div>}
                />
            </div>

            {/* Main Weekly Chart Card */}
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: 32, marginBottom: 32, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <TrendingUp size={18} color="#101d3a" />
                        <h3 style={{ fontSize: 12, fontWeight: 900, color: '#101d3a', margin: 0, letterSpacing: '0.05em' }}>CITAS ÚLTIMOS 7 DÍAS</h3>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Media: 9.1/día</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, gap: 12, padding: '0 20px' }}>
                    {dayData.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8' }}>{d.value}</span>
                            <div style={{
                                width: '100%',
                                height: d.value > 0 ? `${(d.value / 30) * 120}px` : '4px',
                                background: d.active ? '#101d3a' : '#dbeafe',
                                borderRadius: 10,
                                position: 'relative'
                            }}>
                                {d.active && <div style={{ position: 'absolute', bottom: -14, left: 0, right: 0, height: 2, background: '#101d3a' }} />}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 900, color: d.active ? '#101d3a' : '#94a3b8' }}>{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Quick Access Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <DashboardLink label="VER FACTURACIÓN" icon={<FileText size={16} />} />
                <DashboardLink label="BANCO Y CONCILIACIÓN" icon={<Landmark size={16} />} />
                <DashboardLink label="PACIENTES EN WHATSAPP" icon={<MessageSquare size={16} />} />
                <DashboardLink label="IA & AUTOMATIZACIÓN" icon={<Brain size={16} />} />
            </div>
        </div>
    );
}

function StatCard({ label, value, sub, icon }: any) {
    return (
        <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '24px 32px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div>{icon}</div>
            <div>
                <div style={{ fontSize: 28, fontWeight: 1000, color: '#101d3a', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', margin: '8px 0 2px', letterSpacing: '0.08em' }}>{label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{sub}</div>
            </div>
        </div>
    );
}

function DashboardLink({ label, icon }: any) {
    return (
        <div style={{
            padding: '24px 32px', borderRadius: 20, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
            border: '1px solid #f1f5f9', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.01)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ color: '#101d3a' }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#101d3a', letterSpacing: '0.05em' }}>{label}</span>
            </div>
            <ChevronRight size={16} color="#cbd5e1" strokeWidth={3} />
        </div>
    );
}
