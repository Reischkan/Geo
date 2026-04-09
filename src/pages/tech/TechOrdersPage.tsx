import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { authFetch } from '../../hooks/authFetch';
import { useToast } from '../../components/Toast';
import { MapPin, Clock, ChevronRight, UserPlus } from 'lucide-react';

interface WorkOrder {
    id: string; title: string; client: string; clientAddress: string;
    technicianId: string; status: string; priority: string;
    scheduledDate: string; endDate: string; estimatedDuration: string; description: string;
}

const statusColors: Record<string, string> = {
    'pendiente': '#f59e0b', 'en-progreso': '#3b82f6', 'en-ruta': '#8b5cf6',
    'en-servicio': '#f97316', 'completada': '#10b981', 'cancelada': '#ef4444',
};
const priorityColors: Record<string, string> = {
    'urgente': '#ef4444', 'alta': '#f87171', 'media': '#fbbf24', 'baja': '#34d399',
};

type Tab = 'hoy' | 'pendientes' | 'sin-asignar' | 'historial';

export default function TechOrdersPage() {
    const { user } = useAuth();
    const techId = user?.technicianId || '';
    const { data: orders, refetch } = useApi<WorkOrder[]>('/api/work-orders', []);
    const navigate = useNavigate();
    const { toast } = useToast();
    const [tab, setTab] = useState<Tab>('hoy');

    const todayStr = new Date().toISOString().slice(0, 10);
    const myOrders = orders.filter(o => o.technicianId === techId);

    const filtered = useMemo(() => {
        switch (tab) {
            case 'hoy':
                return myOrders.filter(o => {
                    const end = o.endDate || o.scheduledDate;
                    return o.scheduledDate <= todayStr && end >= todayStr && o.status !== 'completada' && o.status !== 'cancelada';
                });
            case 'pendientes':
                return myOrders.filter(o => o.status === 'pendiente' || o.status === 'en-progreso' || o.status === 'en-ruta' || o.status === 'en-servicio');
            case 'sin-asignar':
                return orders.filter(o => !o.technicianId || o.technicianId === '' || o.technicianId === 'undefined');
            case 'historial':
                return myOrders.filter(o => o.status === 'completada' || o.status === 'cancelada');
            default:
                return myOrders;
        }
    }, [tab, orders, myOrders, todayStr]);

    const handleAssign = async (orderId: string) => {
        try {
            const res = await authFetch(`/api/work-orders/${orderId}/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ technicianId: techId }),
            });
            if (res.ok) {
                toast('success', 'Orden asignada');
                refetch();
            } else {
                const err = await res.json().catch(() => ({}));
                toast('error', err.message || 'Error al asignar la orden');
            }
        } catch (error) {
            toast('error', 'Error de red al asignar');
        }
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: 'hoy', label: 'Hoy' },
        { key: 'pendientes', label: 'Pendientes' },
        { key: 'sin-asignar', label: 'Disponibles' },
        { key: 'historial', label: 'Historial' },
    ];

    return (
        <div className="tech-animate" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>Mis Órdenes</div>

            {/* Tabs */}
            <div className="tech-tabs">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={`tech-tab ${tab === t.key ? 'active' : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Results */}
            <div style={{ fontSize: 12, color: '#64748b' }}>{filtered.length} orden{filtered.length !== 1 ? 'es' : ''}</div>

            {filtered.length === 0 && (
                <div className="tech-card" style={{ textAlign: 'center', color: '#64748b', padding: 30, fontSize: 13 }}>
                    {tab === 'sin-asignar' ? '✅ No hay órdenes sin asignar' : '📋 Sin órdenes en esta categoría'}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(order => (
                    <div
                        key={order.id}
                        className="tech-order-card"
                        onClick={() => tab === 'sin-asignar' ? undefined : navigate(`/tech/ordenes/${order.id}`)}
                        style={{ borderLeft: `3px solid ${priorityColors[order.priority] || '#64748b'}` }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{order.id}</span>
                                    <span className="tech-badge" style={{
                                        background: `${statusColors[order.status] || '#64748b'}20`,
                                        color: statusColors[order.status] || '#64748b',
                                        fontSize: 10,
                                    }}>
                                        {order.status.replace('-', ' ')}
                                    </span>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>{order.title}</div>
                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{order.client}</div>
                            </div>
                            {tab === 'sin-asignar' ? (
                                <button
                                    className="tech-action-btn-primary"
                                    onClick={(e) => { e.stopPropagation(); handleAssign(order.id); }}
                                    style={{
                                        padding: '8px 14px', borderRadius: 8, border: 'none',
                                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        background: '#818cf8', color: 'white',
                                    }}
                                >
                                    <UserPlus size={14} /> Tomar
                                </button>
                            ) : (
                                <ChevronRight size={18} style={{ color: '#64748b', marginTop: 6 }} />
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <MapPin size={11} /> {order.clientAddress?.split(',')[0] || '—'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={11} /> {order.estimatedDuration}
                            </span>
                            <span>📅 {order.scheduledDate}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
