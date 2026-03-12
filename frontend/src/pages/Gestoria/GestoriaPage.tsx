import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, Landmark, FileText, Download, Plus,
    Search, Filter, Shield, Info, PieChart, Mail, AlertCircle,
    CheckCircle2, Clock, BarChart2, X, ChevronDown, ExternalLink,
    Upload, RefreshCw, Brain, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { accountingApi, GestoriaSummary, FacturaEmitida, FacturaEmail } from '../../services/accounting.api';

export default function GestoriaPage() {
    const { activeSub } = useOutletContext<{ activeSub: string | null }>();
    const [sub, setSub] = useState(activeSub ?? 'resumen');

    useEffect(() => {
        if (activeSub) setSub(activeSub);
    }, [activeSub]);

    const tabs = [
        { id: 'resumen', label: 'RESUMEN GLOBAL', icon: <TrendingUp size={14} /> },
        { id: 'factura', label: 'FACTURACIÓN', icon: <FileText size={14} /> },
        { id: 'email', label: 'FACTURAS EMAIL', icon: <Mail size={14} /> },
        { id: 'banco', label: 'BANCO Y CONCILIACIÓN', icon: <Landmark size={14} /> },
        { id: 'fiscal', label: 'MODELOS FISCALES', icon: <Shield size={14} /> },
        { id: 'informes', label: 'INFORMES', icon: <BarChart2 size={14} /> },
    ];

    return (
        <div style={{ padding: '32px 40px', background: '#fcfdfe', minHeight: '100%', fontFamily: "'Inter', sans-serif" }}>

            {/* Action Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button style={whiteBtnStyle}><Download size={14} /> EXPORTAR DATOS</button>
                    <button style={blueBtnStyle}><Plus size={14} /> NUEVA FACTURA</button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: 6, borderRadius: 16, gap: 4, marginBottom: 32, width: 'fit-content' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSub(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                            borderRadius: 12, border: 'none', fontSize: 10, fontWeight: 900,
                            cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                            background: sub === tab.id ? '#fff' : 'transparent',
                            color: sub === tab.id ? '#118DF0' : '#64748b',
                            boxShadow: sub === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <main>
                {sub === 'resumen' && <ResumenGlobal />}
                {sub === 'factura' && <FacturacionView />}
                {sub === 'email' && <FacturasEmailView />}
                {sub === 'banco' && <BancoView />}
                {sub === 'fiscal' && <ModelosFiscalesView />}
                {sub === 'informes' && <InformesView />}
            </main>
        </div>
    );
}

/* ─── RESUMEN GLOBAL ─────────────────────────────────── */
function ResumenGlobal() {
    const [summary, setSummary] = useState<GestoriaSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        accountingApi.getSummary()
            .then(setSummary)
            .catch(() => setSummary(null))
            .finally(() => setLoading(false));
    }, []);

    const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                <KPICard
                    label="INGRESOS BRUTOS"
                    value={loading ? '...' : summary ? fmt(summary.ingresosBrutos) : '€0,00'}
                    sub={loading ? 'Cargando...' : summary ? `Basado en ${summary.facturas} facturas emitidas` : 'Sin datos'}
                    icon={<TrendingUp size={18} />}
                />
                <KPICard
                    label="FACTURAS PENDIENTES"
                    value={loading ? '...' : summary ? String(summary.facturasEmitidas.pendientes) : '0'}
                    sub={loading ? 'Cargando...' : summary ? `${summary.facturasEmitidas.cobradas} cobradas` : 'Sin datos'}
                    icon={<TrendingDown size={18} />}
                    warn={!loading && (summary?.facturasEmitidas.pendientes ?? 0) > 0}
                />
                <KPICard
                    label="MOV. BANCARIOS PENDIENTES"
                    value={loading ? '...' : summary ? String(summary.movimientosPendientes) : '—'}
                    sub={loading ? 'Cargando...' : summary ? 'Sin conciliar' : 'Sin integración bancaria'}
                    icon={<Landmark size={18} />}
                    warn={!loading && (summary?.movimientosPendientes ?? 0) > 0}
                />
                <KPICard
                    label="EMAILS SIN CRUZAR"
                    value={loading ? '...' : summary ? String(summary.facturasPendientesCruce) : '—'}
                    sub={loading ? 'Cargando...' : 'Facturas recibidas pendientes'}
                    icon={<BarChart2 size={18} />}
                    warn={!loading && (summary?.facturasPendientesCruce ?? 0) > 0}
                />
            </div>

            {/* Chart + Verifactu side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                {/* Evolución Tesorería */}
                <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>Evolución de Tesorería</h3>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0', fontWeight: 500 }}>Sin datos reales — conectar integración bancaria</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['MENSUAL', 'TRIMESTRAL'].map(p => (
                                <button key={p} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: p === 'MENSUAL' ? '#051650' : '#fff', color: p === 'MENSUAL' ? '#fff' : '#64748b', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>{p}</button>
                            ))}
                        </div>
                    </div>
                    {/* Mini bar chart placeholder */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 8px' }}>
                        {['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'].map(m => (
                            <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 4 }} />
                                <span style={{ fontSize: 8, fontWeight: 700, color: '#cbd5e1' }}>{m}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Verifactu + Estado fiscal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: '#051650', borderRadius: 20, padding: 24, color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={16} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 900 }}>Verifactu</div>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FBFFA3', display: 'inline-block', marginRight: 4 }} />
                            </div>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>La integración con AEAT (Reglamento Verifactu) requiere configuración de certificado digital y credenciales de la Agencia Tributaria.</p>
                    </div>

                    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: 20 }}>
                        <h4 style={{ fontSize: 10, fontWeight: 900, color: '#64748b', letterSpacing: '0.08em', margin: '0 0 12px' }}>ESTADO FISCAL</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <StatusRow label="BANCO" status="Sin integración" warn />
                            <StatusRow
                                label="MODELOS AEAT"
                                status={loading ? 'Cargando...' : summary ? `${summary.modelosFiscales.borrador} borradores` : 'Pendiente config.'}
                                warn={!loading && (summary?.modelosFiscales.borrador ?? 0) > 0}
                            />
                            <StatusRow label="VERIFACTU" status="Pendiente config." warn />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusRow({ label, status, warn }: { label: string; status: string; warn?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: warn ? '#fef9c3' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: warn ? '#eab308' : '#22c55e' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#1e293b' }}>{label}</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: warn ? '#d97706' : '#16a34a' }}>{status}</span>
        </div>
    );
}

