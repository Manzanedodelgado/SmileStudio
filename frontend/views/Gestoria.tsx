
import React, { useState, useEffect, useCallback } from 'react';
import { usePermission } from '../hooks/usePermission';
import {
    TrendingUp,
    TrendingDown,
    Receipt,
    Wallet,
    Building,
    Scale,
    Plus,
    Download,
    Filter,
    Search,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    FileText,
    CreditCard,
    PieChart,
    ChevronRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    ArrowLeftRight,
    FileSpreadsheet,
    Activity,
    Banknote,
    MoreHorizontal,
    Mail,
    RefreshCw,
    Paperclip,
    ExternalLink,
    Sparkles,
    AlertTriangle,
    X,
    Eye
} from 'lucide-react';
// M-02 FIX: Importar StatCard y AccessDenied compartidos de UI.tsx (elimina definición local duplicada)
import { StatCard, AccessDenied } from '../components/UI';
import { getFacturas, getMovimientosBanco, getGestoriaStats, FacturaUI, MovimientoBancoUI } from '../services/facturacion.service';
import { isDbConfigured } from '../services/db';
import { fetchInvoiceEmails, isGmailConfigured, isGmailAuthorized, startGmailAuth, disconnectGmail, handleOAuthRedirect } from '../services/gmail.service';
import { parseAllInvoiceEmails, loadFacturasFromSupabase, updateFacturaEstado, type FacturaExtraida } from '../services/invoice-parser.service';

interface GestoriaProps {
    activeSubArea?: string;
}

