import { useOutletContext, useLocation } from 'react-router-dom';
import {
    Package, QrCode, ShoppingCart, Download,
    AlertTriangle, Calendar as CalendarIcon, TrendingDown, Box, Cpu, ChevronRight
} from 'lucide-react';

/* ═══ INVENTARIO — SMART INVENTORY (22.50.48) ═══ */

export default function InventarioPage() {
    const { activeSub } = useOutletContext<{ activeSub: string | null }>();
    const { pathname } = useLocation();
    const pathSub = pathname.split('/')[2];
    const view = pathSub || activeSub || 'stock';

    return (
        <div style={{ padding: '32px 40px', maxWidth: 1400 }}>
            {/* Header section */}
            <header style={{ marginBottom: 32 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.15em' }}>GESTIÓN DE ALMACÉN · IA LOGISTICS</span>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#051650', margin: '4px 0 0' }}>
                    {view === 'stock' ? 'Stock Visual' : view === 'qr' ? 'Trazabilidad QR' : 'Smart Orders (IA)'}
                </h1>
            </header>

            {/* Premium KPIs - Exact mapping from 22.50.48 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                <InvMetricCard label="ÍTEMS EN CATÁLOGO" value="0" sub="Referencias activas en FDW" icon={<Package size={18} />} link="Desde TArticulo" />
                <InvMetricCard label="STOCK CRÍTICO" value="0" sub="Ítems por debajo del mínimo" icon={<AlertTriangle size={18} />} link="Inmediato" isAlert />
                <InvMetricCard label="CADUCIDAD PRÓXIMA" value="0" sub="Lotes con FEFO prioritario" icon={<CalendarIcon size={18} />} link="< 90 Días" isDanger />
                <InvMetricCard label="TOTAL LOTES" value="0" sub="Movimientos de stock registrados" icon={<TrendingDown size={18} />} link="StckMov" />
            </div>

            {/* Main View Area */}
            {view === 'stock' && (
                <div className="card" style={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, borderStyle: 'dashed', borderWidth: 2, background: 'rgba(248, 250, 252, 0.5)' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Box size={32} style={{ color: '#cbd5e1' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>SIN ARTÍCULOS EN INVENTARIO</h3>
                        <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 8 }}>Verifica la conexión con TArticulo en Supabase FDW</p>
                    </div>
                </div>
            )}

            {view === 'qr' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: 13, fontWeight: 900, color: '#051650' }}>REGISTRO DE TRAZABILIDAD</h3>
                            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>Trazabilidad FEFO de implantes y material quirúrgico AEMPS — fuente: StckMov via FDW</p>
                        </div>
                        <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 11, fontWeight: 800 }}>
                            <Download size={14} /> EXPORTAR REGISTRO
                        </button>
                    </div>
                    <div style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                        <QrCode size={48} style={{ color: '#cbd5e1' }} />
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>SIN REGISTROS DE TRAZABILIDAD</h3>
                            <p style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, marginTop: 4 }}>Los lotes se cargan automáticamente desde StckMov vía Supabase FDW</p>
                        </div>
                    </div>
                </div>
            )}

            {view === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '40px 0' }}>
                    <div style={{
                        width: 100, height: 100, borderRadius: 28, background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.06)', position: 'relative'
                    }}>
                        <Cpu size={48} style={{ color: '#118DF0' }} />
                        <div style={{
                            position: 'absolute', bottom: -5, right: -5, width: 24, height: 24,
                            borderRadius: '50%', background: '#118DF0', border: '4px solid #fff',
                            boxShadow: '0 0 10px rgba(17,141,240,0.4)'
                        }} />
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#051650', marginBottom: 12 }}>IA DENTAL <span style={{ color: '#118DF0' }}>ORDER ENGINE</span></h2>
                        <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, maxWidth: 500, lineHeight: 1.6, margin: '0 auto' }}>
                            Analiza el stock actual desde <strong style={{ color: '#051650' }}>TArticulo + StckMov</strong> (FDW Supabase) y genera una propuesta de pedido para todos los artículos por debajo del mínimo de reorden configurado.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 24 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#118DF0', boxShadow: '0 0 8px rgba(17,141,240,0.4)' }} /> CONEXIÓN SEGURA ACTIVA
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#118DF0' }} /> MOTOR LLAMA 3.3
                            </div>
                        </div>
                    </div>

                    <button style={{
                        background: '#051650', color: '#fff', fontWeight: 900, fontSize: 14,
                        padding: '16px 32px', borderRadius: 16, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 12, letterSpacing: '0.05em',
                        boxShadow: '0 10px 20px rgba(5, 22, 80, 0.2)', transition: 'transform 0.2s'
                    }}>
                        GENERAR PRE-PEDIDO INTELIGENTE <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}

function InvMetricCard({ label, value, sub, icon, link, isAlert, isDanger }: any) {
    return (
        <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ color: isAlert ? '#f59e0b' : isDanger ? '#FF4B68' : '#cbd5e1' }}>{icon}</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: isDanger ? '#FF4B68' : '#118DF0', cursor: 'pointer' }}>↗ {link}</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#051650', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{sub}</div>
        </div>
    );
}
