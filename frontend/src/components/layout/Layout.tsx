import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    Building2, Calendar, Users, MessageCircle, Brain, Settings,
    ChevronLeft, ChevronRight, Bell, Search, LogOut, Menu
} from 'lucide-react';
import { clinicConfig } from '../../config/clinic.config';
import { currentUser } from '../../data/mockData';
import './Layout.css';

const navItems = [
    { id: 'clinica', label: 'Clínica', icon: Building2, path: '/' },
    { id: 'agenda', label: 'Agenda', icon: Calendar, path: '/agenda' },
    { id: 'pacientes', label: 'Pacientes', icon: Users, path: '/pacientes' },
    { id: 'comunicacion', label: 'Comunicación', icon: MessageCircle, path: '/comunicacion', badge: 4 },
    { id: 'ia', label: 'IA Asistente', icon: Brain, path: '/ia' },
    { id: 'config', label: 'Configuración', icon: Settings, path: '/configuracion' },
];

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className={`layout ${collapsed ? 'layout--collapsed' : ''}`}>
            {/* Mobile overlay */}
            {mobileOpen && <div className="layout__overlay" onClick={() => setMobileOpen(false)} />}

            {/* Sidebar */}
            <aside className={`sidebar ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
                <div className="sidebar__header">
                    <div className="sidebar__logo">
                        <span className="sidebar__logo-icon">🦷</span>
                        {!collapsed && (
                            <div className="sidebar__logo-text">
                                <span className="sidebar__logo-name">{clinicConfig.shortName}</span>
                                <span className="sidebar__logo-subtitle">SmileStudio</span>
                            </div>
                        )}
                    </div>
                    <button
                        className="sidebar__toggle"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <nav className="sidebar__nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                            }
                            onClick={() => setMobileOpen(false)}
                            end={item.path === '/'}
                        >
                            <item.icon size={20} className="sidebar__link-icon" />
                            {!collapsed && (
                                <>
                                    <span className="sidebar__link-label">{item.label}</span>
                                    {item.badge && (
                                        <span className="sidebar__badge">{item.badge}</span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar__footer">
                    <div className="sidebar__user">
                        <div className="sidebar__avatar">
                            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        {!collapsed && (
                            <div className="sidebar__user-info">
                                <span className="sidebar__user-name">{currentUser.name}</span>
                                <span className="sidebar__user-role">{currentUser.role}</span>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="layout__main">
                {/* Header */}
                <header className="header">
                    <button className="header__menu-btn" onClick={() => setMobileOpen(true)}>
                        <Menu size={20} />
                    </button>

                    <div className="header__search">
                        <Search size={16} className="header__search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar paciente, cita, tratamiento..."
                            className="header__search-input"
                        />
                        <kbd className="header__search-kbd">⌘K</kbd>
                    </div>

                    <div className="header__actions">
                        <button className="header__action-btn" aria-label="Notificaciones">
                            <Bell size={18} />
                            <span className="header__notification-dot" />
                        </button>
                        <button className="header__action-btn" aria-label="Cerrar sesión">
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="layout__content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