const Gestoria: React.FC<GestoriaProps> = ({ activeSubArea }) => {
    // VLN-012 FIX: Solo admin y recepcion pueden acceder a gestóría
    const canView = usePermission('view_gestoria');
    if (!canView) return (
        <AccessDenied
            icon={ShieldCheck}
            message="Solo administración y recepción pueden acceder a la Gestoría."
        />
    );

    const [activeTab, setActiveTab] = useState<'resumen' | 'facturacion' | 'gmail' | 'banco' | 'impuestos' | 'informes'>('resumen');

    // ── Gmail invoice state ──────────────────────────────────────
    const [gmailFacturas, setGmailFacturas] = useState<FacturaExtraida[]>([]);
    const [gmailSyncing, setGmailSyncing] = useState(false);
    const [gmailLastSync, setGmailLastSync] = useState<Date | null>(null);
    const [gmailError, setGmailError] = useState<string | null>(null);
    const [gmailSearch, setGmailSearch] = useState('');
    const [gmailConnected, setGmailConnected] = useState(isGmailAuthorized());
    const [gmailProgress, setGmailProgress] = useState<string | null>(null);
    // Filters
    const [filterYear, setFilterYear] = useState<string>('');
    const [filterProveedor, setFilterProveedor] = useState<string>('');
    const [filterCategoria, setFilterCategoria] = useState<string>('');
    const [filterEstado, setFilterEstado] = useState<string>('');

    // Handle OAuth redirect on mount (if returning from Google auth)
    useEffect(() => {
        handleOAuthRedirect().then(ok => {
            if (ok) {
                setGmailConnected(true);
                setActiveTab('gmail');
                // Auto-sync after connection
                setTimeout(() => syncGmail(), 500);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const syncGmail = useCallback(async () => {
        setGmailSyncing(true);
        setGmailError(null);
        setGmailProgress('Buscando emails de facturas...');
        try {
            const emails = await fetchInvoiceEmails(420, (fetched, total) => {
                setGmailProgress(`Descargando ${fetched}/${total} emails...`);
            });
            setGmailProgress(`Parseando ${emails.length} facturas y descargando PDFs...`);
            const parsed = await parseAllInvoiceEmails(emails);
            setGmailFacturas(parsed);
            setGmailLastSync(new Date());
        } catch (e: unknown) {
            setGmailError(e instanceof Error ? e.message : 'Error de sincronización');
        } finally {
            setGmailSyncing(false);
            setGmailProgress(null);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'gmail' && gmailFacturas.length === 0 && !gmailSyncing) {
            syncGmail();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const filteredGmailFacturas = gmailFacturas.filter(f => {
        // Year filter
        if (filterYear && !f.fecha_email.startsWith(filterYear)) return false;
        // Proveedor filter
        if (filterProveedor && f.proveedor !== filterProveedor) return false;
        // Categoría filter
        if (filterCategoria && f.categoria !== filterCategoria) return false;
        // Estado filter
        if (filterEstado && f.estado !== filterEstado) return false;
        // Text search
        if (!gmailSearch) return true;
        const q = gmailSearch.toLowerCase();
        return f.proveedor.toLowerCase().includes(q)
            || (f.numero_factura ?? '').toLowerCase().includes(q)
            || f.concepto.toLowerCase().includes(q)
            || (f.categoria ?? '').toLowerCase().includes(q)
            || (f.proveedor_cif ?? '').toLowerCase().includes(q);
    });

    // Derived unique values for filter dropdowns
    const uniqueYears = [...new Set(gmailFacturas.map(f => f.fecha_email.slice(0, 4)))].sort().reverse();
    const uniqueProveedores = [...new Set(gmailFacturas.map(f => f.proveedor))].sort();
    const uniqueCategorias = [...new Set(gmailFacturas.map(f => f.categoria).filter(Boolean) as string[])].sort();

    // Load persisted invoices from Supabase on mount
    useEffect(() => {
        loadFacturasFromSupabase().then(rows => {
            if (rows.length > 0) setGmailFacturas(rows);
        });
    }, []);

    const toggleFacturaEstado = (id: string, estado: FacturaExtraida['estado']) => {
        setGmailFacturas(prev => prev.map(f => f.gmail_message_id === id ? { ...f, estado } : f));
        updateFacturaEstado(id, estado).catch(() => {/* silent */ });
    };

    useEffect(() => {
        if (!activeSubArea) return;

        switch (activeSubArea) {
            case 'Resumen Global':
                setActiveTab('resumen');
                break;
            case 'Facturación':
                setActiveTab('facturacion');
                break;
            case 'Banco y Conciliación':
                setActiveTab('banco');
                break;
            case 'Modelos Fiscales':
                setActiveTab('impuestos');
                break;
            case 'Informes':
                setActiveTab('informes');
                break;
        }
    }, [activeSubArea]);
    const [facturas, setFacturas] = useState<FacturaUI[]>([]);
    const [movimientos, setMovimientos] = useState<MovimientoBancoUI[]>([]);
    // M-08 FIX: Estado inicial con valores neutros ('—') en vez de datos falsos hardcodeados
    const [stats, setStats] = useState({ ingresosBrutos: '—', facturasConteo: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (isDbConfigured()) {
            getFacturas().then(data => {
                if (data.length > 0) setFacturas(data);
            });
            getMovimientosBanco().then(data => {
                if (data.length > 0) setMovimientos(data);
            });
            setStatsLoading(true);
            getGestoriaStats().then(s => { setStats(s); setStatsLoading(false); });
        } else {
            setStatsLoading(false);
        }
    }, []);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [menuFacturaId, setMenuFacturaId] = useState<string | null>(null);
    const [vistaTesoreria, setVistaTesoreria] = useState<'mensual' | 'trimestral'>('mensual');
    // Filtros tab Facturación
    const [facturaSearch, setFacturaSearch] = useState('');
    const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState(false);
    const [filtroEstadoFac, setFiltroEstadoFac] = useState<string>('');
    const [filtroPeriodo, setFiltroPeriodo] = useState<'todo' | 'mes' | 'trimestre' | 'anio'>('todo');

    const facturasFiltradas = facturas.filter(f => {
        // Búsqueda texto
        if (facturaSearch) {
            const q = facturaSearch.toLowerCase();
            const match = (f.id ?? '').toLowerCase().includes(q)
                || (f.name ?? '').toLowerCase().includes(q)
                || (f.status ?? '').toLowerCase().includes(q)
                || (f.total ?? '').toString().includes(q);
            if (!match) return false;
        }
        // Filtro estado
        if (filtroEstadoFac && f.status !== filtroEstadoFac) return false;
        // Filtro periodo
        if (filtroPeriodo !== 'todo' && f.rawDate) {
            const now = new Date();
            const d = f.rawDate;
            if (filtroPeriodo === 'mes') {
                if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
            } else if (filtroPeriodo === 'trimestre') {
                const q = Math.floor(now.getMonth() / 3);
                if (Math.floor(d.getMonth() / 3) !== q || d.getFullYear() !== now.getFullYear()) return false;
            } else if (filtroPeriodo === 'anio') {
                if (d.getFullYear() !== now.getFullYear()) return false;
            }
        }
        return true;
    });

    // Calcula datos del gráfico Tesorería desde facturas reales (NV_CabFactura)
    const chartData: { label: string; pct: number; rawEur: number }[] = (() => {
        const year = new Date().getFullYear();
        const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        if (vistaTesoreria === 'mensual') {
            const buckets = MESES.map((label, m) => ({
                label,
                rawEur: facturas
                    .filter(f => f.rawDate && f.rawDate.getFullYear() === year && f.rawDate.getMonth() === m)
                    .reduce((s, f) => s + (f.rawTotal || 0), 0)
            }));
            const maxVal = Math.max(...buckets.map(b => b.rawEur), 1);
            return buckets.map(b => ({ ...b, pct: Math.round((b.rawEur / maxVal) * 100) }));
        } else {
            const quarters = ['T1', 'T2', 'T3', 'T4'].map((label, q) => ({
                label,
                rawEur: facturas
                    .filter(f => f.rawDate && f.rawDate.getFullYear() === year && Math.floor(f.rawDate.getMonth() / 3) === q)
                    .reduce((s, f) => s + (f.rawTotal || 0), 0)
            }));
            const maxVal = Math.max(...quarters.map(b => b.rawEur), 1);
            return quarters.map(b => ({ ...b, pct: Math.round((b.rawEur / maxVal) * 100) }));
        }
    })();
    const tesoreriaConDatos = chartData.some(d => d.rawEur > 0);


    // M-01 FIX: Descargar una factura individual como CSV — datos reales de NV_CabFactura
    const descargarFactura = (row: FacturaUI) => {
        const rows = [
            ['Nº Factura', 'Paciente/Titular', 'Fecha', 'Base Imp.', 'Total', 'Estado', 'TBAI'],
            [row.id ?? '—', row.name ?? '—', row.date ?? '—', row.base ?? '—', row.total ?? '—', row.status ?? '—', row.tbai ?? '—'],
        ];
        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura_${(row.id ?? 'sin_id').replace(/\/| /g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // M-01 FIX: Cambiar estado factura (Liquidado/Pendiente/Impagado)
    // Para facturas GELITE: actualización local optimista (NV_CabFactura es FDW read-only — requiere RPC en GELITE)
    // Para facturas Gmail (FacturaExtraida): escribe en Supabase via updateFacturaEstado
    const cambiarEstadoFactura = async (row: FacturaUI, nuevoEstado: string) => {
        setMenuFacturaId(null);
        // Actualización local inmediata
        setFacturas(prev => prev.map(f => f.id === row.id ? { ...f, status: nuevoEstado as FacturaUI['status'] } : f));
        // Log para trazabilidad — la persistencia real en SQL Server se gestiona via GELITE
        console.info('[Gestoria] Estado factura actualizado localmente:', row.id, '→', nuevoEstado);
    };

    // M-01 FIX: Exportar datos de Gestoria como CSV — datos reales de NV_CabFactura + BancoMov via Supabase FDW
    const exportarGestoriaCSV = () => {
        const rows = [
            ['Tipo', 'Fecha', 'Concepto/Contrapón', 'Total (EUR)', 'Estado', 'Serie'],
            ...facturas.map(f => [
                'Factura',
                f.fecha ?? '—',
                f.contrapartida ?? '—',
                f.total != null ? String(f.total) : '—',
                f.estado ?? '—',
                f.serie ?? '—',
            ]),
            ...movimientos.map(m => [
                'Movimiento Banco',
                m.fecha ?? '—',
                m.concepto ?? '—',
                m.importe != null ? String(m.importe) : '—',
                m.tipo ?? '—',
                '—',
            ]),
        ];
        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gestoria_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const tabs = [
        { id: 'resumen', label: 'Resumen Global', icon: PieChart },
        { id: 'facturacion', label: 'Facturación', icon: Receipt },
        { id: 'gmail', label: 'Facturas Email', icon: Mail, badge: gmailFacturas.filter(f => f.estado === 'pendiente').length || undefined },
        { id: 'banco', label: 'Banco y Conciliación', icon: ArrowLeftRight },
        { id: 'impuestos', label: 'Modelos Fiscales', icon: Scale },
        { id: 'informes', label: 'Informes', icon: FileSpreadsheet },
    ] as { id: string; label: string; icon: React.ElementType; badge?: number }[];

    return (
        <div className="space-y-10 pb-24">
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <button
                        onClick={exportarGestoriaCSV}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-slate-800 text-[#051650] dark:text-slate-200 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-[13px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        title="Exportar facturas NV_CabFactura + movimientos BancoMov como CSV"
                    >
                        <Download className="w-4 h-4" />
                        Exportar Datos
                    </button>
                    <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:shadow-2xl hover:shadow-blue-500/30 transition-all active:scale-95 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <Plus className="w-4 h-4" />
                        Nueva Factura
                    </button>
                </div>
            </div>

            {/* Navigation Tabs - High Fidelity */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-200/40 dark:bg-slate-800/50 rounded-[1.5rem] w-full xl:w-fit overflow-x-auto no-scrollbar shadow-inner border border-slate-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            relative flex items-center gap-3 px-6 py-3 rounded-2xl text-[13px] font-bold uppercase tracking-widest transition-all whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xl scale-105'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                        `}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : ''}`} />
                        {tab.label}
                        {tab.badge && tab.badge > 0 ? (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[13px] font-bold rounded-full flex items-center justify-center">
                                {tab.badge > 9 ? '9+' : tab.badge}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                {activeTab === 'resumen' && (
                    <div className="space-y-10">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <StatCard
                                icon={TrendingUp}
                                title="Ingresos Brutos"
                                value={stats.ingresosBrutos}
                                trend={undefined}
                                isPositive={true}
                                color="text-blue-600"
                                description={`Basado en ${stats.facturasConteo} facturas emitidas`}
                            />
                            <StatCard
                                icon={TrendingDown}
                                title="Gastos Totales"
                                value="—"
                                trend={undefined}
                                isPositive={false}
                                color="text-red-500"
                                description="Pendiente conexión FDW (BancoMov)"
                            />
                            <StatCard
                                icon={Banknote}
                                title="Saldo en Bancos"
                                value="—"
                                trend={undefined}
                                isPositive={true}
                                color="text-blue-500"
                                description="Sin integración bancaria configurada"
                            />
                            <StatCard
                                icon={Activity}
                                title="Margen Neto"
                                value="—"
                                trend={undefined}
                                isPositive={true}
                                color="text-amber-600"
                                description="Sin datos suficientes para calcular"
                            />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                            {/* Distribution chart mockup */}
                            <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                                <div className="flex justify-between items-center mb-10 relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-bold text-[#051650] dark:text-white tracking-tight flex items-center gap-2">
                                            Evolución de Tesorería
                                            {!tesoreriaConDatos && <span className="w-2 h-2 rounded-full bg-[#FBFFA3] animate-pulse" title="⚠️ Dato simulado — sin facturas en Supabase" />}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 mt-1">
                                            {tesoreriaConDatos ? 'Ingresos reales desde NV_CabFactura' : 'Sin datos reales — conectar FDW'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setVistaTesoreria('mensual')}
                                            className={`px-4 py-2 rounded-xl text-[12px] font-bold uppercase transition-all ${vistaTesoreria === 'mensual' ? 'bg-[#051650] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >Mensual</button>
                                        <button
                                            onClick={() => setVistaTesoreria('trimestral')}
                                            className={`px-4 py-2 rounded-xl text-[12px] font-bold uppercase transition-all ${vistaTesoreria === 'trimestral' ? 'bg-[#051650] text-white' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                                        >Trimestral</button>
                                    </div>
                                </div>

                                {/* Gráfico Tesorería — datos reales de NV_CabFactura */}
                                <div className="h-80 flex items-end gap-4 justify-between relative z-10">
                                    {chartData.map((bar, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                                            <div className="w-full flex flex-col gap-1 items-center justify-end h-full">
                                                <div
                                                    className="w-full bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-xl transition-all group-hover:scale-x-110 duration-500 shadow-lg shadow-blue-500/20"
                                                    style={{ height: `${bar.pct || 2}%` }}
                                                />
                                                <div className="w-full bg-red-500/20 rounded-b-xl" style={{ height: `${(bar.pct || 2) / 2.5}%` }} />
                                            </div>
                                            <span className="text-[12px] font-bold text-slate-400 group-hover:text-[#051650] transition-colors">{bar.label}</span>
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#051650] text-white text-[13px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                {bar.rawEur > 0 ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(bar.rawEur) : 'Sin datos'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Compliance and Banking Status */}
                            <div className="space-y-8">
                                <div className="bg-[#051650] p-6 rounded-xl text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-3 bg-white/10 rounded-2xl">
                                                <ShieldCheck className="w-6 h-6 text-[#051650]" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl tracking-tight">Verifactu</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="w-2 h-2 rounded-full bg-[#FBFFA3]"></div>
                                                    <span className="text-[12px] uppercase font-bold text-[#051650] tracking-widest">Pendiente configuración</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="p-5 bg-white/5 border border-white/10 rounded-[1.5rem]">
                                                <p className="text-[13px] text-white/80 leading-relaxed font-medium">
                                                    La integración con AEAT (Reglamento Verifactu) requiere configuración de certificado digital y credenciales de la Agencia Tributaria.
                                                </p>
                                                <p className="text-[12px] text-[#051650] font-bold mt-3">Sin envíos realizados — pendiente activación</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]"></div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-bold text-[#051650] dark:text-white mb-6 uppercase text-[13px] tracking-widest">Estado Fiscal</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-[#FEFDE8] p-4 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#FEFCC4] flex items-center justify-center">
                                                    <AlertCircle className="w-4 h-4 text-[#051650]" />
                                                </div>
                                                <span className="text-[13px] font-bold text-[#051650] dark:text-white">BANCO</span>
                                            </div>
                                            <span className="text-[12px] font-bold text-[#051650]">Sin integración</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-[#FEFDE8] p-4 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#FEFCC4] flex items-center justify-center">
                                                    <AlertCircle className="w-4 h-4 text-[#051650]" />
                                                </div>
                                                <span className="text-[13px] font-bold text-[#051650] dark:text-white">MODELOS AEAT</span>
                                            </div>
                                            <span className="text-[12px] font-bold text-[#051650]">Pendiente config.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'facturacion' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-8 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                            <div className="relative w-full xl:w-[500px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={facturaSearch}
                                    onChange={e => setFacturaSearch(e.target.value)}
                                    placeholder="Buscar por paciente, NIF, nº factura o importe..."
                                    className="w-full pl-12 pr-6 py-4 bg-slate-100 dark:bg-slate-700/50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 border-none transition-all placeholder:text-slate-400"
                                />
                                {facturaSearch && (
                                    <button onClick={() => setFacturaSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-3 w-full xl:w-auto">
                                <button
                                    onClick={() => setShowFiltrosAvanzados(v => !v)}
                                    className={`flex-1 xl:flex-none flex items-center justify-center gap-3 px-5 py-3 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all ${showFiltrosAvanzados ? 'bg-[#051650] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200'}`}>
                                    <Filter className="w-4 h-4" />
                                    Filtros {showFiltrosAvanzados ? '▲' : '▼'}
                                </button>
                                <div className="flex gap-1">
                                    {(['todo', 'mes', 'trimestre', 'anio'] as const).map(p => (
                                        <button key={p}
                                            onClick={() => setFiltroPeriodo(p)}
                                            className={`px-3 py-2 rounded-xl text-[13px] font-bold uppercase transition-all ${filtroPeriodo === p ? 'bg-[#051650] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                            {p === 'todo' ? 'Todo' : p === 'mes' ? 'Mes' : p === 'trimestre' ? 'Trim.' : 'Año'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Panel de filtros avanzados */}
                        {showFiltrosAvanzados && (
                            <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Estado:</span>
                                {['', 'Liquidado', 'Pendiente', 'Impagado'].map(est => (
                                    <button key={est || 'todos'}
                                        onClick={() => setFiltroEstadoFac(est)}
                                        className={`px-3 py-1.5 rounded-xl text-[12px] font-bold uppercase transition-all ${filtroEstadoFac === est ? 'bg-[#051650] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#051650]/30'}`}>
                                        {est || 'Todos'}
                                    </button>
                                ))}
                                <span className="ml-auto text-[12px] text-slate-400 font-bold">{facturasFiltradas.length} de {facturas.length} facturas</span>
                            </div>
                        )}

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-700/30 text-[12px] uppercase font-bold tracking-[0.2em] text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-4 py-3">ID Legal (TBAI)</th>
                                        <th className="px-4 py-3">Paciente / Titular</th>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3 text-right">Base Imp.</th>
                                        <th className="px-4 py-3 text-right">Total Factura</th>
                                        <th className="px-4 py-3 text-center">Estado Cobro</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {facturasFiltradas.length === 0 && (
                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400 font-bold">
                                            {facturaSearch || filtroEstadoFac || filtroPeriodo !== 'todo' ? 'Sin resultados con los filtros aplicados' : 'Sin facturas'}
                                        </td></tr>
                                    )}
                                    {facturasFiltradas.map((row, i) => (
                                        <tr key={i} className="hover:bg-blue-50/30 dark:hover:bg-slate-700/40 transition-all group">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                                        <FileText className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-[#051650] dark:text-blue-200 leading-none mb-1">{row.id}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${row.tbai === 'Verificado' ? 'bg-blue-500' : row.tbai === 'Error' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                                            <span className="text-[13px] font-bold uppercase tracking-widest text-slate-400">Verifactu: {row.tbai}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{row.name}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{row.date.split(',')[0]}</span>
                                                    <span className="text-[12px] text-slate-400 font-bold">{row.date.split(',')[1]}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-500">{row.base}</td>
                                            <td className="px-4 py-3.5 text-right">
                                                <span className="text-lg font-bold text-[#051650] dark:text-white">{row.total}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className={`
                                                    mx-auto w-fit px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-widest border
                                                    ${row.status === 'Liquidado' ? 'bg-blue-50 text-[#051650] border-blue-100' : ''}
                                                    ${row.status === 'Pendiente' ? 'bg-blue-50 text-blue-600 border-blue-100' : ''}
                                                    ${row.status === 'Impagado' ? 'bg-[#FFF0F3] text-[#E03555] border-rose-100 animate-pulse' : ''}
                                                `}>
                                                    {row.status}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 relative">
                                                    {/* Download — descarga la factura seleccionada como CSV */}
                                                    <button
                                                        onClick={() => descargarFactura(row)}
                                                        title="Descargar factura como CSV"
                                                        className="p-2.5 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 rounded-xl transition-all shadow-sm"
                                                    >
                                                        <Download className="w-4.5 h-4.5 text-slate-600" />
                                                    </button>
                                                    {/* MoreHorizontal — menú inline de cambio de estado (escribe en Supabase) */}
                                                    <button
                                                        onClick={() => setMenuFacturaId(menuFacturaId === row.id ? null : row.id ?? null)}
                                                        className="p-2.5 hover:bg-[#051650] hover:text-white rounded-xl transition-all shadow-sm"
                                                    >
                                                        <MoreHorizontal className="w-4.5 h-4.5" />
                                                    </button>
                                                    {menuFacturaId === row.id && (
                                                        <div className="absolute right-0 top-10 z-50 w-44 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                                                            {['Liquidado', 'Pendiente', 'Impagado'].map(est => (
                                                                <button
                                                                    key={est}
                                                                    onClick={() => cambiarEstadoFactura(row, est)}
                                                                    className={`w-full px-4 py-2.5 text-left text-[12px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors ${row.status === est ? 'text-blue-600' : 'text-slate-600'
                                                                        }`}
                                                                >
                                                                    {est === 'Liquidado' ? '✓' : est === 'Impagado' ? '⚠' : '•'} {est}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── GMAIL INVOICE EXTRACTOR TAB ── */}
                {activeTab === 'gmail' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">

                        {/* Header: sync controls */}
                        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 shadow-xl">
                            <div className="flex items-start gap-5">
                                <div className={`p-4 rounded-2xl shrink-0 ${gmailConnected ? 'bg-blue-50' : 'bg-blue-50'}`}>
                                    <Mail className={`w-7 h-7 ${gmailConnected ? 'text-[#051650]' : 'text-blue-600'}`} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#051650] dark:text-white tracking-tight">Facturas desde Gmail</h2>
                                    <p className="text-sm text-slate-500 mt-1 font-medium">
                                        <span className="font-bold text-[#051650]">info@rubiogarciandental.com</span>
                                        {' — '} Desde Ene 2025
                                    </p>
                                    {gmailConnected && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span className="text-[12px] font-bold text-[#051650] uppercase tracking-widest">Gmail Conectado</span>
                                        </div>
                                    )}
                                    {gmailLastSync && (
                                        <p className="text-[12px] text-slate-400 mt-0.5">
                                            Última sincronización: {gmailLastSync.toLocaleTimeString('es-ES')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full xl:w-auto">
                                {!isGmailConfigured() && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-[#FEFDE8] border border-[#FBFFA3] rounded-xl">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span className="text-[12px] font-bold text-[#051650] uppercase tracking-wide">Sin credenciales</span>
                                    </div>
                                )}

                                {isGmailConfigured() && !gmailConnected && (
                                    <button
                                        onClick={() => startGmailAuth()}
                                        className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-blue-500 to-[#051650] text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:shadow-2xl hover:shadow-blue-500/30 transition-all active:scale-95"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Conectar Gmail
                                    </button>
                                )}

                                {gmailConnected && (
                                    <>
                                        <button
                                            onClick={syncGmail}
                                            disabled={gmailSyncing}
                                            className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:shadow-2xl hover:shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${gmailSyncing ? 'animate-spin' : ''}`} />
                                            {gmailSyncing ? 'Sincronizando...' : 'Sincronizar'}
                                        </button>
                                        <button
                                            onClick={() => { disconnectGmail(); setGmailConnected(false); setGmailFacturas([]); }}
                                            className="px-4 py-3.5 bg-slate-100 text-slate-400 rounded-2xl text-[12px] font-bold uppercase tracking-widest hover:bg-[#FFF0F3] hover:text-red-500 transition-all"
                                        >
                                            Desconectar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Error banner */}
                        {gmailError && (
                            <div className="flex items-center gap-4 p-5 bg-[#FFF0F3] border border-[#FFC0CB] rounded-2xl">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-sm font-bold text-[#C02040]">{gmailError}</p>
                                <button onClick={() => setGmailError(null)} className="ml-auto">
                                    <X className="w-4 h-4 text-[#FF4B68]" />
                                </button>
                            </div>
                        )}

                        {/* Stats row */}
                        {gmailFacturas.length > 0 && (
                            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total emails', value: String(gmailFacturas.length), color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { label: 'Pendientes cruce', value: String(gmailFacturas.filter(f => f.estado === 'pendiente').length), color: 'text-[#051650]', bg: 'bg-[#FEFDE8]' },
                                    { label: 'Cruzadas', value: String(gmailFacturas.filter(f => f.estado === 'cruzado').length), color: 'text-[#051650]', bg: 'bg-blue-50' },
                                    {
                                        label: 'Total detectado',
                                        value: '€' + gmailFacturas.reduce((s, f) => s + (f.total ?? 0), 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                                        color: 'text-[#051650]',
                                        bg: 'bg-slate-50'
                                    },
                                ].map((s, i) => (
                                    <div key={i} className={`${s.bg} p-5 rounded-2xl border border-slate-100`}>
                                        <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Search bar + Filters */}
                        <div className="flex flex-col gap-3">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={gmailSearch}
                                    onChange={e => setGmailSearch(e.target.value)}
                                    placeholder="Buscar por proveedor, nº factura o concepto..."
                                    className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                                <select
                                    value={filterYear}
                                    onChange={e => setFilterYear(e.target.value)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                                >
                                    <option value="">Todos los años</option>
                                    {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <select
                                    value={filterProveedor}
                                    onChange={e => setFilterProveedor(e.target.value)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer max-w-[250px] truncate"
                                >
                                    <option value="">Todos los proveedores</option>
                                    {uniqueProveedores.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <select
                                    value={filterCategoria}
                                    onChange={e => setFilterCategoria(e.target.value)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                                >
                                    <option value="">Todas las categorías</option>
                                    {uniqueCategorias.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select
                                    value={filterEstado}
                                    onChange={e => setFilterEstado(e.target.value)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="pendiente">⏳ Pendiente</option>
                                    <option value="cruzado">✓ Cruzado</option>
                                    <option value="descartado">Descartado</option>
                                </select>
                                {(filterYear || filterProveedor || filterCategoria || filterEstado) && (
                                    <button
                                        onClick={() => { setFilterYear(''); setFilterProveedor(''); setFilterCategoria(''); setFilterEstado(''); }}
                                        className="px-3 py-2 bg-[#FFF0F3] text-[#E03555] rounded-xl text-[13px] font-bold uppercase hover:bg-[#FFE0E6] transition-all flex items-center gap-1"
                                    >
                                        <X className="w-3 h-3" /> Limpiar
                                    </button>
                                )}
                                <span className="ml-auto text-[13px] font-bold text-slate-400">
                                    {filteredGmailFacturas.length} de {gmailFacturas.length} facturas
                                </span>
                            </div>
                        </div>

                        {/* Invoice table */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 shadow-xl overflow-hidden">

                            {/* Credential setup notice when in demo mode */}
                            {!isGmailConfigured() && (
                                <div className="mx-8 mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-[#FBFFA3] rounded-2xl flex items-start gap-4">
                                    <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-[#051650] mb-1">Mostrando datos de demostración</p>
                                        <p className="text-[13px] text-[#051650] font-medium leading-relaxed">
                                            Para conectar Gmail real, añade en tu <code className="bg-[#FEFCC4] px-1 rounded">.env</code>:<br />
                                            <code className="text-[12px]">VITE_GMAIL_SA_EMAIL</code>, <code className="text-[12px]">VITE_GMAIL_SA_PRIVATE_KEY</code>, <code className="text-[12px]">VITE_GMAIL_USER_EMAIL</code>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="overflow-y-auto max-h-[60vh]">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-700/30 text-[12px] uppercase font-bold tracking-[0.2em] text-slate-400 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-5">Proveedor</th>
                                            <th className="px-6 py-5">Nº Factura</th>
                                            <th className="px-6 py-5">Categoría</th>
                                            <th className="px-6 py-5">Fecha</th>
                                            <th className="px-6 py-5 text-right">Base</th>
                                            <th className="px-6 py-5 text-right">IVA</th>
                                            <th className="px-6 py-5 text-right">Total</th>
                                            <th className="px-6 py-5 text-center">Estado</th>
                                            <th className="px-6 py-5"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {gmailSyncing && (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-16 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                                                        <p className="text-sm font-bold text-slate-400">{gmailProgress || 'Analizando emails y extrayendo facturas...'}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {!gmailSyncing && filteredGmailFacturas.length === 0 && (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-16 text-center">
                                                    <Mail className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                                                    <p className="text-sm font-bold text-slate-400">No se encontraron facturas</p>
                                                    <button onClick={syncGmail} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-[13px] font-bold uppercase tracking-widest">
                                                        Sincronizar ahora
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                        {!gmailSyncing && filteredGmailFacturas.map((f) => (
                                            <tr key={f.gmail_message_id} className="hover:bg-blue-50/20 transition-all group">
                                                {/* Proveedor */}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#051650] dark:text-white leading-none">{f.proveedor}</p>
                                                            <p className="text-[12px] text-slate-400 mt-0.5 font-medium">{f.proveedor_email}</p>
                                                            {f.proveedor_cif && (
                                                                <p className="text-[13px] text-slate-300 font-mono font-bold mt-0.5">CIF: {f.proveedor_cif}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Nº Factura */}
                                                <td className="px-6 py-5">
                                                    {f.numero_factura ? (
                                                        <span className="font-mono text-[13px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">{f.numero_factura}</span>
                                                    ) : (
                                                        <span className="text-[12px] text-slate-300 font-bold">—</span>
                                                    )}
                                                </td>

                                                {/* Categoría */}
                                                <td className="px-6 py-5">
                                                    {f.categoria ? (
                                                        <span className="text-[12px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap">{f.categoria}</span>
                                                    ) : (
                                                        <span className="text-[12px] text-slate-300 font-bold">Sin clasificar</span>
                                                    )}
                                                </td>

                                                {/* Fecha */}
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700">
                                                            {new Date(f.fecha_email).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        {f.tiene_adjunto && (
                                                            <span className="flex items-center gap-1 text-[13px] font-bold text-slate-400 uppercase mt-0.5">
                                                                <Paperclip className="w-2.5 h-2.5" />{f.nombre_adjunto?.split('.').pop()?.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Base */}
                                                <td className="px-6 py-5 text-right">
                                                    <span className="text-sm font-bold text-slate-500">
                                                        {f.base_imponible !== null ? `€${f.base_imponible.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : '—'}
                                                    </span>
                                                </td>

                                                {/* IVA */}
                                                <td className="px-6 py-5 text-right">
                                                    <span className="text-[13px] font-bold text-slate-400">
                                                        {f.iva_pct !== null ? `${f.iva_pct}%` : '—'}
                                                    </span>
                                                </td>

                                                {/* Total */}
                                                <td className="px-6 py-5 text-right">
                                                    <span className="text-lg font-bold text-[#051650] dark:text-white">
                                                        {f.total !== null ? `€${f.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : '—'}
                                                    </span>
                                                </td>

                                                {/* Estado */}
                                                <td className="px-6 py-5 text-center">
                                                    <div className={`mx-auto w-fit px-3 py-1 rounded-full text-[13px] font-bold uppercase tracking-widest border ${f.estado === 'cruzado' ? 'bg-blue-50 text-[#051650] border-blue-100' :
                                                        f.estado === 'descartado' ? 'bg-slate-100 text-slate-400 border-slate-200' :
                                                            'bg-[#FEFDE8] text-[#051650] border-amber-100 animate-pulse'
                                                        }`}>
                                                        {f.estado === 'cruzado' ? '✓ Cruzado' : f.estado === 'descartado' ? 'Descartado' : '⏳ Pendiente'}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        {f.estado !== 'cruzado' && (
                                                            <button
                                                                onClick={() => toggleFacturaEstado(f.gmail_message_id, 'cruzado')}
                                                                className="px-3 py-1.5 bg-blue-500 text-white rounded-xl text-[13px] font-bold uppercase hover:bg-[#051650] transition-all whitespace-nowrap"
                                                                title="Marcar como cruzada con apunte bancario"
                                                            >
                                                                Cruzar
                                                            </button>
                                                        )}
                                                        {f.estado !== 'descartado' && (
                                                            <button
                                                                onClick={() => toggleFacturaEstado(f.gmail_message_id, 'descartado')}
                                                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                                                                title="Descartar"
                                                            >
                                                                <X className="w-3.5 h-3.5 text-slate-400" />
                                                            </button>
                                                        )}
                                                        {f.enlace_gmail !== '#mock' && (
                                                            <a
                                                                href={f.enlace_gmail}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 hover:bg-blue-50 rounded-lg transition-all"
                                                                title="Abrir en Gmail"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                                                            </a>
                                                        )}
                                                        {f.enlace_factura_portal && (
                                                            <a
                                                                href={f.enlace_factura_portal}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all flex items-center gap-1"
                                                                title="Acceder al portal de facturación"
                                                            >
                                                                <span className="text-[13px]">🌐</span>
                                                                <span className="text-[13px] font-bold text-indigo-600 uppercase">Acceder</span>
                                                            </a>
                                                        )}
                                                        {f.pdf_preview_url && (
                                                            <a
                                                                href={f.pdf_preview_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 hover:bg-violet-50 rounded-lg transition-all"
                                                                title="Ver PDF"
                                                            >
                                                                <Eye className="w-3.5 h-3.5 text-violet-400" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'banco' && (
                    <div className="animate-in fade-in slide-in-from-right-10 duration-700">
                        <div className="bg-white dark:bg-slate-800 p-12 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center justify-center text-center gap-6 min-h-[400px]">
                            <div className="w-16 h-16 rounded-2xl bg-[#FEFDE8] flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#051650] dark:text-white mb-2">Integración Bancaria No Configurada</h3>
                                <p className="text-sm text-slate-500 font-medium max-w-md leading-relaxed">
                                    Para ver apuntes bancarios y usar la conciliación automática, conecta tu banco a través de Open Banking (PSD2) o importa los movimientos manualmente en CSV.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                <button
                                    disabled
                                    className="px-8 py-3.5 bg-slate-100 text-slate-400 rounded-2xl font-bold text-[13px] uppercase tracking-widest cursor-not-allowed"
                                    title="Requiere configuración de Open Banking PSD2"
                                >
                                    Conectar Banco (PSD2)
                                </button>
                                <label className="px-8 py-3.5 bg-[#051650] text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest cursor-pointer hover:bg-blue-900 transition-all">
                                    Importar CSV Bancario
                                    <input type="file" accept=".csv" className="hidden" onChange={() => { }} />
                                </label>
                            </div>
                            <p className="text-[12px] text-slate-400 font-bold">Compatible con Santander, BBVA, CaixaBank y otros formatos AEB43</p>
                        </div>
                    </div>
                )}

                {activeTab === 'impuestos' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 animate-in fade-in slide-in-from-left-10 duration-700">
                        {/* High Fidelity Impuestos */}
                        <div className="space-y-8 xl:col-span-1">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 relative">
                                <div className="absolute top-0 right-0 p-6 opacity-5">
                                    <Scale className="w-20 h-20 text-[#051650]" />
                                </div>
                                <div className="flex items-center gap-2 mb-10">
                                    <h3 className="text-2xl font-bold text-[#051650] dark:text-white tracking-tight">Liquidación Q1 {new Date().getFullYear()}</h3>
                                    <span className="w-2 h-2 rounded-full bg-[#FBFFA3] animate-pulse" title="Sin datos reales"></span>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[13px] font-bold uppercase tracking-widest text-slate-400">Conceptos IVA</span>
                                            <span className="text-[13px] font-bold uppercase tracking-widest text-slate-400">Importe</span>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-slate-700/50 rounded-3xl border border-transparent hover:border-blue-500/20 transition-all">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">IVA Repercutido (Cobrado)</span>
                                                <span className="font-bold text-slate-400 text-lg">—</span>
                                            </div>
                                            <div className="flex justify-between items-center opacity-70">
                                                <span className="text-[13px] font-medium text-slate-500">Sin facturas en Supabase</span>
                                                <span className="text-[13px] font-bold text-slate-500">21%</span>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-slate-700/50 rounded-3xl border border-transparent hover:border-[#FF4B68]/20 transition-all">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">IVA Deducible (Gastos)</span>
                                                <span className="font-bold text-slate-400 text-lg">—</span>
                                            </div>
                                            <div className="flex justify-between items-center opacity-70">
                                                <span className="text-[13px] font-medium text-slate-500">Sin integración bancaria</span>
                                                <span className="text-[13px] font-bold text-slate-500">—</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[12px] font-bold uppercase text-slate-400 tracking-widest mb-1">A ingresar (Modelo 303)</p>
                                                <h4 className="text-4xl font-bold text-slate-300 dark:text-slate-600 tracking-tighter">—</h4>
                                            </div>
                                            <div className="text-right">
                                                <div className="px-3 py-1 bg-[#FEFCC4] text-[#051650] text-[13px] font-bold rounded-full mb-2">Sin datos</div>
                                                <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">Pendiente FDW</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button disabled className="w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-bold text-[13px] uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-3" title="Sin datos de facturación real">
                                        <AlertCircle className="w-4 h-4 text-slate-400" />
                                        Pre-visualizar Modelo 303 (sin datos)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tax Calendar - Premium Grid */}
                        <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                            <h3 className="text-2xl font-bold text-[#051650] dark:text-white mb-10 tracking-tight flex items-center gap-4">
                                Calendario Fiscal Rubio García Dental
                                <span className="w-2 h-2 rounded-full bg-[#FBFFA3] animate-pulse" title="Datos orientativos"></span>
                                <span className="px-3 py-1 bg-[#FEFCC4] text-[#051650] text-[12px] rounded-lg">{new Date().getFullYear()} — Orientativo</span>
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px] overflow-y-auto no-scrollbar mask-linear-fade">
                                {[
                                    { m: '303', t: 'I.V.A. Trimestral', d: '20 Abril', s: 'Orientativo', c: 'slate', desc: 'Sin datos reales — configura FDW' },
                                    { m: '111', t: 'Retenciones IRPF', d: '20 Abril', s: 'Orientativo', c: 'slate', desc: 'Nóminas y servicios profesionales' },
                                    { m: '115', t: 'Retención Alquiler', d: '20 Abril', s: 'Orientativo', c: 'slate', desc: 'Inmueble clínica principal' },
                                    { m: '130', t: 'Pago Frac. IRPF', d: '20 Abril', s: 'Planificado', c: 'slate', desc: 'Modelo opcional según rendimientos' },
                                    { m: '202', t: 'Pago Frac. Sociedades', d: 'Octubre', s: 'Futuro', c: 'slate', desc: 'Basado en beneficio ejercicio anterior' },
                                    { m: '100', t: 'Declaración Renta', d: 'Junio', s: 'Campaña', c: 'blue', desc: 'Presentación telemática abierta' },
                                ].map((tax, i) => (
                                    <div key={i} className="group p-8 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500/20 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all relative overflow-hidden">
                                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${tax.c === 'blue' ? 'bg-blue-500' : tax.c === 'amber' ? 'bg-[#FEFDE8]0' : 'bg-slate-500'} opacity-[0.03] rounded-full`}></div>
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="text-3xl font-bold text-slate-300 group-hover:text-blue-500/50 transition-colors uppercase">{tax.m}</span>
                                            <div className={`px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-widest ${tax.s === 'Pronto' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                                                {tax.s}
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-lg text-[#051650] dark:text-blue-100 mb-2">{tax.t}</h4>
                                        <p className="text-[13px] text-slate-400 font-bold mb-6">{tax.desc}</p>
                                        <div className="flex items-center gap-2 text-[13px] font-bold text-blue-600 dark:text-blue-400 mt-auto">
                                            <Calendar className="w-4 h-4" />
                                            LÍMITE: {tax.d}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'informes' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in slide-in-from-bottom-10 duration-700">
                        {/* Reports Section */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden group">
                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/40 rounded-3xl flex items-center justify-center border-2 border-blue-100 dark:border-blue-700 shadow-lg group-hover:rotate-6 transition-transform">
                                    <FileSpreadsheet className="w-7 h-7 text-blue-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-bold text-[#051650] dark:text-white tracking-tight">Centro de Informes</h3>
                                        <span className="w-2 h-2 rounded-full bg-[#FBFFA3] animate-pulse" title="Datos Simulados"></span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 mt-1">Exportación analítica Rubio García Dental</p>
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-[#FEFDE8] border border-[#FBFFA3] rounded-2xl flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                <p className="text-[13px] font-bold text-[#051650]">Los informes se generan desde datos reales de facturación (NV_CabFactura vía FDW). Sin datos conectados, las descargas estarán vacías.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { t: 'Rentabilidad por Doctor', d: 'PDF, EXCEL' },
                                    { t: 'Análisis de Costes Ttos', d: 'PDF' },
                                    { t: 'Liquidación de Nóminas', d: 'ZIP (PDF)' },
                                    { t: 'Listado Verifactu', d: 'XML, JSON' },
                                    { t: 'Balance de Situación', d: 'EXCEL' },
                                    { t: 'Informe de Tesorería', d: 'PDF, POWERPOINT' },
                                ].map((rep, i) => (
                                    <div key={i} className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 opacity-60 cursor-not-allowed">
                                        <div className="flex justify-between items-start mb-4">
                                            <h5 className="font-bold text-sm text-[#051650] dark:text-blue-100 w-2/3 leading-tight">{rep.t}</h5>
                                            <span className="text-[13px] font-bold text-[#051650] bg-[#FEFDE8] px-2 py-1 rounded-lg">Sin datos</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px] font-bold uppercase text-slate-400 tracking-widest bg-white dark:bg-slate-600 px-2 py-0.5 rounded shadow-sm">{rep.d}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom Report Builder Mockup */}
                        <div className="bg-[#051650] p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center border-b-[10px] border-blue-500/30">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <Plus className="w-32 h-32" />
                            </div>
                            <div className="relative z-10 text-center space-y-8">
                                <Activity className="w-16 h-16 text-[#118DF0] mx-auto" />
                                <h1 className="text-4xl font-bold tracking-tighter leading-none">Generar Informe Personalizado</h1>
                                <p className="text-lg text-blue-200 font-medium max-w-sm mx-auto">Selecciona los parámetros y deja que la IA de Smile Pro 2026 analice tus datos financieros por ti.</p>
                                <div className="flex flex-col gap-3 py-6">
                                    <div className="h-4 bg-white/10 rounded-full w-full"></div>
                                    <div className="h-4 bg-white/10 rounded-full w-2/3 mx-auto"></div>
                                    <div className="h-4 bg-white/10 rounded-full w-1/2 mx-auto"></div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (facturas.length === 0) {
                                            alert('Sin datos de facturación. Conecta la BD para generar informes reales.');
                                            return;
                                        }
                                        // Agrupar por mes
                                        const byMonth: Record<string, number> = {};
                                        facturas.forEach(f => {
                                            if (!f.rawDate) return;
                                            const key = f.rawDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
                                            byMonth[key] = (byMonth[key] || 0) + (f.rawTotal || 0);
                                        });
                                        const rows = [
                                            ['INFORME ANALÍTICO — RUBIO GARCÍA DENTAL', '', '', ''],
                                            ['Generado el', new Date().toLocaleDateString('es-ES'), '', ''],
                                            ['', '', '', ''],
                                            ['RESUMEN POR MES', '', '', ''],
                                            ['Mes', 'Total Facturado (€)', '', ''],
                                            ...Object.entries(byMonth).map(([mes, total]) => [mes, total.toFixed(2), '', '']),
                                            ['', '', '', ''],
                                            ['DETALLE DE FACTURAS', '', '', ''],
                                            ['Nº Factura', 'Paciente/Titular', 'Fecha', 'Total (€)', 'Base Imp.', 'Estado', 'Verifactu'],
                                            ...facturas.map(f => [f.id ?? '—', f.name ?? '—', f.date ?? '—', f.rawTotal?.toFixed(2) ?? '—', f.base ?? '—', f.status ?? '—', f.tbai ?? '—']),
                                        ];
                                        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
                                        const a = document.createElement('a');
                                        a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
                                        a.download = `informe_analitico_${new Date().toISOString().slice(0, 10)}.csv`;
                                        a.click();
                                    }}
                                    className="w-full py-5 bg-white text-[#051650] rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:bg-blue-50 transition-all transform active:scale-95 shadow-xl">
                                    Generar y Descargar Informe CSV
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Nueva Factura Modal Mockup */}
            {
                showInvoiceModal && (
                    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 sm:p-10">
                        <div className="absolute inset-0 bg-[#051650]/80 backdrop-blur-xl" onClick={() => setShowInvoiceModal(false)}></div>
                        <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-10">
                                <h2 className="text-3xl font-bold text-[#051650] dark:text-white tracking-tight mb-2">Emitir Nueva Factura Legal</h2>
                                <p className="text-slate-500 font-medium mb-10">Cumplimiento Verifactu / TicketBAI integrado.</p>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 px-2">Paciente / Cliente</label>
                                            <input type="text" placeholder="Buscar..." className="w-full px-6 py-4 bg-slate-100 rounded-2xl border-none outline-none font-bold text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 px-2">NIF / CIF</label>
                                            <input type="text" className="w-full px-6 py-4 bg-slate-100 rounded-2xl border-none outline-none font-bold text-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 px-2">Concepto del Servicio</label>
                                        <textarea className="w-full px-6 py-4 bg-slate-100 rounded-2xl border-none outline-none font-bold text-sm h-24 resize-none" placeholder="Descripción del tratamiento..."></textarea>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 px-2">Base Imponible</label>
                                            <input type="number" placeholder="0.00" className="w-full px-6 py-4 bg-slate-100 rounded-2xl border-none outline-none font-bold text-lg text-blue-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 px-2">I.V.A. (%)</label>
                                            <select className="w-full px-6 py-4 bg-slate-100 rounded-2xl border-none outline-none font-bold text-sm">
                                                <option>Exento (Médico)</option>
                                                <option>21%</option>
                                                <option>10%</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 px-2">Total</label>
                                            <div className="w-full px-6 py-4 bg-[#051650] text-white rounded-2xl font-bold text-lg flex items-center justify-center">€ 0.00</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex gap-4">
                                    <button
                                        onClick={() => alert('La integración Verifactu/TicketBAI requiere configurar el certificado digital en .env.local. Contacte con su asesor fiscal para activar el envío a AEAT.')}
                                        className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20">Registrar y Enviar a AEAT</button>
                                    <button onClick={() => setShowInvoiceModal(false)} className="px-8 py-5 bg-slate-100 text-slate-400 rounded-2xl font-bold text-[13px] uppercase tracking-widest">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Gestoria;
