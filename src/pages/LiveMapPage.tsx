import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Phone, MapPin, Zap, ChevronDown, ClipboardList, Users } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { authFetch } from '../hooks/authFetch';
import { useToast } from '../components/Toast';

interface Tech {
    id: string; name: string; avatar: string; status: string;
    phone: string; lat: number; lng: number; role: string;
}
interface Order {
    id: string; title: string; client: string; clientAddress: string;
    technicianId: string; status: string; priority: string;
    scheduledDate: string; estimatedDuration: string; lat: number; lng: number;
}

const statusLabels: Record<string, string> = { 'en-ruta': 'En Ruta', 'en-servicio': 'En Servicio', 'disponible': 'Disponible', 'desconectado': 'Desconectado' };
const statusColors: Record<string, string> = { 'en-ruta': '#3b82f6', 'en-servicio': '#10b981', 'disponible': '#f59e0b', 'desconectado': '#64748b' };
const orderStatusLabels: Record<string, string> = { 'pendiente': 'Pendiente', 'en-progreso': 'En Progreso', 'completada': 'Completada', 'cancelada': 'Cancelada' };
const orderStatusColors: Record<string, string> = { 'pendiente': '#f59e0b', 'en-progreso': '#3b82f6', 'completada': '#10b981', 'cancelada': '#ef4444' };
const priorityLabels: Record<string, string> = { 'urgente': 'Urgente', 'alta': 'Alta', 'media': 'Media', 'baja': 'Baja' };
const priorityColors: Record<string, string> = { 'urgente': '#ef4444', 'alta': '#f87171', 'media': '#fbbf24', 'baja': '#34d399' };

/* ── Icon factories ────────────────────────── */

