import { useState } from 'react';
import {
    Search, Bell, Settings, LogOut,
    Calendar, Users, Radio, MessageCircle, Brain, Package, FileText,
    LayoutGrid, Activity, Clock, ArrowUpRight,
    Stethoscope, FileCheck, CreditCard, ClipboardList, Monitor,
    Zap, GitBranch, MessageSquare, FileCode,
    BarChart3, Receipt, Landmark, Briefcase, ChevronRight,
    Plus, AlertTriangle, HelpCircle,
    ShoppingCart, PieChart, QrCode, BarChart2, BookOpen
} from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

/* ═══ Modules configuration ═══ */
const MODULES = [
    { id: 'clinica', label: 'CLÍNICA', icon: LayoutGrid, path: '/' },
    { id: 'agenda', label: 'AGENDA', icon: Calendar, path: '/agenda' },
    { id: 'pacientes', label: 'PACIENTES', icon: Users, path: '/pacientes' },
    { id: 'radiologia', label: 'RADIOLOGÍA', icon: Radio, path: '/radiologia' },
    { id: 'whatsapp', label: 'WHATSAPP', icon: MessageCircle, path: '/whatsapp' },
    { id: 'ia', label: 'IA & AUTOMATIZACIÓN', icon: Brain, path: '/ia' },
    { id: 'inventario', label: 'INVENTARIO', icon: Package, path: '/inventario' },
    { id: 'gestoria', label: 'GESTORÍA', icon: Briefcase, path: '/gestoria' },
];

const SIDEBAR_ITEMS: Record<string, any[]> = {
    clinica: [
        { id: 'grid', icon: LayoutGrid, label: 'Hoy en Clínica' },
        { id: 'activity', icon: Activity, label: 'Rendimiento' },
        { id: 'clock', icon: Clock, label: 'Historial' },
        { id: 'pulse', icon: ArrowUpRight, label: 'Métricas' },
    ],
    agenda: [
        { id: 'calendar', icon: Calendar, label: 'Calendario' },
    ],
    pacientes: [
        { id: 'person', icon: Users, label: 'Historia Clínica' },
        { id: 'steth', icon: Stethoscope, label: 'Anamnesis' },
        { id: 'tooth', icon: Activity, label: 'Odontograma 3D' },
        { id: 'perio', icon: BarChart3, label: 'Sondaje Periodontal' },
        { id: 'docs', icon: FileCheck, label: 'Documentos' },
        { id: 'cc', icon: CreditCard, label: 'Cuenta Corriente' },
        { id: 'presup', icon: ClipboardList, label: 'Presupuestos' },
    ],
    radiologia: [
        { id: 'dicom', icon: Monitor, label: 'Visor DICOM' },
    ],
    whatsapp: [
        { id: 'chats', icon: MessageCircle, label: 'Conversaciones' },
        { id: 'monitor', icon: Monitor, label: 'Monitor' },
    ],
    ia: [
        { id: 'panel', icon: Brain, label: 'Panel IA' },
        { id: 'dental', icon: Stethoscope, label: 'IA Dental' },
        { id: 'auto', icon: Zap, label: 'Automatizaciones' },
        { id: 'flows', icon: GitBranch, label: 'Flujos' },
        { id: 'editor', icon: MessageSquare, label: 'Editor' },
        { id: 'tpl', icon: FileCode, label: 'Plantillas' },
        { id: 'docsIA', icon: ClipboardList, label: 'Documentos Clínicos' },
    ],
    inventario: [
        { id: 'stock', icon: Package, label: 'Panel de Stock' },
        { id: 'qr', icon: QrCode, label: 'Trazabilidad por QR' },
        { id: 'orders', icon: ShoppingCart, label: 'Reposición con IA' },
    ],
    gestoria: [
        { id: 'resumen', icon: PieChart, label: 'Visión Financiera' },
        { id: 'factura', icon: Receipt, label: 'Facturación' },
        { id: 'email', icon: MessageCircle, label: 'Facturas Email' },
        { id: 'banco', icon: Landmark, label: 'Banco y Conciliación' },
        { id: 'fiscal', icon: BookOpen, label: 'Declaraciones Fiscales' },
        { id: 'informes', icon: BarChart2, label: 'Informes de Gestión' },
    ],
};

