import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronDown, Plus, Edit, Archive, Calendar, Clock, MapPin, MessageSquare, Send } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApi } from '../hooks/useApi';
import { authFetch } from '../hooks/authFetch';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { getDefaultCoordinates } from '../utils/geo-defaults';
import Modal, { FormField, BtnPrimary, BtnSecondary, BtnDanger } from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { workOrders as fallbackOrders, technicians as fallbackTechs } from '../data/mock';

/* ── Map picker helpers ──────────────────── */
const pinIcon = L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 4px;background:#3b82f6;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4)"><div style="width:12px;height:12px;background:#fff;border-radius:50%;transform:rotate(45deg)"></div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

function MapClickHandler({ onMove }: { onMove: (lat: number, lng: number) => void }) {
    useMapEvents({ click(e) { onMove(e.latlng.lat, e.latlng.lng); } });
    return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => { map.setView([lat, lng], map.getZoom()); }, [lat, lng]);
    return null;
}

interface WorkOrder {
    id: string; title: string; client: string; clientAddress: string;
    technicianId: string; status: string; priority: string;
    scheduledDate: string; endDate: string; estimatedDuration: string; projectId?: string; description: string;
    lat: number; lng: number;
}
interface Tech { id: string; name: string; avatar: string; }
interface OrderComment { id: string; orderId: string; authorId: string; authorName: string; text: string; createdAt: string; }