function createTechIcon(color: string, initials: string) {
    return L.divIcon({
        className: '',
        html: `<div style="width:38px;height:38px;border-radius:12px;background:${color};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;border:3px solid #1e293b;box-shadow:0 4px 16px rgba(0,0,0,0.5);font-family:Inter,sans-serif">${initials}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
    });
}

function createOrderIcon(statusColor: string, priorityColor: string) {
    return L.divIcon({
        className: '',
        html: `<div style="width:30px;height:30px;border-radius:8px;background:${statusColor};display:flex;align-items:center;justify-content:center;border:2px solid ${priorityColor};box-shadow:0 3px 12px rgba(0,0,0,0.4)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });
}

/** Fused icon: technician initials + order clipboard merged into one marker */
function createFusedIcon(techColor: string, initials: string, orderId: string) {
    return L.divIcon({
        className: '',
        html: `<div style="display:flex;align-items:center;gap:0;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5))">
            <div style="width:38px;height:38px;border-radius:12px 0 0 12px;background:${techColor};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;border:3px solid #1e293b;border-right:none;font-family:Inter,sans-serif">${initials}</div>
            <div style="width:34px;height:38px;border-radius:0 12px 12px 0;background:#10b981;display:flex;flex-direction:column;align-items:center;justify-content:center;border:3px solid #1e293b;border-left:1px solid rgba(255,255,255,0.15)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>
                <span style="font-size:7px;font-weight:700;color:rgba(255,255,255,0.8);margin-top:1px;font-family:Inter,sans-serif">${orderId}</span>
            </div>
        </div>`,
        iconSize: [72, 38],
        iconAnchor: [36, 19],
    });
}

/** En-ruta tech: pulsing blue border */
function createEnRutaTechIcon(color: string, initials: string) {
    return L.divIcon({
        className: '',
        html: `<div style="position:relative;width:44px;height:44px">
            <div style="position:absolute;inset:0;border-radius:14px;border:2px solid ${color};animation:pulse-ring 1.5s ease-out infinite;opacity:0.6"></div>
            <div style="position:absolute;inset:3px;width:38px;height:38px;border-radius:12px;background:${color};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;border:3px solid #1e293b;box-shadow:0 4px 16px rgba(0,0,0,0.5);font-family:Inter,sans-serif">${initials}</div>
        </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
    });
}

/* ── Inject keyframe animation ────────────── */
if (typeof document !== 'undefined' && !document.getElementById('geo-map-animations')) {
    const style = document.createElement('style');
    style.id = 'geo-map-animations';
    style.textContent = `
        @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(1.6); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

/* ── Component ─────────────────────────────── */

export default function LiveMapPage() {
    const { data: techs, refetch } = useApi<Tech[]>('/api/technicians', []);
    const { data: orders } = useApi<Order[]>('/api/work-orders', []);
    const { toast } = useToast();
    const [selected, setSelected] = useState<Tech | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [showTechs, setShowTechs] = useState(true);
    const [showOrders, setShowOrders] = useState(true);

    const filtered = techs.filter(t => statusFilter === 'all' || t.status === statusFilter);
    const activeTechs = techs.filter(t => t.status !== 'desconectado');
    const activeOrders = orders.filter(o => o.status !== 'cancelada' && o.status !== 'completada');
    const getTechName = (id: string) => techs.find(t => t.id === id)?.name || id;

    // Map each tech to their active order (en-progreso first, then pendiente)
    const techOrderMap = useMemo(() => {
        const map = new Map<string, Order>();
        for (const tech of techs) {
            const active = orders.find(o => o.technicianId === tech.id && o.status === 'en-progreso')
                || orders.find(o => o.technicianId === tech.id && o.status === 'pendiente');
            if (active) map.set(tech.id, active);
        }
        return map;
    }, [techs, orders]);

    // Orders that are being "serviced" (fused with tech) — hide their standalone marker
    const fusedOrderIds = useMemo(() => {
        const ids = new Set<string>();
        for (const tech of techs) {
            if (tech.status === 'en-servicio') {
                const order = techOrderMap.get(tech.id);
                if (order) ids.add(order.id);
            }
        }
        return ids;
    }, [techs, techOrderMap]);

    const handleStatusChange = async (techId: string, newStatus: string) => {
        const res = await authFetch(`/api/technicians/${techId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
            toast('success', `Estado actualizado a "${statusLabels[newStatus]}"`);
            refetch();
            setSelected(s => s && s.id === techId ? { ...s, status: newStatus } : s);
        } else toast('error', 'Error al actualizar estado');
    };

    const handleQuickDispatch = (tech: Tech) => {
        toast('success', `🚀 Despacho rápido enviado a ${tech.name}`);
    };

    return (
        <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 108px)' }}>
            {/* Sidebar list */}
            <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Mapa en Vivo</h1>
                    <p style={{ fontSize: 12, color: 'var(--color-geo-text-dim)', marginTop: 4 }}>
                        {activeTechs.length} técnicos · {activeOrders.length} OTs activas
                    </p>
                </div>

                {/* Layer toggles */}
                <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setShowTechs(v => !v)} style={{
                        flex: 1, padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        background: showTechs ? 'rgba(59,130,246,0.15)' : 'var(--color-geo-surface-2)',
                        color: showTechs ? '#60a5fa' : 'var(--color-geo-text-dim)',
                    }}>
                        <Users size={13} /> Técnicos
                    </button>
                    <button onClick={() => setShowOrders(v => !v)} style={{
                        flex: 1, padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        background: showOrders ? 'rgba(245,158,11,0.15)' : 'var(--color-geo-surface-2)',
                        color: showOrders ? '#fbbf24' : 'var(--color-geo-text-dim)',
                    }}>
                        <ClipboardList size={13} /> Órdenes
                    </button>
                </div>

                {/* Status filter */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {['all', 'en-ruta', 'en-servicio', 'disponible', 'desconectado'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)} style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                            background: statusFilter === s ? (s === 'all' ? 'var(--color-geo-primary)' : `${statusColors[s]}20`) : 'var(--color-geo-surface-2)',
                            color: statusFilter === s ? (s === 'all' ? '#fff' : statusColors[s]) : 'var(--color-geo-text-dim)',
                        }}>
                            {s === 'all' ? 'Todos' : statusLabels[s]}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.map(tech => {
                        const assignedOrder = techOrderMap.get(tech.id);
                        return (
                            <div
                                key={tech.id}
                                className="glass-card"
                                style={{
                                    padding: 14, cursor: 'pointer',
                                    borderColor: selected?.id === tech.id ? 'var(--color-geo-primary)' : undefined,
                                }}
                                onClick={() => setSelected(tech)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: statusColors[tech.status], display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff',
                                    }}>
                                        {tech.avatar}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>{tech.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--color-geo-text-dim)' }}>{tech.role}</div>
                                    </div>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[tech.status], flexShrink: 0 }} />
                                </div>
                                {/* Assigned order indicator */}
                                {assignedOrder && (tech.status === 'en-ruta' || tech.status === 'en-servicio') && (
                                    <div style={{
                                        marginTop: 8, padding: '6px 10px', borderRadius: 6, fontSize: 10,
                                        background: tech.status === 'en-ruta' ? 'rgba(59,130,246,0.08)' : 'rgba(16,185,129,0.08)',
                                        border: `1px solid ${tech.status === 'en-ruta' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)'}`,
                                        color: 'var(--color-geo-text-muted)',
                                    }}>
                                        <span style={{ fontWeight: 700, color: tech.status === 'en-ruta' ? '#60a5fa' : '#34d399' }}>
                                            {tech.status === 'en-ruta' ? '→' : '⚡'} {assignedOrder.id}
                                        </span>
                                        <span style={{ marginLeft: 6 }}>{assignedOrder.title}</span>
                                    </div>
                                )}
                                {/* Status change dropdown */}
                                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <select
                                            className="geo-input"
                                            value={tech.status}
                                            onChange={(e) => { e.stopPropagation(); handleStatusChange(tech.id, e.target.value); }}
                                            onClick={e => e.stopPropagation()}
                                            style={{ width: '100%', fontSize: 11, padding: '4px 8px', appearance: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="disponible">Disponible</option>
                                            <option value="en-ruta">En Ruta</option>
                                            <option value="en-servicio">En Servicio</option>
                                            <option value="desconectado">Fuera de Servicio</option>
                                        </select>
                                        <ChevronDown size={10} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-geo-text-dim)', pointerEvents: 'none' }} />
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleQuickDispatch(tech); }}
                                        style={{
                                            padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600,
                                            background: 'rgba(245,158,11,0.12)', color: '#fbbf24', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 4,
                                        }}
                                        title="Despacho Rápido"
                                    >
                                        <Zap size={12} /> Despacho
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Orders list in sidebar */}
                    {showOrders && activeOrders.length > 0 && (
                        <>
                            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-geo-text-dim)', padding: '8px 0 2px', marginTop: 4 }}>
                                Órdenes Activas ({activeOrders.length})
                            </div>
                            {activeOrders.map(order => (
                                <div key={order.id} className="glass-card" style={{ padding: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <div style={{
                                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                            background: orderStatusColors[order.status],
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <ClipboardList size={14} color="#fff" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.title}</div>
                                            <div style={{ fontSize: 11, color: 'var(--color-geo-text-dim)', marginTop: 2 }}>{order.client}</div>
                                            <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                                                <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: `${orderStatusColors[order.status]}20`, color: orderStatusColors[order.status] }}>
                                                    {orderStatusLabels[order.status]}
                                                </span>
                                                <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: `${priorityColors[order.priority]}20`, color: priorityColors[order.priority] }}>
                                                    {priorityLabels[order.priority]}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Map */}
            <div className="glass-card" style={{ flex: 1, overflow: 'hidden', borderRadius: 16, padding: 0 }}>
                <MapContainer
                    center={[19.41, -99.17]}
                    zoom={12}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    {/* ── TECHNICIAN MARKERS (status-aware) ── */}
                    {showTechs && filtered.map(tech => {
                        const assignedOrder = techOrderMap.get(tech.id);

                        // EN-SERVICIO: fused marker at the ORDER location
                        if (tech.status === 'en-servicio' && assignedOrder) {
                            return (
                                <Marker
                                    key={tech.id}
                                    position={[assignedOrder.lat, assignedOrder.lng]}
                                    icon={createFusedIcon(statusColors[tech.status], tech.avatar, assignedOrder.id)}
                                    eventHandlers={{ click: () => setSelected(tech) }}
                                >
                                    <Popup>
                                        <div style={{ padding: 4, minWidth: 220 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{tech.name}</div>
                                            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginBottom: 8 }}>⚡ En Servicio — en sitio</div>
                                            <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: 8, marginBottom: 4 }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{assignedOrder.id}</div>
                                                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{assignedOrder.title}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{assignedOrder.client}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                                                <Phone size={12} /> {tech.phone}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        }

                        // EN-RUTA: pulsing tech marker at TECH location (route line rendered separately)
                        if (tech.status === 'en-ruta' && assignedOrder) {
                            return (
                                <Marker
                                    key={tech.id}
                                    position={[tech.lat, tech.lng]}
                                    icon={createEnRutaTechIcon(statusColors[tech.status], tech.avatar)}
                                    eventHandlers={{ click: () => setSelected(tech) }}
                                >
                                    <Popup>
                                        <div style={{ padding: 4, minWidth: 200 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{tech.name}</div>
                                            <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, marginBottom: 6 }}>→ En Ruta hacia orden</div>
                                            <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 8, padding: 8, marginBottom: 4 }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{assignedOrder.id}</div>
                                                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{assignedOrder.title}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{assignedOrder.clientAddress}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                                                <Phone size={12} /> {tech.phone}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        }

                        // DISPONIBLE / DESCONECTADO: normal marker at tech location
                        return (
                            <Marker
                                key={tech.id}
                                position={[tech.lat, tech.lng]}
                                icon={createTechIcon(statusColors[tech.status], tech.avatar)}
                                eventHandlers={{ click: () => setSelected(tech) }}
                            >
                                <Popup>
                                    <div style={{ padding: 4, minWidth: 180 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{tech.name}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Navigation size={12} /> {statusLabels[tech.status]}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Phone size={12} /> {tech.phone}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <MapPin size={12} /> {tech.lat.toFixed(4)}, {tech.lng.toFixed(4)}
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* ── ROUTE LINES for en-ruta techs ── */}
                    {showTechs && techs.filter(t => t.status === 'en-ruta').map(tech => {
                        const order = techOrderMap.get(tech.id);
                        if (!order) return null;
                        // Should this tech be visible given the filter?
                        if (statusFilter !== 'all' && statusFilter !== 'en-ruta') return null;
                        return (
                            <Polyline
                                key={`route-${tech.id}`}
                                positions={[[tech.lat, tech.lng], [order.lat, order.lng]]}
                                pathOptions={{
                                    color: '#3b82f6',
                                    weight: 3,
                                    dashArray: '8, 8',
                                    opacity: 0.7,
                                }}
                            />
                        );
                    })}

                    {/* ── WORK ORDER MARKERS (skip fused ones) ── */}
                    {showOrders && orders.filter(o => o.status !== 'cancelada' && !fusedOrderIds.has(o.id)).map(order => (
                        <Marker
                            key={`order-${order.id}`}
                            position={[order.lat, order.lng]}
                            icon={createOrderIcon(orderStatusColors[order.status], priorityColors[order.priority])}
                        >
                            <Popup>
                                <div style={{ padding: 4, minWidth: 220 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{order.id}</span>
                                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: orderStatusColors[order.status], color: '#fff' }}>
                                            {orderStatusLabels[order.status]}
                                        </span>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{order.title}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8' }}>
                                            <span style={{ fontWeight: 600 }}>Cliente:</span> {order.client}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8' }}>
                                            <span style={{ fontWeight: 600 }}>Técnico:</span> {getTechName(order.technicianId)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8' }}>
                                            <span style={{ fontWeight: 600 }}>Prioridad:</span>
                                            <span style={{ color: priorityColors[order.priority], fontWeight: 700 }}>
                                                {priorityLabels[order.priority]}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8' }}>
                                            <MapPin size={12} /> {order.clientAddress}
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Map Legend */}
                <div style={{
                    position: 'absolute', bottom: 20, right: 20, zIndex: 1000,
                    background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)',
                    borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(148,163,184,0.1)',
                    fontSize: 11, color: '#94a3b8',
                }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leyenda</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: '#f59e0b' }} /> Disponible
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: '#3b82f6', position: 'relative' }}>
                                <div style={{ position: 'absolute', inset: -2, borderRadius: 6, border: '1px dashed #3b82f6' }} />
                            </div> En Ruta
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ display: 'flex' }}>
                                <div style={{ width: 10, height: 14, borderRadius: '4px 0 0 4px', background: '#10b981' }} />
                                <div style={{ width: 10, height: 14, borderRadius: '0 4px 4px 0', background: '#10b981', opacity: 0.6 }} />
                            </div> En Servicio (fusionado)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: '#64748b' }} /> Desconectado
                        </div>
                        <div style={{ height: 1, background: 'rgba(148,163,184,0.15)', margin: '2px 0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 3, background: '#3b82f6', borderRadius: 2 }} /> Ruta técnico → OT
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: '#3b82f6', opacity: 0.7 }} /> Orden de Trabajo
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
