import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { authFetch } from '../../hooks/authFetch';
import { useToast } from '../../components/Toast';
import { sendLocation } from '../../hooks/sendLocation';
import { ArrowLeft, MapPin, Clock, User, Calendar, Package, MessageSquare, Send, Navigation, CheckCircle, Wrench, UserPlus, RotateCcw, Camera, X, Loader } from 'lucide-react';

interface WorkOrder {
    id: string; title: string; client: string; clientAddress: string;
    technicianId: string; status: string; priority: string;
    scheduledDate: string; endDate: string; estimatedDuration: string; description: string;
    lat: number; lng: number; materials: string;
}
interface InventoryItem {
    inventoryId: string; assignmentId: number; name: string; sku: string; category: string; qty: number; unit: string; unitCost: number;
}
interface Comment {
    id: string; orderId: string; authorId: string; authorName: string; text: string; images?: string; createdAt: string;
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
    const { data: inventory, refetch: refetchInventory } = useApi<InventoryItem[]>('/api/inventory/my', []);
    const availableInventory = inventory.filter(i => i.qty > 0);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [showMaterials, setShowMaterials] = useState(false);
    const [selectedMaterials, setSelectedMaterials] = useState<{ inventoryId: string; name: string; qty: number }[]>([]);
    const [saving, setSaving] = useState(false);
    const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
    const [lightboxImg, setLightboxImg] = useState<string | null>(null);
    const [sendingComment, setSendingComment] = useState(false);

