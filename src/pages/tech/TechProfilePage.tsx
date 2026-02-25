import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { LogOut, Star, Clock, CheckCircle, Briefcase } from 'lucide-react';

interface Tech { id: string; name: string; avatar: string; role: string; status: string; phone: string; completedOrders: number; rating: number; hoursLogged: number; }

export default function TechProfilePage() {
    const { user, tenant, logout } = useAuth();
    const techId = user?.technicianId || '';
    const { data: techs } = useApi<Tech[]>('/api/technicians', []);
    const tech = techs.find(t => t.id === techId);

    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';

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
                    <span className="tech-stat-value">{tech?.completedOrders || 0}</span>
                </div>
                <div className="tech-stat-row">
                    <span className="tech-stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Star size={14} color="#fbbf24" /> Calificación
                    </span>
                    <span className="tech-stat-value">⭐ {tech?.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="tech-stat-row">
                    <span className="tech-stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color="#818cf8" /> Horas Registradas
                    </span>
                    <span className="tech-stat-value">{tech?.hoursLogged || 0}h</span>
                </div>
            </div>

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
