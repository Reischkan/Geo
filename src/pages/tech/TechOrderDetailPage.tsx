import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { authFetch } from '../../hooks/authFetch';
import { useToast } from '../../components/Toast';
import { ArrowLeft, MapPin, Clock, User, Calendar, Package, MessageSquare, Send, Navigation, CheckCircle, Play, Wrench, UserPlus, RotateCcw } from 'lucide-react';

interface WorkOrder {
    id: string; title: string; client: string; clientAddress: string;
    technicianId: string; status: string; priority: string;
    scheduledDate: string; endDate: string; estimatedDuration: string; description: string;
    lat: number; lng: number; materials: string;
}
interface InventoryItem {
    id: string; name: string; sku: string; category: string; vehicleQty: number; unit: string;
}
interface Comment {
    id: string; orderId: string; authorId: string; authorName: string; text: string; createdAt: string;
}

const statusFlow: Record<string, { next: string; label: string; icon: any; color: string }> = {
    'pendiente': { next: 'en-ruta', label: 'Iniciar Ruta', icon: Navigation, color: '#8b5cf6' },
    'en-ruta': { next: 'en-servicio', label: 'Llegué al Sitio', icon: MapPin, color: '#f97316' },
    'en-servicio': { next: 'completada', label: 'Completar Orden', icon: CheckCircle, color: '#10b981' },
    'en-progreso': { next: 'en-ruta', label: 'Iniciar Ruta', icon: Navigation, color: '#8b5cf6' },
};

const statusColors: Record<string, string> = {
    'pendiente': '#f59e0b', 'en-progreso': '#3b82f6', 'en-ruta': '#8b5cf6',
    'en-servicio': '#f97316', 'completada': '#10b981', 'cancelada': '#ef4444',
};
const priorityLabels: Record<string, { label: string; color: string }> = {
    'urgente': { label: 'Urgente', color: '#ef4444' }, 'alta': { label: 'Alta', color: '#f87171' },
    'media': { label: 'Media', color: '#fbbf24' }, 'baja': { label: 'Baja', color: '#34d399' },
};

