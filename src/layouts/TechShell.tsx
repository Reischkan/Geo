import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, ClipboardList, User } from 'lucide-react';
import { sendLocation } from '../hooks/sendLocation';
import '../tech.css';

const navItems = [
    { path: '/tech', icon: Home, label: 'Inicio' },
    { path: '/tech/ordenes', icon: ClipboardList, label: 'Órdenes' },
    { path: '/tech/perfil', icon: User, label: 'Perfil' },
];

export default function TechShell() {
    const { user, tenant } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Send location on mount, every 60s, and on route changes
    useEffect(() => {
        sendLocation();
        const interval = setInterval(sendLocation, 60_000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => { sendLocation(); }, [location.pathname]);

    return (
        <div className="tech-shell">
            {/* Header */}
            <div className="tech-header">
                <div>
                    <div className="tech-header-title">GeoField Tech</div>
                    <div className="tech-header-subtitle">{tenant?.name || 'GeoField'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: '#fff',
                    }}>
                        {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="tech-content">
                <Outlet />
            </div>

            {/* Bottom Nav */}
            <nav className="tech-bottom-nav">
                {navItems.map(item => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/tech' && location.pathname.startsWith(item.path));
                    return (
                        <button
                            key={item.path}
                            className={`tech-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
