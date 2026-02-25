import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { authFetch } from '../../hooks/authFetch';
import { LogOut, Star, Clock, CheckCircle, Briefcase, Package } from 'lucide-react';

interface Tech { id: string; name: string; avatar: string; role: string; status: string; phone: string; completedOrders: number; rating: number; hoursLogged: number; }
interface TechStats { technicianId: string; completedOrders: number; totalOrders: number; rating: number; hoursLogged: number; email: string | null; hasCredentials: boolean; }

export default function TechProfilePage() {
    const { user, tenant, logout } = useAuth();
    const techId = user?.technicianId || '';
    const { data: techs } = useApi<Tech[]>('/api/technicians', []);
    const tech = techs.find(t => t.id === techId);

    const [stats, setStats] = useState<TechStats | null>(null);
    const [myOrders, setMyOrders] = useState<any[]>([]);

    useEffect(() => {
        // Fetch real stats
        authFetch('/api/technicians/stats')
            .then(r => r.json())
            .then((all: TechStats[]) => {
                const mine = all.find(s => s.technicianId === techId);
                if (mine) setStats(mine);
            }).catch(() => { });

        // Fetch my orders for the detail breakdown
        authFetch('/api/work-orders')
            .then(r => r.json())
            .then((orders: any[]) => {
                setMyOrders(orders.filter(o => o.technicianId === techId));
            }).catch(() => { });
    }, [techId]);

    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
    const completed = stats?.completedOrders ?? tech?.completedOrders ?? 0;
    const total = stats?.totalOrders ?? 0;
    const rating = stats?.rating ?? tech?.rating ?? 0;
    const hours = stats?.hoursLogged ?? tech?.hoursLogged ?? 0;
    const performance = total > 0 ? Math.round((completed / total) * 100) : 0;

    const activeOrders = myOrders.filter(o => o.status !== 'completada' && o.status !== 'cancelada');
    const completedOrders = myOrders.filter(o => o.status === 'completada');

    return (
        <div className="tech-animate" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Avatar + Name */}
            <div style={{ textAlign: 'center', paddingTop: 10 }}>
                <div className="tech-avatar-large">{initials}</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 12 }}>{user?.name}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{tech?.role || 'Técnico'}</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{user?.email}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>{tech?.phone || ''}</div>
            </div>

            {/* Stats */}
            <div className="tech-card">
                <div className="tech-section-title">Estadísticas</div>
                <div className="tech-stat-row">
                    <span className="tech-stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={14} color="#10b981" /> Órdenes Completadas
                    </span>
                    <span className="tech-stat-value">{completed} / {total}</span>
                </div>
                <div className="tech-stat-row">
                    <span className="tech-stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Star size={14} color="#fbbf24" /> Calificación
                    </span>
                    <span className="tech-stat-value">⭐ {rating.toFixed(1)}</span>
                </div>
                <div className="tech-stat-row">
                    <span className="tech-stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color="#818cf8" /> Horas en Campo
                    </span>
                    <span className="tech-stat-value">{hours}h</span>
                </div>
                <div className="tech-stat-row" style={{ borderBottom: 'none' }}>
                    <span className="tech-stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Package size={14} color="#f59e0b" /> Rendimiento
                    </span>
                    <span className="tech-stat-value" style={{ color: performance >= 80 ? '#10b981' : performance >= 50 ? '#f59e0b' : '#ef4444' }}>{performance}%</span>
                </div>
            </div>

            {/* Active Orders */}
            {activeOrders.length > 0 && (
                <div className="tech-card">
                    <div className="tech-section-title">Órdenes Activas ({activeOrders.length})</div>
                    {activeOrders.map(o => (
                        <div key={o.id} className="tech-stat-row">
                            <span className="tech-stat-label" style={{ fontSize: 13 }}>{o.title}</span>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontWeight: 600 }}>{o.status}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Completed */}
            {completedOrders.length > 0 && (
                <div className="tech-card">
                    <div className="tech-section-title">Últimas Completadas ({completedOrders.length})</div>
                    {completedOrders.slice(0, 5).map(o => (
                        <div key={o.id} className="tech-stat-row">
                            <span className="tech-stat-label" style={{ fontSize: 13 }}>{o.title}</span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{o.scheduledDate}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Company */}
            <div className="tech-card">
                <div className="tech-section-title">Empresa</div>
                <div className="tech-stat-row" style={{ borderBottom: 'none' }}>
                    <span className="tech-stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Briefcase size={14} color="#64748b" /> Organización
                    </span>
                    <span className="tech-stat-value">{tenant?.name || 'GeoField'}</span>
                </div>
            </div>

            {/* Logout */}
            <button
                className="tech-action-btn"
                onClick={logout}
                style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
            >
                <LogOut size={16} /> Cerrar Sesión
            </button>
        </div>
    );
}