export default function TechOrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const techId = user?.technicianId || '';
    const { toast } = useToast();

    const { data: order, refetch } = useApi<WorkOrder>(`/api/work-orders/${id}`, null as any);
    const { data: inventory } = useApi<InventoryItem[]>('/api/inventory', []);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [showMaterials, setShowMaterials] = useState(false);
    const [selectedMaterials, setSelectedMaterials] = useState<{ inventoryId: string; name: string; qty: number }[]>([]);
    const [saving, setSaving] = useState(false);

    // Load comments
    useEffect(() => {
        if (!id) return;
        authFetch(`/api/work-orders/${id}/comments`)
            .then(r => r.json())
            .then(setComments)
            .catch(() => { });
    }, [id]);

    if (!order) return (
        <div className="tech-animate" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Cargando...</div>
    );

    const flow = statusFlow[order.status];
    const st = statusColors[order.status] || '#64748b';
    const pr = priorityLabels[order.priority] || priorityLabels['media'];
    const consumedMaterials: any[] = JSON.parse(order.materials || '[]');
    const isMyOrder = order.technicianId === techId;
    const canAct = isMyOrder && order.status !== 'completada' && order.status !== 'cancelada';

    const handleStatusChange = async () => {
        if (!flow) return;
        setSaving(true);
        await authFetch(`/api/work-orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: flow.next }),
        });
        toast('success', `Estado cambiado a: ${flow.next}`);
        refetch();
        setSaving(false);
    };

    const handleReopen = async () => {
        setSaving(true);
        await authFetch(`/api/work-orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'en-servicio' }),
        });
        toast('success', 'Orden reabierta — estado: en servicio');
        refetch();
        setSaving(false);
    };

    const handleAssign = async () => {
        await authFetch(`/api/work-orders/${id}/assign`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ technicianId: techId }),
        });
        toast('success', 'Orden asignada');
        refetch();
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        const res = await authFetch(`/api/work-orders/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: newComment.trim() }),
        });
        const comment = await res.json();
        setComments(prev => [...prev, comment]);
        setNewComment('');
    };

    const toggleMaterial = (item: InventoryItem) => {
        setSelectedMaterials(prev => {
            const exists = prev.find(m => m.inventoryId === item.id);
            if (exists) return prev.filter(m => m.inventoryId !== item.id);
            return [...prev, { inventoryId: item.id, name: item.name, qty: 1 }];
        });
    };

    const updateMaterialQty = (inventoryId: string, qty: number) => {
        setSelectedMaterials(prev => prev.map(m => m.inventoryId === inventoryId ? { ...m, qty: Math.max(1, qty) } : m));
    };

    const handleConsumeMaterials = async () => {
        if (selectedMaterials.length === 0) { toast('error', 'Selecciona al menos un material'); return; }
        setSaving(true);
        await authFetch(`/api/work-orders/${id}/materials`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ materials: selectedMaterials }),
        });
        toast('success', 'Materiales registrados');
        setSelectedMaterials([]);
        setShowMaterials(false);
        refetch();
        setSaving(false);
    };

    return (
        <div className="tech-animate" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Back */}
            <button
                onClick={() => navigate('/tech/ordenes')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}
            >
                <ArrowLeft size={16} /> Volver a Órdenes
            </button>

            {/* Header */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{order.id}</span>
                    <span className="tech-badge" style={{ background: `${st}20`, color: st }}>{order.status.replace('-', ' ')}</span>
                    <span className="tech-badge" style={{ background: `${pr.color}20`, color: pr.color }}>{pr.label}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>{order.title}</div>
            </div>

            {/* Info Card */}
            <div className="tech-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <InfoRow icon={<User size={14} />} label="Cliente" value={order.client} />
                <InfoRow icon={<Calendar size={14} />} label="Fecha" value={order.endDate && order.endDate !== order.scheduledDate ? `${order.scheduledDate} → ${order.endDate}` : order.scheduledDate} />
                <InfoRow icon={<MapPin size={14} />} label="Dirección" value={order.clientAddress || '—'} />
                <InfoRow icon={<Clock size={14} />} label="Duración" value={order.estimatedDuration} />
            </div>

            {order.description && (
                <div className="tech-card">
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Descripción</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{order.description}</div>
                </div>
            )}

            {/* Status Action */}
            {canAct && flow && (
                <button
                    className="tech-status-btn"
                    onClick={handleStatusChange}
                    disabled={saving}
                    style={{ background: flow.color, color: 'white' }}
                >
                    <flow.icon size={18} />
                    {saving ? 'Cambiando...' : flow.label}
                </button>
            )}

            {/* Reopen completed order */}
            {isMyOrder && order.status === 'completada' && (
                <button
                    className="tech-action-btn tech-action-btn-warning"
                    onClick={handleReopen}
                    disabled={saving}
                >
                    <RotateCcw size={16} /> {saving ? 'Reabriendo...' : 'Reabrir Orden'}
                </button>
            )}

            {/* Assign if unassigned */}
            {!isMyOrder && order.status !== 'completada' && order.status !== 'cancelada' && (
                <button className="tech-action-btn tech-action-btn-primary" onClick={handleAssign}>
                    <UserPlus size={16} /> Asignarme esta Orden
                </button>
            )}

            {/* Materials */}
            {canAct && (
                <div>
                    <button
                        className="tech-action-btn"
                        onClick={() => setShowMaterials(!showMaterials)}
                        style={{ marginBottom: showMaterials ? 10 : 0 }}
                    >
                        <Package size={16} /> {showMaterials ? 'Ocultar Materiales' : 'Registrar Materiales Usados'}
                    </button>

                    {showMaterials && (
                        <div className="tech-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div className="tech-section-title">Seleccionar del Inventario</div>
                            {inventory.map(item => {
                                const selected = selectedMaterials.find(m => m.inventoryId === item.id);
                                return (
                                    <div key={item.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 12px', borderRadius: 10,
                                        background: selected ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${selected ? 'rgba(129,140,248,0.3)' : 'rgba(255,255,255,0.04)'}`,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                        onClick={() => toggleMaterial(item)}
                                    >
                                        <div style={{
                                            width: 20, height: 20, borderRadius: 5,
                                            border: `2px solid ${selected ? '#818cf8' : '#475569'}`,
                                            background: selected ? '#818cf8' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.15s', flexShrink: 0,
                                        }}>
                                            {selected && <CheckCircle size={14} color="white" />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>{item.sku} · {item.vehicleQty} {item.unit} en vehículo</div>
                                        </div>
                                        {selected && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => updateMaterialQty(item.id, (selected.qty || 1) - 1)}
                                                    style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#e2e8f0', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >−</button>
                                                <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{selected.qty}</span>
                                                <button
                                                    onClick={() => updateMaterialQty(item.id, (selected.qty || 1) + 1)}
                                                    style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#e2e8f0', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >+</button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {selectedMaterials.length > 0 && (
                                <button className="tech-action-btn tech-action-btn-success" onClick={handleConsumeMaterials} disabled={saving}>
                                    <Wrench size={16} /> {saving ? 'Guardando...' : `Registrar ${selectedMaterials.length} material${selectedMaterials.length > 1 ? 'es' : ''}`}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Consumed Materials */}
            {consumedMaterials.length > 0 && (
                <div className="tech-card">
                    <div className="tech-section-title">Materiales Consumidos</div>
                    {consumedMaterials.map((m: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < consumedMaterials.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', fontSize: 13 }}>
                            <span>{m.name}</span>
                            <span style={{ fontWeight: 700, color: '#818cf8' }}>×{m.qty}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Comments */}
            <div className="tech-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="tech-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={14} /> Comentarios ({comments.length})
                </div>

                {comments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 16, color: '#475569', fontSize: 13 }}>Sin comentarios aún</div>
                )}

                {comments.map(c => (
                    <div key={c.id} className="tech-comment">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="tech-comment-author">{c.authorName}</span>
                            <span className="tech-comment-time">{new Date(c.createdAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="tech-comment-text">{c.text}</div>
                    </div>
                ))}

                {/* New Comment */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        className="tech-input"
                        placeholder="Escribe un comentario..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                        style={{ flex: 1 }}
                    />
                    <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        style={{
                            width: 44, height: 44, borderRadius: 10, border: 'none',
                            background: newComment.trim() ? '#818cf8' : '#1e293b',
                            color: 'white', cursor: newComment.trim() ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
        </div>
    );
}
