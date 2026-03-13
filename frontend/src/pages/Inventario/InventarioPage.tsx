import React, { useState, useEffect } from 'react';
import {
    Package, AlertTriangle, Calendar, TrendingDown, Search,
    Download, Cpu, ChevronRight, Plus, X, History,
    Filter, RefreshCw, Box
} from 'lucide-react';
import { inventoryApi, Product, Stats, PreOrderItem, Movement } from '../../services/inventory.api';

/* ═══ INVENTARIO — SmileStudio ════════════════════════════════════════════════ */

type Tab = 'stock' | 'trazabilidad' | 'orders';

export default function InventarioPage() {
    const [tab, setTab] = useState<Tab>('stock');
    const [products, setProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('');

    // Modales
    const [trazasItem, setTrazasItem] = useState<Product | null>(null);
    const [reponerItem, setReponerItem] = useState<Product | null>(null);
    const [newProductModal, setNewProductModal] = useState(false);

    // Pre-pedido IA
    const [preOrder, setPreOrder] = useState<{ critical: PreOrderItem[]; generatedAt: string } | null>(null);
    const [preOrderLoading, setPreOrderLoading] = useState(false);

    // Trazabilidad
    const [movements, setMovements] = useState<Movement[]>([]);
    const [movementsLoading, setMovementsLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (tab === 'trazabilidad' && movements.length === 0) loadMovements();
    }, [tab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, s] = await Promise.all([inventoryApi.getProducts(), inventoryApi.getStats()]);
            setProducts(p);
            setStats(s);
        } catch { /* fallback silencioso */ }
        finally { setLoading(false); }
    };

    const loadMovements = async () => {
        setMovementsLoading(true);
        try {
            const data = await inventoryApi.getMovements();
            setMovements(data);
        } catch { }
        finally { setMovementsLoading(false); }
    };

    const handleGeneratePreOrder = async () => {
        setPreOrderLoading(true);
        try {
            const data = await inventoryApi.getPreOrder();
            setPreOrder(data);
        } catch { }
        finally { setPreOrderLoading(false); }
    };

    const exportCSV = () => {
        const rows = [
            ['Artículo', 'SKU', 'Lote', 'Caducidad', 'Cantidad', 'Estado', 'Ubicación'],
            ...products.flatMap(p =>
                p.lots.map(l => [p.name, p.sku, l.lotNumber, l.expiryDate ?? '—', l.quantity, l.status, l.location])
            )
        ];
        const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trazabilidad_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const categories = [...new Set(products.map(p => p.category))];
    const filtered = products.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
        const matchCat = !catFilter || p.category === catFilter;
        return matchSearch && matchCat;
    });

    return (
        <div style={{ padding: '32px 40px', maxWidth: 1400 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.15em' }}>GESTIÓN DE ALMACÉN · IA LOGISTICS</span>
                    <h1 style={{ fontSize: 22, fontWeight: 900, color: '#051650', margin: '4px 0 0' }}>Inventario Clínica</h1>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RefreshCw size={14} /> Actualizar
                    </button>
                    <button className="btn-primary" onClick={() => setNewProductModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={14} /> Nuevo artículo
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
                <KpiCard label="ARTÍCULOS" value={stats?.totalProducts ?? 0} sub="Referencias activas" icon={<Package size={18} />} color="#118DF0" />
                <KpiCard label="STOCK CRÍTICO" value={stats?.lowStockCount ?? 0} sub="Por debajo del mínimo" icon={<AlertTriangle size={18} />} color="#f59e0b" alert={!!stats?.lowStockCount} />
                <KpiCard label="CADUCIDAD PRÓXIMA" value={stats?.expiringSoonCount ?? 0} sub="Lotes < 90 días" icon={<Calendar size={18} />} color="#FF4B68" alert={!!stats?.expiringSoonCount} />
                <KpiCard label="TOTAL LOTES" value={stats?.totalLots ?? 0} sub="Registros de stock" icon={<TrendingDown size={18} />} color="#051650" />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#f8fafc', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content', border: '1px solid #e2e8f0' }}>
                {(['stock', 'trazabilidad', 'orders'] as Tab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                            background: tab === t ? '#051650' : 'transparent',
                            color: tab === t ? '#fff' : '#94a3b8',
                            transition: 'all 0.15s',
                        }}
                    >
                        {t === 'stock' ? 'Stock Visual' : t === 'trazabilidad' ? 'Trazabilidad' : 'Smart Orders (IA)'}
                    </button>
                ))}
            </div>

            {/* Tab: Stock Visual */}
            {tab === 'stock' && (
                <>
                    {/* Filtros */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', flex: 1, maxWidth: 320 }}>
                            <Search size={14} style={{ color: '#94a3b8' }} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar artículo o SKU..."
                                style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', background: 'transparent', width: '100%' }}
                            />
                            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={12} /></button>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px' }}>
                            <Filter size={14} style={{ color: '#94a3b8' }} />
                            <select
                                value={catFilter}
                                onChange={e => setCatFilter(e.target.value)}
                                style={{ border: 'none', outline: 'none', fontSize: 12, fontWeight: 700, color: '#334155', background: 'transparent', cursor: 'pointer' }}
                            >
                                <option value="">Todas las categorías</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <LoadingState />
                    ) : filtered.length === 0 ? (
                        <EmptyState label="Sin artículos en inventario" sub="Añade artículos con el botón «Nuevo artículo»" />
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                            {filtered.map(p => <ProductCard key={p.id} product={p} onTrazas={setTrazasItem} onReponer={setReponerItem} />)}
                        </div>
                    )}
                </>
            )}

            {/* Tab: Trazabilidad */}
            {tab === 'trazabilidad' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: 13, fontWeight: 900, color: '#051650' }}>REGISTRO DE TRAZABILIDAD FEFO</h3>
                            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>Movimientos de stock ordenados por fecha · AEMPS compliant</p>
                        </div>
                        <button className="btn-secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <Download size={13} /> Exportar CSV
                        </button>
                    </div>
                    {movementsLoading ? <LoadingState /> : movements.length === 0 ? (
                        <EmptyState label="Sin movimientos registrados" sub="Los movimientos aparecen al reponer o ajustar stock" />
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    {['Artículo', 'SKU', 'Tipo', 'Cantidad', 'Motivo', 'Fecha'].map(h => (
                                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map(m => (
                                    <tr key={m.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                        <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: '#051650' }}>{m.product.name}</td>
                                        <td style={{ padding: '12px 20px', fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{m.product.sku}</td>
                                        <td style={{ padding: '12px 20px' }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 6,
                                                background: m.type === 'in' ? '#dcfce7' : m.type === 'out' ? '#fee2e2' : '#fef9c3',
                                                color: m.type === 'in' ? '#16a34a' : m.type === 'out' ? '#dc2626' : '#92400e',
                                            }}>
                                                {m.type === 'in' ? 'ENTRADA' : m.type === 'out' ? 'SALIDA' : 'AJUSTE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 800, color: m.type === 'out' ? '#dc2626' : '#16a34a' }}>
                                            {m.type === 'out' ? '-' : '+'}{m.quantity}
                                        </td>
                                        <td style={{ padding: '12px 20px', fontSize: 12, color: '#64748b' }}>{m.reason ?? '—'}</td>
                                        <td style={{ padding: '12px 20px', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                                            {new Date(m.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Tab: Smart Orders */}
            {tab === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '40px 0' }}>
                    <div style={{ width: 96, height: 96, borderRadius: 28, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', position: 'relative' }}>
                        <Cpu size={44} style={{ color: '#118DF0' }} />
                        <div style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#118DF0', border: '3px solid #fff', boxShadow: '0 0 8px rgba(17,141,240,0.5)' }} />
                    </div>
                    <div style={{ textAlign: 'center', maxWidth: 520 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#051650', marginBottom: 12 }}>IA DENTAL <span style={{ color: '#118DF0' }}>ORDER ENGINE</span></h2>
                        <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, lineHeight: 1.7 }}>
                            Analiza el stock actual y genera una propuesta de pedido optimizada para todos los artículos por debajo del mínimo de reorden.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#118DF0', display: 'inline-block' }} /> MOTOR GROQ LLAMA 3.3
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> FEFO ACTIVO
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleGeneratePreOrder}
                        disabled={preOrderLoading}
                        style={{ background: '#051650', color: '#fff', fontWeight: 900, fontSize: 14, padding: '16px 36px', borderRadius: 16, border: 'none', cursor: preOrderLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 10px 24px rgba(5,22,80,0.2)', opacity: preOrderLoading ? 0.7 : 1 }}
                    >
                        {preOrderLoading ? 'Analizando stock...' : 'Generar Pre-Pedido Inteligente'}
                        <ChevronRight size={18} />
                    </button>

                    {preOrder && (
                        <div className="card" style={{ width: '100%', maxWidth: 720, padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ fontSize: 12, fontWeight: 900, color: '#051650', letterSpacing: '0.08em' }}>PRE-PEDIDO GENERADO</h4>
                                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                                        {new Date(preOrder.generatedAt).toLocaleString('es-ES')}
                                    </p>
                                </div>
                                {preOrder.critical.length > 0 && (
                                    <span style={{ fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 6, background: '#fee2e2', color: '#dc2626' }}>
                                        {preOrder.critical.length} ARTÍCULOS CRÍTICOS
                                    </span>
                                )}
                            </div>
                            {preOrder.critical.length === 0 ? (
                                <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                                    <p style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>✓ Stock en orden — No hay artículos críticos</p>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            {['Artículo', 'SKU', 'Stock actual', 'Mínimo', 'Pedir'].map(h => (
                                                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preOrder.critical.map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: '#051650' }}>{item.name}</td>
                                                <td style={{ padding: '12px 20px', fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{item.sku}</td>
                                                <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 900, color: '#dc2626' }}>{item.stockActual}</td>
                                                <td style={{ padding: '12px 20px', fontSize: 13, color: '#64748b' }}>{item.minReorder}</td>
                                                <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 900, color: '#118DF0' }}>{item.suggested}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal: Trazas del artículo */}
            {trazasItem && (
                <Modal onClose={() => setTrazasItem(null)} title={trazasItem.name} sub="Lotes FEFO ordenados por fecha de caducidad">
                    {trazasItem.lots.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Sin lotes registrados para este artículo.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    {['Lote', 'Caducidad', 'Uds.', 'Estado', 'Ubicación'].map(h => (
                                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {trazasItem.lots.map(l => {
                                    const expiring = l.expiryDate && new Date(l.expiryDate) < new Date(Date.now() + 90 * 864e5);
                                    return (
                                        <tr key={l.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#051650' }}>{l.lotNumber}</td>
                                            <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: expiring ? 900 : 600, color: expiring ? '#dc2626' : '#64748b' }}>{l.expiryDate ?? '—'}</td>
                                            <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 900, color: '#051650' }}>{l.quantity}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 6, background: '#e0f2fe', color: '#0369a1' }}>{l.status}</span>
                                            </td>
                                            <td style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8' }}>{l.location}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </Modal>
            )}

            {/* Modal: Reponer stock */}
            {reponerItem && (
                <ReponerModal
                    product={reponerItem}
                    onClose={() => setReponerItem(null)}
                    onSave={async (lotNumber, qty, expiryDate) => {
                        await inventoryApi.addLot({ productId: reponerItem.id, lotNumber, quantity: qty, expiryDate: expiryDate || undefined });
                        await loadData();
                        setReponerItem(null);
                    }}
                />
            )}

            {/* Modal: Nuevo artículo */}
            {newProductModal && (
                <NewProductModal
                    onClose={() => setNewProductModal(false)}
                    onSave={async (data) => {
                        await inventoryApi.createProduct(data);
                        await loadData();
                        setNewProductModal(false);
                    }}
                />
            )}
        </div>
    );
}

/* ── Subcomponentes ─────────────────────────────────────────────────────────── */

function KpiCard({ label, value, sub, icon, color, alert }: { label: string; value: number; sub: string; icon: React.ReactNode; color: string; alert?: boolean }) {
    return (
        <div className="card" style={{ padding: '20px 24px', border: alert && value > 0 ? `1.5px solid ${color}30` : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color }}>{icon}</span>
                {alert && value > 0 && <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'block', marginTop: 4, boxShadow: `0 0 6px ${color}` }} />}
            </div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.12em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: alert && value > 0 ? color : '#051650', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{sub}</div>
        </div>
    );
}

function ProductCard({ product: p, onTrazas, onReponer }: { product: Product; onTrazas: (p: Product) => void; onReponer: (p: Product) => void }) {
    const nextLot = p.lots[0];
    const expiringSoon = nextLot?.expiryDate && new Date(nextLot.expiryDate) < new Date(Date.now() + 90 * 864e5);

    return (
        <div className="card" style={{ padding: 20, border: p.isLowStock ? '1.5px solid #fca5a5' : undefined, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: p.category === 'Implante' ? '#dbeafe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.category === 'Implante' ? <Package size={20} style={{ color: '#2563eb' }} /> : <Box size={20} style={{ color: '#94a3b8' }} />}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: p.isLowStock ? '#dc2626' : '#051650', lineHeight: 1 }}>{p.stockTotal}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>UDS</div>
                </div>
            </div>

            <div>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: '#051650', marginBottom: 4, lineHeight: 1.3 }}>{p.name}</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', color: '#64748b' }}>{p.sku}</span>
                    {p.isLowStock && <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#fee2e2', color: '#dc2626' }}>CRÍTICO</span>}
                    {expiringSoon && !p.isLowStock && <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#fef9c3', color: '#92400e' }}>CADUCA PRONTO</span>}
                </div>
            </div>

            {nextLot && (
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                        <span style={{ color: '#94a3b8' }}>Lote FEFO</span>
                        <span>{nextLot.lotNumber}</span>
                    </div>
                    {nextLot.expiryDate && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                            <span style={{ color: '#94a3b8' }}>Caduca</span>
                            <span style={{ color: expiringSoon ? '#dc2626' : undefined }}>{nextLot.expiryDate}</span>
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button onClick={() => onTrazas(p)} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11 }}>
                    <History size={13} /> Lotes
                </button>
                <button onClick={() => onReponer(p)} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11 }}>
                    <Plus size={13} /> Reponer
                </button>
            </div>
        </div>
    );
}

function Modal({ onClose, title, sub, children }: { onClose: () => void; title: string; sub?: string; children: React.ReactNode }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
            <div className="card" style={{ maxWidth: 560, width: '100%', padding: 28, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 900, color: '#051650' }}>{title}</h3>
                        {sub && <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{sub}</p>}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><X size={16} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

function ReponerModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (lot: string, qty: number, expiry: string) => Promise<void> }) {
    const [lot, setLot] = useState('');
    const [qty, setQty] = useState('');
    const [expiry, setExpiry] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!lot || !qty || Number(qty) <= 0) return;
        setSaving(true);
        try { await onSave(lot, Number(qty), expiry); }
        finally { setSaving(false); }
    };

    return (
        <Modal onClose={onClose} title={`Reponer: ${product.name}`} sub={`Stock actual: ${product.stockTotal} uds · Mínimo: ${product.minReorder}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Número de lote *">
                    <input style={fi} value={lot} onChange={e => setLot(e.target.value)} placeholder="Ej: LOT-2026-001" />
                </Field>
                <Field label="Cantidad a añadir *">
                    <input style={fi} type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} placeholder="Ej: 50" />
                </Field>
                <Field label="Fecha de caducidad">
                    <input style={fi} type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
                </Field>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                    <button onClick={handleSave} disabled={!lot || !qty || saving} className="btn-primary" style={{ flex: 1 }}>
                        {saving ? 'Guardando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function NewProductModal({ onClose, onSave }: { onClose: () => void; onSave: (d: { name: string; sku: string; category: string; minReorder: number }) => Promise<void> }) {
    const [form, setForm] = useState({ name: '', sku: '', category: 'Desechable', minReorder: 10 });
    const [saving, setSaving] = useState(false);
    const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        if (!form.name || !form.sku) return;
        setSaving(true);
        try { await onSave(form); }
        finally { setSaving(false); }
    };

    return (
        <Modal onClose={onClose} title="Nuevo artículo">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Nombre *"><input style={fi} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Guantes nitrilo M" /></Field>
                <Field label="SKU / Referencia *"><input style={fi} value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Ej: GLOV-NIT-M" /></Field>
                <Field label="Categoría">
                    <select style={fi} value={form.category} onChange={e => set('category', e.target.value)}>
                        {['Desechable', 'EPI', 'Implante', 'Farmacia', 'Material clínico', 'Quirúrgico'].map(c => <option key={c}>{c}</option>)}
                    </select>
                </Field>
                <Field label="Stock mínimo de reorden">
                    <input style={fi} type="number" min="1" value={form.minReorder} onChange={e => set('minReorder', Number(e.target.value))} />
                </Field>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                    <button onClick={handleSave} disabled={!form.name || !form.sku || saving} className="btn-primary" style={{ flex: 1 }}>
                        {saving ? 'Guardando...' : 'Crear artículo'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

const fi: React.CSSProperties = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#334155', outline: 'none', boxSizing: 'border-box', background: '#fff' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>{label}</label>
            {children}
        </div>
    );
}

function LoadingState() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, border: '2px solid #118DF0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>CARGANDO INVENTARIO...</p>
            </div>
        </div>
    );
}

function EmptyState({ label, sub }: { label: string; sub?: string }) {
    return (
        <div className="card" style={{ minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, borderStyle: 'dashed', background: 'rgba(248,250,252,0.5)' }}>
            <Box size={36} style={{ color: '#cbd5e1' }} />
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>{label}</p>
                {sub && <p style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, marginTop: 4 }}>{sub}</p>}
            </div>
        </div>
    );
}