    // Compress image via canvas — max 800px side, JPEG quality 0.6
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 800;
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
                    else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.6));
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const remaining = 3 - pendingPhotos.length;
        const toProcess = files.slice(0, remaining);
        const compressed = await Promise.all(toProcess.map(f => compressImage(f)));
        setPendingPhotos(prev => [...prev, ...compressed].slice(0, 3));
        e.target.value = ''; // reset input
    };

    const removePhoto = (idx: number) => {
        setPendingPhotos(prev => prev.filter((_, i) => i !== idx));
    };

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
        try {
            const res = await authFetch(`/api/work-orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: flow.next }),
            });
            if (res.ok) {
                toast('success', `Estado cambiado a: ${flow.next}`);
                sendLocation();
                refetch();
            } else {
                const err = await res.json().catch(() => ({}));
                toast('error', err.message || 'Error al cambiar estado');
            }
        } catch (error) {
            toast('error', 'Error de red al cambiar estado');
        } finally {
            setSaving(false);
        }
    };

    const handleReopen = async () => {
        setSaving(true);
        try {
            const res = await authFetch(`/api/work-orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'en-servicio' }),
            });
            if (res.ok) {
                toast('success', 'Orden reabierta — estado: en servicio');
                sendLocation();
                refetch();
            } else {
                const err = await res.json().catch(() => ({}));
                toast('error', err.message || 'Error al reabrir orden');
            }
        } catch (error) {
            toast('error', 'Error de red al reabrir orden');
        } finally {
            setSaving(false);
        }
    };

    const handleAssign = async () => {
        try {
            const res = await authFetch(`/api/work-orders/${id}/assign`, {
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

    const handleAddComment = async () => {
        if (!newComment.trim() && pendingPhotos.length === 0) return;
        setSendingComment(true);
        try {
            const res = await authFetch(`/api/work-orders/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: newComment.trim(),
                    images: pendingPhotos.length > 0 ? pendingPhotos : undefined,
                }),
            });
            const comment = await res.json();
            setComments(prev => [...prev, comment]);
            setNewComment('');
            setPendingPhotos([]);
        } catch {
            // error silently
        } finally {
            setSendingComment(false);
        }
    };

    const toggleMaterial = (item: InventoryItem) => {
        setSelectedMaterials(prev => {
            const exists = prev.find(m => m.inventoryId === item.inventoryId);
            if (exists) return prev.filter(m => m.inventoryId !== item.inventoryId);
            return [...prev, { inventoryId: item.inventoryId, name: item.name, qty: 1 }];
        });
    };

    const updateMaterialQty = (inventoryId: string, qty: number) => {
        const item = inventory.find(i => i.inventoryId === inventoryId);
        const max = item ? item.qty : 999;
        setSelectedMaterials(prev => prev.map(m => m.inventoryId === inventoryId ? { ...m, qty: Math.max(1, Math.min(qty, max)) } : m));
    };

    const handleConsumeMaterials = async () => {
        if (selectedMaterials.length === 0) { toast('error', 'Selecciona al menos un material'); return; }
        setSaving(true);
        try {
            const res = await authFetch(`/api/work-orders/${id}/materials`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materials: selectedMaterials }),
            });
            if (res.ok) {
                toast('success', 'Materiales registrados');
                setSelectedMaterials([]);
                setShowMaterials(false);
                refetch();
                refetchInventory();
            } else {
                const err = await res.json().catch(() => ({}));
                toast('error', err.message || 'Error al registrar materiales');
            }
        } catch (error) {
            toast('error', 'Error de red al registrar materiales');
        } finally {
            setSaving(false);
        }
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

            {order.lat && order.lng && (
                <button
                    className="tech-action-btn"
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${order.lat},${order.lng}`, '_blank')}
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', marginTop: -6 }}
                >
                    <Navigation size={16} /> Abrir ubicación en Google Maps
                </button>
            )}

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
                            <div className="tech-section-title">Mi Material Disponible</div>
                            {availableInventory.length === 0 && <div style={{ textAlign: 'center', padding: 16, color: '#475569', fontSize: 13 }}>No tienes material disponible</div>}
                            {availableInventory.map(item => {
                                const selected = selectedMaterials.find(m => m.inventoryId === item.inventoryId);
                                return (
                                    <div key={item.inventoryId} style={{
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
                                            <div style={{ fontSize: 11, color: item.qty <= 2 ? '#f87171' : '#34d399' }}>{item.sku} · <strong>{item.qty}</strong> {item.unit} disponibles</div>
                                        </div>
                                        {selected && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => updateMaterialQty(item.inventoryId, (selected.qty || 1) - 1)}
                                                    style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#e2e8f0', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >−</button>
                                                <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{selected.qty}</span>
                                                <button
                                                    onClick={() => updateMaterialQty(item.inventoryId, (selected.qty || 1) + 1)}
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

                {comments.map(c => {
                    const imgs: string[] = (() => { try { return JSON.parse(c.images || '[]'); } catch { return []; } })();
                    return (
                        <div key={c.id} className="tech-comment">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="tech-comment-author">{c.authorName}</span>
                                <span className="tech-comment-time">{new Date(c.createdAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {c.text && <div className="tech-comment-text">{c.text}</div>}
                            {imgs.length > 0 && (
                                <div className="tech-comment-images">
                                    {imgs.map((src, i) => (
                                        <img
                                            key={i}
                                            src={src}
                                            alt={`Foto ${i + 1}`}
                                            className="tech-comment-img"
                                            onClick={() => setLightboxImg(src)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Photo Preview */}
                {pendingPhotos.length > 0 && (
                    <div className="tech-photo-preview">
                        {pendingPhotos.map((src, i) => (
                            <div key={i} className="tech-photo-preview-item">
                                <img src={src} alt={`Preview ${i + 1}`} />
                                <button className="tech-photo-preview-remove" onClick={() => removePhoto(i)}>
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Sending indicator */}
                {sendingComment && (
                    <div className="tech-sending-indicator">
                        <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enviando{pendingPhotos.length > 0 ? ` con ${pendingPhotos.length} foto${pendingPhotos.length > 1 ? 's' : ''}` : ''}...
                    </div>
                )}

                {/* New Comment */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        className="tech-input"
                        placeholder="Escribe un comentario..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                        style={{ flex: 1 }}
                        disabled={sendingComment}
                    />
                    <div className="tech-photo-btn">
                        <Camera size={18} />
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoSelect}
                            disabled={pendingPhotos.length >= 3 || sendingComment}
                        />
                        {pendingPhotos.length > 0 && (
                            <span className="tech-photo-count">{pendingPhotos.length}</span>
                        )}
                    </div>
                    <button
                        onClick={handleAddComment}
                        disabled={(!newComment.trim() && pendingPhotos.length === 0) || sendingComment}
                        style={{
                            width: 44, height: 44, borderRadius: 10, border: 'none',
                            background: (newComment.trim() || pendingPhotos.length > 0) && !sendingComment ? '#818cf8' : '#1e293b',
                            color: 'white', cursor: (newComment.trim() || pendingPhotos.length > 0) && !sendingComment ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxImg && (
                <div className="tech-lightbox" onClick={() => setLightboxImg(null)}>
                    <button className="tech-lightbox-close" onClick={() => setLightboxImg(null)}>
                        <X size={20} />
                    </button>
                    <img src={lightboxImg} alt="Foto ampliada" onClick={e => e.stopPropagation()} />
                </div>
            )}
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