const BRAND_CONFIG: Record<string, string[]> = {
    clinica: ['#FF4B68', '#FBFFA3', '#118DF0', '#051650'],
    agenda: ['#118DF0', '#FF4B68', '#051650', '#FBFFA3'],
    pacientes: ['#FBFFA3', '#051650', '#FF4B68', '#118DF0'],
    whatsapp: ['#051650', '#118DF0', '#FBFFA3', '#FF4B68'],
    ia: ['#FBFFA3', '#FF4B68', '#118DF0', '#051650'],
    inventario: ['#118DF0', '#051650', '#FBFFA3', '#FF4B68'],
    gestoria: ['#FF4B68', '#118DF0', '#051650', '#FBFFA3'],
    radiologia: ['#118DF0', '#051650', '#FBFFA3', '#FF4B68'],
};

function BrandLogo({ size = 24, module = 'clinica' }: { size?: number; module?: string }) {
    const colors = BRAND_CONFIG[module] || BRAND_CONFIG.clinica;
    return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className="rounded-lg overflow-hidden shadow-lg">
            <rect x={0} y={0} width={18} height={18} fill={colors[0]} />
            <rect x={18} y={0} width={18} height={18} fill={colors[1]} />
            <rect x={0} y={18} width={18} height={18} fill={colors[2]} />
            <rect x={18} y={18} width={18} height={18} fill={colors[3]} />
        </svg>
    );
}

function SmallBrandLogo({ areaId }: { areaId: string }) {
    const colors = BRAND_CONFIG[areaId] || BRAND_CONFIG.clinica;
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0 rounded-[3px] overflow-hidden">
            <rect x="0" y="0" width="7" height="7" fill={colors[0]} />
            <rect x="7" y="0" width="7" height="7" fill={colors[1]} />
            <rect x="0" y="7" width="7" height="7" fill={colors[2]} />
            <rect x="7" y="7" width="7" height="7" fill={colors[3]} />
        </svg>
    );
}

function BrandIcon({ areaId }: { areaId: string }) {
    const colors = BRAND_CONFIG[areaId] || BRAND_CONFIG.clinica;
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0 rounded-[3px] overflow-hidden">
            <rect x="0" y="0" width="7" height="7" fill={colors[0]} />
            <rect x="7" y="0" width="7" height="7" fill={colors[1]} />
            <rect x="0" y="7" width="7" height="7" fill={colors[2]} />
            <rect x="7" y="7" width="7" height="7" fill={colors[3]} />
        </svg>
    );
}