function KPICard({ label, value, sub, icon, warn }: { label: string; value: string; sub: string; icon: React.ReactNode; warn?: boolean }) {
    return (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: warn ? '#f59e0b' : '#94a3b8' }}>{icon}</span>
                <ArrowUpRight size={14} color="#94a3b8" />
            </div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>{sub}</div>
        </div>
    );
}

/* ─── FACTURACIÓN ────────────────────────────────────── */
function FacturacionView() {
    const [invoices, setInvoices] = useState<FacturaEmitida[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = (q?: Record<string, string>) => {
        setLoading(true);
        accountingApi.getInvoices(q)
            .then(r => { setInvoices(r.data); setTotal(r.pagination.total); })
            .catch(() => { setInvoices([]); setTotal(0); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleSearch = () => {
        if (search.trim()) load({ search });
        else load();
    };

    const fmt = (v: string) => {
        const n = parseFloat(v);
        return isNaN(n) ? v : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
    };

    const estadoStyle = (estado: string): React.CSSProperties => ({
        fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 8,
        background: estado === 'pendiente' ? '#fef3c7' : estado === 'cobrada' ? '#dcfce7' : '#f1f5f9',
        color: estado === 'pendiente' ? '#d97706' : estado === 'cobrada' ? '#16a34a' : '#64748b',
        textTransform: 'uppercase',
    });

    return (
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1' }} />
                    <input
                        style={{ width: '100%', padding: '14px 20px 14px 48px', borderRadius: 14, border: 'none', background: '#f8fafc', fontSize: 12, fontWeight: 600, outline: 'none' }}
                        placeholder="Buscar por paciente, NIF, nº factura o importe..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <button
                        onClick={handleSearch}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: '#f8fafc', color: '#051650', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}
                    >
                        <Search size={14} /> BUSCAR
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', padding: '14px 32px', background: '#fcfdfe', borderBottom: '1px solid #f1f5f9' }}>
                {['ID / SERIE', 'PACIENTE / TITULAR', 'FECHA', 'BASE IMP.', 'TOTAL FACTURA', 'ESTADO COBRO'].map(h => (
                    <div key={h} style={{ flex: 1, fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em' }}>{h}</div>
                ))}
            </div>
            {loading ? (
                <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#cbd5e1' }}>Cargando...</p>
                </div>
            ) : invoices.length === 0 ? (
                <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#cbd5e1', letterSpacing: '0.02em' }}>Sin facturas</p>
                </div>
            ) : (
                invoices.map(f => (
                    <div key={f.id} style={{ display: 'flex', padding: '16px 32px', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
                        <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: '#118DF0' }}>{f.numeroSerie}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{f.nombreCliente}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>NIF: {f.nifCliente}</div>
                        </div>
                        <div style={{ flex: 1, fontSize: 11, color: '#64748b' }}>{new Date(f.fechaEmision).toLocaleDateString('es-ES')}</div>
                        <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{fmt(f.baseImponible)}</div>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 900, color: '#1e293b' }}>{fmt(f.total)}</div>
                        <div style={{ flex: 1 }}>
                            <span style={estadoStyle(f.estadoPago)}>{f.estadoPago}</span>
                        </div>
                    </div>
                ))
            )}
            {!loading && total > 0 && (
                <div style={{ padding: '12px 32px', borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                    {total} factura{total !== 1 ? 's' : ''} en total
                </div>
            )}
        </div>
    );
}

/* ─── FACTURAS EMAIL ─────────────────────────────────── */
function FacturasEmailView() {
    const [facturas, setFacturas] = useState<FacturaEmail[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = (q?: Record<string, string>) => {
        setLoading(true);
        accountingApi.getEmailInvoices(q)
            .then(r => { setFacturas(r.data); setPagination(r.pagination); })
            .catch(() => { setFacturas([]); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const pendientes = facturas.filter(f => f.estado === 'pendiente').length;
    const cruzadas = facturas.filter(f => f.estado === 'cruzada').length;

    const totalDetectado = facturas.reduce((acc, f) => acc + (f.total ? parseFloat(f.total) : 0), 0);
    const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
    const fmtDecimal = (v?: string | null) => v ? fmt(parseFloat(v)) : '—';

    const handleCruzar = async (gmailMessageId: string) => {
        try {
            await accountingApi.updateEmailInvoice(gmailMessageId, { estado: 'cruzada' });
            load();
        } catch (e) {
            console.error('Error al cruzar factura:', e);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Gmail Connection Banner */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: '#0D1B4B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Mail size={26} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#0D1B4B', marginBottom: 3 }}>Facturas desde Gmail</div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>info@rubiogarciadental.com · Desde Ene 2025</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>Sincronización manual — sin conexión Gmail activa</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => load()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#051650', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                        <RefreshCw size={14} /> ACTUALIZAR
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: 'none', background: '#0D1B4B', color: '#fff', fontWeight: 900, fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(13,27,75,0.25)' }}>
                        <Mail size={14} /> CONECTAR GMAIL
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {[
                    { label: 'TOTAL EMAILS', value: loading ? '...' : String(pagination.total) },
                    { label: 'PENDIENTES CRUCE', value: loading ? '...' : String(pendientes), warn: pendientes > 0 },
                    { label: 'CRUZADAS', value: loading ? '...' : String(cruzadas) },
                    { label: 'TOTAL DETECTADO', value: loading ? '...' : fmt(totalDetectado), blue: true },
                ].map(s => (
                    <div key={s.label} style={{ background: s.warn ? '#fffbeb' : '#fff', borderRadius: 16, border: `1px solid ${s.warn ? '#fde68a' : '#f1f5f9'}`, padding: '16px 20px' }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: s.blue ? '#118DF0' : '#1e293b' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1' }} />
                    <input
                        style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 12, border: '1px solid #f1f5f9', background: '#fff', fontSize: 12, outline: 'none' }}
                        placeholder="Buscar por proveedor, nº factura o concepto..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && load(search.trim() ? { search } : undefined)}
                    />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>{loading ? '...' : `${facturas.length} de ${pagination.total} facturas`}</span>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.8fr 0.8fr 0.8fr 1fr 32px', padding: '12px 24px', background: '#fcfdfe', borderBottom: '1px solid #f1f5f9', gap: 8 }}>
                    {['PROVEEDOR', 'Nº FACTURA', 'CATEGORÍA', 'FECHA', 'BASE', 'IVA', 'TOTAL', 'ESTADO', ''].map(h => (
                        <div key={h} style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.06em' }}>{h}</div>
                    ))}
                </div>
                {loading ? (
                    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>Cargando...</p>
                    </div>
                ) : facturas.length === 0 ? (
                    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>Sin facturas de email</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Conecta Gmail o importa facturas manualmente</p>
                    </div>
                ) : (
                    facturas.map((f) => (
                        <div key={f.gmailMessageId} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.8fr 0.8fr 0.8fr 1fr 32px', padding: '16px 24px', borderBottom: '1px solid #f8fafc', gap: 8, alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                                    {f.proveedor?.nombreFiscal ?? f.proveedorExtraido ?? 'Proveedor desconocido'}
                                </div>
                                {f.proveedor?.cifNif && (
                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>CIF: {f.proveedor.cifNif}</div>
                                )}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#118DF0' }}>{f.numeroFactura ?? '—'}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>—</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                                {f.fechaFactura ? new Date(f.fechaFactura).toLocaleDateString('es-ES') : new Date(f.createdAt).toLocaleDateString('es-ES')}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{fmtDecimal(f.baseImponible)}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{f.ivaPct ? `${f.ivaPct}%` : '—'}</div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#1e293b' }}>{fmtDecimal(f.total)}</div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{ fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 8, background: f.estado === 'pendiente' ? '#fef3c7' : '#dcfce7', color: f.estado === 'pendiente' ? '#d97706' : '#16a34a' }}>
                                    {f.estado.toUpperCase()}
                                </span>
                                {f.estado === 'pendiente' && (
                                    <button
                                        onClick={() => handleCruzar(f.gmailMessageId)}
                                        style={{ padding: '4px 10px', borderRadius: 6, background: '#118DF0', color: '#fff', border: 'none', fontSize: 9, fontWeight: 900, cursor: 'pointer' }}
                                    >
                                        CRUZAR
                                    </button>
                                )}
                            </div>
                            <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#cbd5e1' }}><X size={14} /></button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

/* ─── BANCO Y CONCILIACIÓN ───────────────────────────── */
function BancoView() {
    return (
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff7ed', border: '2px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={28} color="#f97316" />
            </div>
            <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', marginBottom: 8 }}>Integración Bancaria No Configurada</h3>
                <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, maxWidth: 480, lineHeight: 1.6 }}>Para ver apuntes bancarios y usar la conciliación automática, conecta tu banco a través de Open Banking (PSD2) o importa los movimientos manualmente en CSV.</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Compatible con Santander, BBVA, CaixaBank y otros formatos AEB43</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                <button style={{ ...whiteBtnStyle, padding: '12px 24px' }}><ExternalLink size={14} /> CONECTAR BANCO (PSD2)</button>
                <button style={{ ...blueBtnStyle, padding: '12px 24px' }}><Upload size={14} /> IMPORTAR CSV BANCARIO</button>
            </div>
        </div>
    );
}

/* ─── MODELOS FISCALES ───────────────────────────────── */
const MODELOS_CALENDARIO = [
    { num: '303', name: 'I.V.A. Trimestral', sub: 'Sin datos reales — configura FDW', badge: 'ORIENTATIVO', badgeColor: '#64748b' },
    { num: '111', name: 'Retenciones IRPF', sub: 'Nóminas y servicios profesionales', badge: 'ORIENTATIVO', badgeColor: '#64748b' },
    { num: '115', name: 'Retención Alquiler', sub: 'Inmueble clínica principal', badge: 'ORIENTATIVO', badgeColor: '#64748b' },
    { num: '130', name: 'Pago Frac. IRPF', sub: 'Modelo opcional según rendimientos', badge: 'PLANIFICADO', badgeColor: '#7c3aed' },
    { num: '202', name: 'Pago Frac. Sociedades', sub: 'Basado en beneficio ejercicio anterior', badge: 'FUTURO', badgeColor: '#2563eb' },
    { num: '100', name: 'Declaración Renta', sub: 'Presentación telemática abierta', badge: 'CAMPAÑA', badgeColor: '#dc2626' },
];

function ModelosFiscalesView() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
            {/* Liquidación Q1 */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#1e293b', marginBottom: 20 }}>Liquidación Q1 2026</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 12 }}>
                    <span>CONCEPTOS IVA</span><span>IMPORTE</span>
                </div>
                {[
                    { label: 'IVA Repercutido (Cobrado)', sub: 'Sin facturas con IVA emitidas', pct: '21%', value: '—' },
                    { label: 'IVA Deducible (Gastos)', sub: 'Sin integración bancaria', pct: '', value: '—' },
                ].map((r, i) => (
                    <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{r.label}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{r.sub}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            {r.pct && <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>{r.pct}</div>}
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#1e293b' }}>{r.value}</div>
                        </div>
                    </div>
                ))}
                <div style={{ marginTop: 20, padding: '14px 16px', background: '#f8fafc', borderRadius: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 6 }}>A INGRESAR (MODELO 303)</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#94a3b8' }}>Sin datos</div>
                    <div style={{ fontSize: 10, color: '#f97316', fontWeight: 700, marginTop: 4 }}>PENDIENTE INTEGRACIÓN</div>
                </div>
                <button style={{ width: '100%', marginTop: 16, padding: '12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Shield size={14} /> PRE-VISUALIZAR MODELO 303 (SIN DATOS)
                </button>
            </div>

            {/* Calendario Fiscal */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#1e293b', margin: 0 }}>Calendario Fiscal Rubio García Dental</h3>
                    <span style={{ fontSize: 10, fontWeight: 900, padding: '4px 12px', borderRadius: 8, background: '#051650', color: '#fff' }}>2026 — Orientativo</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {MODELOS_CALENDARIO.map(m => (
                        <div key={m.num} style={{ padding: '18px 20px', borderRadius: 14, border: '1px solid #f1f5f9', background: '#fcfdfe', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <span style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>{m.num}</span>
                                <span style={{ fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6, background: m.badgeColor + '18', color: m.badgeColor }}>{m.badge}</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{m.name}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{m.sub}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── INFORMES ───────────────────────────────────────── */
const REPORT_TYPES = [
    { name: 'Rentabilidad por Doctor', sub: 'Sin datos', tag: 'Excel' },
    { name: 'Liquidación de Atención', sub: 'Sin datos', tag: 'Excel' },
    { name: 'Listado de Control Tax', sub: 'Sin datos', tag: 'Excel' },
    { name: 'Enlace Verifactu', sub: 'Sin datos', tag: 'PDF' },
    { name: 'Balance de Situación', sub: 'Sin datos', tag: 'Excel' },
    { name: 'Informe de Tesorería', sub: 'Sin datos', tag: 'PDF — PRONTO' },
];

function InformesView() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
            {/* Informes list */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#1e293b', margin: 0 }}>Centro de Informes</h3>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Exportación analítica Rubio García Dental</p>
                    <p style={{ fontSize: 10, color: '#f97316', background: '#fff7ed', padding: '8px 12px', borderRadius: 8, marginTop: 8, fontWeight: 600 }}>Los informes se generan desde datos de facturación SII. Sin datos conectados, las descargas estarán vacías.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {REPORT_TYPES.map((r, i) => (
                        <div key={i} style={{ padding: '16px 18px', borderRadius: 12, border: '1px solid #f1f5f9', background: '#fcfdfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{r.name}</div>
                                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{r.sub}</div>
                            </div>
                            <span style={{ fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6, background: '#f1f5f9', color: '#64748b' }}>{r.tag}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* IA Informe Personalizado */}
            <div style={{ background: 'linear-gradient(160deg, #0B0227, #1F027F)', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Brain size={22} color="#fff" />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Generar Informe Personalizado</h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>Selecciona los parámetros y deja que la IA de SmileStudio analice los datos financieros por ti.</p>
                </div>
                <button style={{ width: '100%', marginTop: 24, padding: '14px', borderRadius: 12, border: 'none', background: '#fff', color: '#051650', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <Download size={16} /> GENERAR Y DESCARGAR INFORME CSV
                </button>
            </div>
        </div>
    );
}

const whiteBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: '1px solid #f1f5f9', background: '#fff', color: '#051650', fontWeight: 900, fontSize: 12, cursor: 'pointer' };
const blueBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: 'none', background: '#118DF0', color: '#fff', fontWeight: 900, fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(17,141,240,0.2)' };
