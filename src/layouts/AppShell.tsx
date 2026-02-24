import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    ClipboardList,
    CalendarDays,
    MapPin,
    Package,
    Users,
    UsersRound,
    ScrollText,
    Settings,
    Bell,
    Search,
    ChevronRight,
    LogOut,
    Radio,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/ordenes', icon: ClipboardList, label: 'Órdenes' },
    { to: '/calendario', icon: CalendarDays, label: 'Calendario' },
    { to: '/mapa', icon: MapPin, label: 'Mapa en Vivo' },
    { to: '/inventario', icon: Package, label: 'Inventario' },
    { to: '/tecnicos', icon: Users, label: 'Técnicos' },
];

const navItems2 = [
    { to: '/clientes', icon: UsersRound, label: 'Clientes' },
    { to: '/auditoria', icon: ScrollText, label: 'Auditoría' },
    { to: '/configuracion', icon: Settings, label: 'Configuración' },
];

const breadcrumbMap: Record<string, string> = {
    '/': 'Dashboard',
    '/ordenes': 'Órdenes de Trabajo',
    '/calendario': 'Calendario Maestro',
    '/mapa': 'Mapa en Vivo',
    '/inventario': 'Inventario',
    '/tecnicos': 'Técnicos',
    '/clientes': 'Clientes',
    '/auditoria': 'Auditoría',
    '/configuracion': 'Configuración',
};

export default function AppShell() {
    const location = useLocation();
    const [searchOpen, setSearchOpen] = useState(false);
    const { user, tenant, logout } = useAuth();

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside className="sidebar" style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                {/* Logo */}
                <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                    }}>
                        <Radio size={20} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--color-geo-text)' }}>GeoField</div>
                        <div style={{ fontSize: 11, color: 'var(--color-geo-text-dim)', fontWeight: 500 }}>{tenant?.name || 'Centro de Mando'}</div>
                    </div>
                </div>

                {/* Nav links */}
                <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-geo-text-dim)', padding: '12px 16px 8px', marginBottom: 2 }}>
                        Navegación
                    </div>
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-geo-text-dim)', padding: '16px 16px 8px', marginTop: 4 }}>
                        Gestión
                    </div>
                    {navItems2.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div style={{
                    padding: '16px 16px', borderTop: '1px solid var(--color-geo-border)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>
                        {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-geo-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Admin'}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-geo-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</div>
                    </div>
                    <button onClick={logout} title="Cerrar sesión" style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-geo-text-dim)', padding: 6, borderRadius: 8,
                        transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-geo-text-dim)'; e.currentTarget.style.background = 'none'; }}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* Main area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Top bar */}
                <header style={{
                    height: 60, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 28px',
                    borderBottom: '1px solid var(--color-geo-border)',
                    background: 'rgba(11, 15, 26, 0.8)',
                    backdropFilter: 'blur(12px)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--color-geo-text-dim)' }}>GeoField</span>
                        <ChevronRight size={14} style={{ color: 'var(--color-geo-text-dim)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-geo-text)' }}>
                            {breadcrumbMap[location.pathname] || 'Página'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <div
                                onClick={() => setSearchOpen(!searchOpen)}
                                style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'var(--color-geo-surface-2)', border: '1px solid var(--color-geo-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                }}
                            >
                                <Search size={16} style={{ color: 'var(--color-geo-text-muted)' }} />
                            </div>
                        </div>
                        {/* Notifications */}
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'var(--color-geo-surface-2)', border: '1px solid var(--color-geo-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                            }}>
                                <Bell size={16} style={{ color: 'var(--color-geo-text-muted)' }} />
                            </div>
                            <div style={{
                                position: 'absolute', top: -2, right: -2,
                                width: 16, height: 16, borderRadius: '50%',
                                background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 700, color: '#fff',
                                border: '2px solid var(--color-geo-bg)',
                            }}>3</div>
                        </div>
                        {/* Live indicator */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 9999,
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                        }}>
                            <div style={{
                                width: 7, height: 7, borderRadius: '50%', background: '#10b981',
                                animation: 'pulse-glow 2s ease infinite',
                            }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>EN VIVO</span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