const statusMap: Record<string, { label: string; cls: string }> = {
    'pendiente': { label: 'Pendiente', cls: 'badge-pending' },
    'en-progreso': { label: 'En Progreso', cls: 'badge-progress' },
    'en-ruta': { label: 'En Ruta', cls: 'badge-progress' },
    'en-servicio': { label: 'En Servicio', cls: 'badge-progress' },
    'completada': { label: 'Completada', cls: 'badge-completed' },
    'cancelada': { label: 'Cancelada', cls: 'badge-cancelled' },
};
const priorityColors: Record<string, { bg: string; color: string }> = {
    'urgente': { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
    'alta': { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
    'media': { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
    'baja': { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
};

// NOTE: emptyOrder lat/lng are now set dynamically per tenant inside the component
const emptyOrderBase: Partial<WorkOrder> = {
    title: '', client: '', clientAddress: '', technicianId: '', status: 'pendiente',
    priority: 'media', scheduledDate: '', endDate: '', estimatedDuration: '2h', description: '',
};

export default function OrdersPage() {
    const { data: techs } = useApi<Tech[]>('/api/technicians', fallbackTechs as any);
    const { toast } = useToast();
    const { tenant } = useAuth();
    const defaultCoords = useMemo(() => getDefaultCoordinates(tenant?.id), [tenant?.id]);
    const emptyOrder: Partial<WorkOrder> = { ...emptyOrderBase, lat: defaultCoords.lat, lng: defaultCoords.lng };

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState<WorkOrder | null>(null);
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [form, setForm] = useState<Partial<WorkOrder>>(emptyOrder);
    const [archiveId, setArchiveId] = useState<string | null>(null);
    const [comments, setComments] = useState<OrderComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [archivedOrders, setArchivedOrders] = useState<WorkOrder[]>([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    // Debounce search input to avoid excessive API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // reset to page 1 on new search
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset page when filters change
    useEffect(() => { setPage(1); }, [statusFilter, dateFrom, dateTo]);

    // Build paginated API URL
    const ordersUrl = useMemo(() => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(PAGE_SIZE));
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        return `/api/work-orders?${params.toString()}`;
    }, [page, statusFilter, debouncedSearch, dateFrom, dateTo]);

    const { data: paginatedResponse, refetch } = useApi<{ data: WorkOrder[]; meta: { total: number; page: number; totalPages: number } }>(
        ordersUrl,
        { data: fallbackOrders as any, meta: { total: 0, page: 1, totalPages: 1 } },
    );

    const orders = paginatedResponse?.data || [];
    const meta = paginatedResponse?.meta || { total: 0, page: 1, totalPages: 1 };

    // Load archived orders when viewing archive
    useEffect(() => {
        if (showArchived) {
            authFetch('/api/work-orders?archived=true')
                .then(r => r.json())
                .then(setArchivedOrders)
                .catch(() => {
                    toast('error', 'Error de conexión al cargar órdenes archivadas');
                    setArchivedOrders([]);
                });
        }
    }, [showArchived, page]);

    // Load comments when an order is selected
    useEffect(() => {
        if (!selected) { setComments([]); return; }
        authFetch(`/api/work-orders/${selected.id}/comments`)
            .then(r => r.json())
            .then(setComments)
            .catch(() => {
                toast('error', 'No se pudieron cargar los comentarios');
                setComments([]);
            });
    }, [selected?.id]);

    const handleAddComment = async () => {
        if (!newComment.trim() || !selected) return;
        try {
            const res = await authFetch(`/api/work-orders/${selected.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newComment.trim() }),
            });
            if (res.ok) {
                const comment = await res.json();
                setComments(prev => [...prev, comment]);
                setNewComment('');
            } else {
                toast('error', 'No se pudo enviar el comentario');
            }
        } catch {
            toast('error', 'Error de conexión al enviar comentario');
        }
    };

    const getTechName = (id: string) => techs.find(t => t.id === id)?.name || id;
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const setNum = (k: string, v: string) => setForm(f => ({ ...f, [k]: v === '' ? 0 : parseFloat(v) }));

    const handleSave = async () => {
        const isNew = modal === 'create';
        const id = isNew ? `OT-${String(Date.now()).slice(-4)}` : form.id;
        const body = { ...form, id };
        const res = await authFetch(isNew ? '/api/work-orders' : `/api/work-orders/${id}`, {
            method: isNew ? 'POST' : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (res.ok) {
            toast('success', isNew ? 'Orden de trabajo creada' : 'Orden actualizada');
            setModal(null); setSelected(null); refetch();
        } else toast('error', 'Error al guardar');
    };

    const handleArchive = async (id: string) => {
        const res = await authFetch(`/api/work-orders/${id}`, { method: 'DELETE' });
        if (res.ok) { toast('success', 'Orden archivada'); setSelected(null); refetch(); }
        else toast('error', 'Error al archivar');
    };

    const handleUnarchive = async (id: string) => {
        const res = await authFetch(`/api/work-orders/${id}/unarchive`, { method: 'PATCH' });
        if (res.ok) {
            toast('success', 'Orden restaurada');
            setArchivedOrders(prev => prev.filter(o => o.id !== id));
            refetch();
        } else toast('error', 'Error al restaurar');
    };

    return (
        <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 108px)' }}>
            {/* Main list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{showArchived ? 'Órdenes Archivadas' : 'Órdenes de Trabajo'}</h1>
                        <p style={{ fontSize: 14, color: 'var(--color-geo-text-muted)', marginTop: 4 }}>{showArchived ? `${archivedOrders.length} archivadas` : `${meta.total} órdenes · Página ${meta.page} de ${meta.totalPages}`}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setShowArchived(!showArchived)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: '1px solid var(--color-geo-border)', fontSize: 13, fontWeight: 600, background: showArchived ? 'rgba(139,92,246,0.15)' : 'var(--color-geo-surface-2)', color: showArchived ? '#a78bfa' : 'var(--color-geo-text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <Archive size={16} /> {showArchived ? 'Ver Activas' : 'Archivo'}
                        </button>
                        {!showArchived && (
                            <button onClick={() => { setForm(emptyOrder); setModal('create'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, background: 'var(--color-geo-primary)', color: '#fff', cursor: 'pointer' }}>
                                <Plus size={16} /> Nueva OT
                            </button>
                        )}
                    </div>
                </div>

                {!showArchived && (
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, position: 'relative', minWidth: 180 }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-geo-text-dim)' }} />
                            <input className="geo-input" placeholder="Buscar OT..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: 40 }} />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Filter size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-geo-text-dim)', pointerEvents: 'none' }} />
                            <select className="geo-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ paddingLeft: 40, paddingRight: 30, appearance: 'none', cursor: 'pointer', minWidth: 150 }}>
                                <option value="all">Todos</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="en-progreso">En Progreso</option>
                                <option value="en-ruta">En Ruta</option>
                                <option value="en-servicio">En Servicio</option>
                                <option value="completada">Completada</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-geo-text-dim)', pointerEvents: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} style={{ color: 'var(--color-geo-text-dim)' }} />
                            <input className="geo-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140, fontSize: 12 }} />
                            <span style={{ color: 'var(--color-geo-text-dim)', fontSize: 12 }}>—</span>
                            <input className="geo-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 140, fontSize: 12 }} />
                            {(dateFrom || dateTo) && (
                                <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ border: 'none', background: 'none', color: '#f87171', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '4px 8px' }}>✕</button>
                            )}
                        </div>
                    </div>
                )}

                {/* Active orders table */}
                {!showArchived && (
                    <div className="glass-card" style={{ flex: 1, overflow: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>ID</th><th>Título</th><th>Cliente</th><th>Técnico</th><th>Estado</th><th>Prioridad</th><th>Fecha</th><th>Acciones</th></tr></thead>
                            <tbody>
                                {orders.map(o => {
                                    const p = priorityColors[o.priority] || priorityColors['media'];
                                    return (
                                        <tr key={o.id} style={{ cursor: 'pointer', background: selected?.id === o.id ? 'rgba(59,130,246,0.06)' : undefined }} onClick={() => setSelected(o)}>
                                            <td style={{ fontWeight: 600, color: 'var(--color-geo-text)' }}>{o.id}</td>
                                            <td style={{ fontWeight: 500, color: 'var(--color-geo-text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.title}</td>
                                            <td>{o.client}</td>
                                            <td>{getTechName(o.technicianId)}</td>
                                            <td><span className={`badge ${statusMap[o.status]?.cls || 'badge-pending'}`}>{statusMap[o.status]?.label || o.status}</span></td>
                                            <td><span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: p.bg, color: p.color }}>{o.priority}</span></td>
                                            <td style={{ fontSize: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {o.scheduledDate}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => { setForm(o); setModal('edit'); }} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'var(--color-geo-surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-geo-text-dim)' }}><Edit size={13} /></button>
                                                    <button onClick={() => setArchiveId(o.id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}><Archive size={13} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {/* Pagination Controls */}
                        {meta.totalPages > 1 && (
                            <div style={{
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
                                padding: '12px 16px', borderTop: '1px solid var(--color-geo-border)',
                            }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    style={{
                                        padding: '6px 16px', borderRadius: 8, border: '1px solid var(--color-geo-border)',
                                        background: page <= 1 ? 'var(--color-geo-surface-2)' : 'var(--color-geo-primary)',
                                        color: page <= 1 ? 'var(--color-geo-text-dim)' : '#fff',
                                        fontSize: 12, fontWeight: 600, cursor: page <= 1 ? 'default' : 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    ← Anterior
                                </button>
                                <span style={{ fontSize: 12, color: 'var(--color-geo-text-muted)', fontWeight: 500 }}>
                                    Página {meta.page} de {meta.totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    disabled={page >= meta.totalPages}
                                    style={{
                                        padding: '6px 16px', borderRadius: 8, border: '1px solid var(--color-geo-border)',
                                        background: page >= meta.totalPages ? 'var(--color-geo-surface-2)' : 'var(--color-geo-primary)',
                                        color: page >= meta.totalPages ? 'var(--color-geo-text-dim)' : '#fff',
                                        fontSize: 12, fontWeight: 600, cursor: page >= meta.totalPages ? 'default' : 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    Siguiente →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Archived orders table */}
                {showArchived && (
                    <div className="glass-card" style={{ flex: 1, overflow: 'auto' }}>
                        {archivedOrders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-geo-text-dim)' }}>
                                <Archive size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                                <div style={{ fontSize: 14, fontWeight: 600 }}>Sin órdenes archivadas</div>
                                <div style={{ fontSize: 12, marginTop: 4 }}>Las órdenes archivadas aparecerán aquí</div>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>ID</th><th>Título</th><th>Cliente</th><th>Técnico</th><th>Estado</th><th>Fecha</th><th>Restaurar</th></tr></thead>
                                <tbody>
                                    {archivedOrders.map(o => (
                                        <tr key={o.id} style={{ opacity: 0.7 }}>
                                            <td style={{ fontWeight: 600, color: 'var(--color-geo-text)' }}>{o.id}</td>
                                            <td style={{ fontWeight: 500, color: 'var(--color-geo-text)' }}>{o.title}</td>
                                            <td>{o.client}</td>
                                            <td>{getTechName(o.technicianId)}</td>
                                            <td><span className={`badge ${statusMap[o.status]?.cls || 'badge-pending'}`}>{statusMap[o.status]?.label || o.status}</span></td>
                                            <td style={{ fontSize: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {o.scheduledDate}</div></td>
                                            <td>
                                                <button onClick={() => handleUnarchive(o.id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: 'rgba(16,185,129,0.1)', color: '#34d399', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Restaurar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Detail panel */}
            {selected && !showArchived && (
                <div className="glass-card animate-fade-in-up" style={{ width: 340, flexShrink: 0, padding: 24, overflow: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-geo-primary-light)' }}>{selected.id}</span>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{selected.title}</h3>
                        </div>
                        <span className={`badge ${statusMap[selected.status]?.cls}`}>{statusMap[selected.status]?.label}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, color: 'var(--color-geo-text-muted)' }}>
                        <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</span><div style={{ marginTop: 4 }}>{selected.client}</div><div style={{ fontSize: 12, color: 'var(--color-geo-text-dim)' }}>{selected.clientAddress}</div></div>
                        <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Técnico Asignado</span><div style={{ marginTop: 4 }}>{getTechName(selected.technicianId)}</div></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase' }}>Fecha Inicio</span><div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} /> {selected.scheduledDate}</div></div>
                            <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase' }}>Fecha Fin</span><div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} /> {selected.endDate || '—'}</div></div>
                            <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase' }}>Duración</span><div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {selected.estimatedDuration}</div></div>
                        </div>
                        <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ubicación de Servicio</span><div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {selected.lat?.toFixed(4)}, {selected.lng?.toFixed(4)}</div></div>
                        {selected.description && <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción</span><p style={{ marginTop: 4, lineHeight: 1.5 }}>{selected.description}</p></div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                        <BtnPrimary onClick={() => { setForm(selected); setModal('edit'); }} style={{ flex: 1, textAlign: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Edit size={14} /> Editar</span>
                        </BtnPrimary>
                        <BtnDanger onClick={() => setArchiveId(selected.id)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Archive size={14} /> Archivar
                        </BtnDanger>
                    </div>

                    {/* Comments Section */}
                    <div style={{ marginTop: 20, borderTop: '1px solid var(--color-geo-border)', paddingTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <MessageSquare size={13} /> Comentarios ({comments.length})
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 10 }}>
                            {comments.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 12, color: 'var(--color-geo-text-dim)', fontSize: 12 }}>Sin comentarios</div>
                            )}
                            {comments.map(c => (
                                <div key={c.id} style={{ padding: '8px 10px', background: 'var(--color-geo-surface-2)', borderRadius: 8, fontSize: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                        <span style={{ fontWeight: 700, color: 'var(--color-geo-primary-light)' }}>{c.authorName}</span>
                                        <span style={{ fontSize: 10, color: 'var(--color-geo-text-dim)' }}>{new Date(c.createdAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div style={{ color: 'var(--color-geo-text-muted)', lineHeight: 1.4 }}>{c.text}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                            <input
                                className="geo-input"
                                placeholder="Escribir comentario..."
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                style={{ flex: 1, fontSize: 12, padding: '8px 10px' }}
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                style={{
                                    width: 34, height: 34, borderRadius: 8, border: 'none',
                                    background: newComment.trim() ? 'var(--color-geo-primary)' : 'var(--color-geo-surface-2)',
                                    color: '#fff', cursor: newComment.trim() ? 'pointer' : 'default',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Nueva Orden de Trabajo' : 'Editar Orden'} subtitle="Datos de la OT" width={600} footer={<><BtnSecondary onClick={() => setModal(null)}>Cancelar</BtnSecondary><BtnPrimary onClick={handleSave}>Guardar</BtnPrimary></>}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <FormField label="Título"><input className="geo-input" style={{ width: '100%' }} value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="Instalación eléctrica..." /></FormField>
                    <FormField label="Cliente"><input className="geo-input" style={{ width: '100%' }} value={form.client || ''} onChange={e => set('client', e.target.value)} /></FormField>
                    <FormField label="Dirección del Cliente"><input className="geo-input" style={{ width: '100%' }} value={form.clientAddress || ''} onChange={e => set('clientAddress', e.target.value)} /></FormField>
                    <FormField label="Técnico Asignado">
                        <select className="geo-input" style={{ width: '100%', appearance: 'none' }} value={form.technicianId || ''} onChange={e => set('technicianId', e.target.value)}>
                            <option value="">Seleccionar técnico...</option>
                            {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </FormField>
                    <FormField label="Fecha Inicio"><input className="geo-input" type="date" style={{ width: '100%' }} value={form.scheduledDate || ''} onChange={e => set('scheduledDate', e.target.value)} /></FormField>
                    <FormField label="Fecha Fin" hint="Dejar vacío para 1 día"><input className="geo-input" type="date" style={{ width: '100%' }} value={form.endDate || ''} onChange={e => set('endDate', e.target.value)} /></FormField>
                    <FormField label="Duración Estimada"><input className="geo-input" style={{ width: '100%' }} value={form.estimatedDuration || ''} onChange={e => set('estimatedDuration', e.target.value)} placeholder="2h" /></FormField>
                    <FormField label="Prioridad">
                        <select className="geo-input" style={{ width: '100%', appearance: 'none' }} value={form.priority || 'media'} onChange={e => set('priority', e.target.value)}>
                            <option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
                        </select>
                    </FormField>
                    <FormField label="Estado">
                        <select className="geo-input" style={{ width: '100%', appearance: 'none' }} value={form.status || 'pendiente'} onChange={e => set('status', e.target.value)}>
                            <option value="pendiente">Pendiente</option><option value="en-progreso">En Progreso</option><option value="en-ruta">En Ruta</option><option value="en-servicio">En Servicio</option><option value="completada">Completada</option><option value="cancelada">Cancelada</option>
                        </select>
                    </FormField>
                </div>
                {/* Map Picker */}
                <div style={{ marginTop: 8, borderTop: '1px solid var(--color-geo-border)', paddingTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <MapPin size={13} /> Ubicación
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-geo-text-muted)' }}>
                            {(form.lat ?? 19.4326).toFixed(4)}, {(form.lng ?? -99.1332).toFixed(4)}
                        </div>
                    </div>
                    <div style={{ height: 220, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-geo-border)' }}>
                        <MapContainer
                            center={[form.lat ?? 19.4326, form.lng ?? -99.1332]}
                            zoom={14}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                        >
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <Marker position={[form.lat ?? 19.4326, form.lng ?? -99.1332]} icon={pinIcon} />
                            <MapClickHandler onMove={(lat, lng) => setForm(f => ({ ...f, lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 }))} />
                            <RecenterMap lat={form.lat ?? 19.4326} lng={form.lng ?? -99.1332} />
                        </MapContainer>
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--color-geo-text-dim)', marginTop: 6, textAlign: 'center' }}>Haz clic en el mapa para seleccionar la ubicación</p>
                </div>
                <FormField label="Descripción"><textarea className="geo-input" style={{ width: '100%', minHeight: 70, resize: 'vertical' }} value={form.description || ''} onChange={e => set('description', e.target.value)} /></FormField>
            </Modal>

            <ConfirmDialog open={!!archiveId} onClose={() => setArchiveId(null)} onConfirm={() => { if (archiveId) handleArchive(archiveId); setArchiveId(null); }} message="Esta orden será archivada. El historial se conservará pero no aparecerá en la vista activa." confirmText="Archivar" />
        </div>
    );
}