export default function Layout() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [searchValue, setSearchValue] = useState('');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    const module = MODULES.find(m => m.path !== '/' ? pathname.startsWith(m.path) : pathname === '/') || MODULES[0];
    const areaId = module.id;
    const subItems = SIDEBAR_ITEMS[areaId] || [];
    const activeSub = pathname.split('/')[2] || (subItems[0]?.id || null);

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchValue.trim()) {
            navigate(`/pacientes?q=${encodeURIComponent(searchValue.trim())}`);
            setSearchValue('');
        }
    };

    const handleSubClick = (id: string) => {
        // Los ítems que son la vista "raíz" de su módulo navegan sin sub-path
        const ROOT_IDS = new Set(['grid', 'calendar', 'person', 'resumen', 'stock', 'panel', 'chats', 'dicom']);
        const path = ROOT_IDS.has(id)
            ? (module.path === '/' ? '/' : module.path)
            : `${module.path}/${id}`;
        navigate(path);
    };

    const HAS_CUSTOM_SIDEBAR = ['radiologia', 'agenda'];
    const showGlobalSidebar = !HAS_CUSTOM_SIDEBAR.includes(areaId);

    return (
        <div className="layout-root spec-2026">
            <header className="fixed-top-header">
                <div className="header-left" onClick={() => navigate('/')}>
                    <BrandLogo size={36} module={areaId} />
                    <div className="brand-text">
                        <span className="brand-name">RUBIO GARCÍA</span>
                        <span className="stroke-accent">DENTAL</span>
                    </div>
                </div>

                <nav className="header-nav">
                    {MODULES.map(m => {
                        const isActive = areaId === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => navigate(m.path)}
                                className={`nav-pill ${isActive ? 'active' : ''}`}
                            >
                                {isActive && <BrandIcon areaId={m.id} />}
                                <span className="pill-label">{m.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="header-right">
                    <div className="header-search-box">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="header-search-input"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                        <Search size={14} className="search-icon" style={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
                    </div>

                    <div className="header-actions">
                        <button className="icon-btn" title="Notificaciones"><Bell size={14} /></button>
                        <button className="icon-btn" title="Configuración"><Settings size={14} /></button>
                        <button className="icon-btn" title="Ayuda"><HelpCircle size={14} /></button>
                        <div className="header-divider" />
                        <div className="user-profile-btn" onClick={() => logout()}>
                            <div className="user-avatar-initial">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <LogOut size={14} className="logout-icon" />
                        </div>
                    </div>
                </div>
            </header>

            <div className="app-main-view">
                {showGlobalSidebar && (
                    <aside
                        className={`fixed-narrow-sidebar ${isSidebarExpanded ? 'expanded' : ''}`}
                        onMouseEnter={() => setIsSidebarExpanded(true)}
                        onMouseLeave={() => setIsSidebarExpanded(false)}
                    >
                        <div className="sidebar-header-actions">
                            {isSidebarExpanded ? (
                                <div className="expanded-header-row">
                                    <button className="sidebar-action-pill search">
                                        <Search size={14} />
                                        <span>BUSCAR</span>
                                    </button>
                                    <button className="sidebar-action-pill new">
                                        <Plus size={14} />
                                        <span>NUEVO</span>
                                    </button>
                                </div>
                            ) : (
                                <button className="collapsed-search-btn">
                                    <Search size={16} />
                                </button>
                            )}
                        </div>

                        <div className="sidebar-scroll-content">
                            {isSidebarExpanded && (
                                <div className="area-title-module">
                                    <div className="area-info-top">
                                        <div className="area-icon-container">
                                            <module.icon size={18} />
                                        </div>
                                        <div className="area-labels">
                                            <span className="area-id-text">{module.id.toUpperCase()}</span>
                                            <h2 className="area-main-title">{module.label}</h2>
                                        </div>
                                    </div>
                                    <div className="area-divider-line" />
                                </div>
                            )}

                            <nav className="sidebar-sub-nav">
                                {subItems.map(item => {
                                    const isActive = activeSub === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSubClick(item.id)}
                                            className={`side-nav-link ${isActive ? 'active' : ''}`}
                                            title={item.label}
                                        >
                                            <item.icon size={isSidebarExpanded ? 16 : 18} className="item-icon" />
                                            {isSidebarExpanded && (
                                                <>
                                                    <span className="item-label">{item.label}</span>
                                                    {isActive && <ChevronRight size={14} className="active-arrow" />}
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>

                            {isSidebarExpanded && (areaId === 'clinica') && (
                                <div className="operational-widgets-panel">
                                    <div className="op-widget-box">
                                        <div className="op-widget-header">
                                            <div className="header-l">
                                                <Clock size={12} />
                                                <span>SALA DE ESPERA</span>
                                            </div>
                                            <span className="header-count">2</span>
                                        </div>
                                        <div className="op-widget-list">
                                            <div className="wait-item-card">
                                                <div className="wait-time-box urgent">12m</div>
                                                <div className="wait-info">
                                                    <p className="wait-name">Bárbara Ruiz</p>
                                                    <p className="wait-trat">Ortodoncia</p>
                                                </div>
                                            </div>
                                            <div className="wait-item-card">
                                                <div className="wait-time-box normal">5m</div>
                                                <div className="wait-info">
                                                    <p className="wait-name">Javier Abad</p>
                                                    <p className="wait-trat">Higiene</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="op-widget-box">
                                        <div className="op-widget-header">
                                            <div className="header-l">
                                                <Activity size={12} />
                                                <span>EN GABINETE</span>
                                            </div>
                                            <span className="header-count">1</span>
                                        </div>
                                        <div className="op-widget-list">
                                            <div className="gab-item-card">
                                                <div className="gab-id-box">G1</div>
                                                <div className="gab-info">
                                                    <p className="gab-name">M. Carmen</p>
                                                    <p className="gab-sub">Dr. Rubio · 35m</p>
                                                </div>
                                                <div className="gab-status-dot pulse" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="sidebar-footer-actions">
                            {isSidebarExpanded ? (
                                <div className="expanded-footer-grid">
                                    <button className="btn-quick-action cita">
                                        <Plus size={16} />
                                        <span>CITA</span>
                                    </button>
                                    <button className="btn-quick-action urgent">
                                        <AlertTriangle size={16} />
                                        <span>URGENCE</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="collapsed-footer-stack">
                                    <button className="round-btn-add"><Plus size={18} /></button>
                                    <button className="round-btn-alert"><AlertTriangle size={18} /></button>
                                </div>
                            )}
                        </div>
                    </aside>
                )}

                <main className="main-content-area">
                    <div className="page-scroll-view">
                        <Outlet context={{
                            activeSub,
                            stats: { total: 3, inCourse: 1, waiting: 2, finalized: 0 }
                        }} />
                    </div>
                </main>
            </div>
        </div>
    );
}
