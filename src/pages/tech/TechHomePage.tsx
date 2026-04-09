import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { authFetch } from '../../hooks/authFetch';
import { getDefaultCoordinates } from '../../utils/geo-defaults';
import { Clock, MapPin, ChevronRight, Zap, Navigation } from 'lucide-react';

interface WorkOrder {
    id: string; title: string; client: string; clientAddress: string;
    technicianId: string; status: string; priority: string;
    scheduledDate: string; endDate: string; estimatedDuration: string; description: string;
    lat: number; lng: number; materials: string;
}

interface Tech { id: string; name: string; status: string; completedOrders: number; rating: number; hoursLogged: number; lat: number; lng: number; }

const statusColors: Record<string, string> = {
    'pendiente': '#f59e0b', 'en-progreso': '#3b82f6', 'en-ruta': '#8b5cf6',
    'en-servicio': '#f97316', 'completada': '#10b981', 'cancelada': '#ef4444',
};
const priorityColors: Record<string, string> = {
    'urgente': '#ef4444', 'alta': '#f87171', 'media': '#fbbf24', 'baja': '#34d399',
};

const techStatusLabels: Record<string, { label: string; color: string; bg: string }> = {
    'disponible': { label: '🟢 Disponible', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    'en-ruta': { label: '🚗 En Ruta', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    'en-servicio': { label: '🔧 En Servicio', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
    'desconectado': { label: '⚫ Desconectado', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
};

function createOrderMarker(status: string, priority: string) {
    const sc = statusColors[status] || '#64748b';
    const pc = priorityColors[priority] || '#fbbf24';
    return L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:10px;background:${sc};display:flex;align-items:center;justify-content:center;border:2.5px solid ${pc};box-shadow:0 3px 14px rgba(0,0,0,0.5)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
}

function createTechMarker() {
    return L.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#818cf8,#6366f1);display:flex;align-items:center;justify-content:center;border:3px solid #1e293b;box-shadow:0 4px 16px rgba(0,0,0,0.5)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
}

export default function TechHomePage() {
    const { user, tenant } = useAuth();
    const techId = user?.technicianId || '';
    const { data: orders, refetch: refetchOrders } = useApi<WorkOrder[]>('/api/work-orders', []);
    const { data: techs, refetch: refetchTechs } = useApi<Tech[]>('/api/technicians', []);
    const navigate = useNavigate();
    const defaultCoords = useMemo(() => getDefaultCoordinates(tenant?.id), [tenant?.id]);

    const tech = techs.find(t => t.id === techId);
    const currentStatus = techStatusLabels[tech?.status || 'disponible'] || techStatusLabels['disponible'];

    const todayStr = new Date().toISOString().slice(0, 10);
    const myOrders = orders.filter(o => o.technicianId === techId);
    const todayOrders = myOrders.filter(o => {
        const end = o.endDate || o.scheduledDate;
        return o.scheduledDate <= todayStr && end >= todayStr;
    });
    const pendingToday = todayOrders.filter(o => o.status === 'pendiente' || o.status === 'en-progreso' || o.status === 'en-ruta' || o.status === 'en-servicio');
    const completedToday = todayOrders.filter(o => o.status === 'completada');

    // Map: all my active orders with valid coords
    const mapOrders = myOrders.filter(o => o.lat && o.lng && o.status !== 'cancelada');
    const mapCenter: [number, number] = useMemo(() => {
        if (tech?.lat && tech?.lng) return [tech.lat, tech.lng];
        if (mapOrders.length > 0) return [mapOrders[0].lat, mapOrders[0].lng];
        return [defaultCoords.lat, defaultCoords.lng];
    }, [tech, mapOrders, defaultCoords]);

    const [statusChanging, setStatusChanging] = useState(false);
    const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');
    const cycleStatus = async () => {
        if (!tech) return;
        const cycle = ['disponible', 'en-ruta', 'en-servicio', 'disponible'];
        const next = cycle[(cycle.indexOf(tech.status) + 1) % cycle.length] || 'disponible';
        setStatusChanging(true);
        await authFetch(`/api/technicians/${techId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: next }),
        });
        setStatusChanging(false);
        refetchTechs();
        refetchOrders();
    };

    const firstName = user?.name?.split(' ')[0] || 'Técnico';

    return (
        <div className="tech-animate" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Greeting */}
            <div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Hola, {firstName} 👋</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                    {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* Status Button */}
            <button
                className="tech-status-btn"
                onClick={cycleStatus}
                disabled={statusChanging}
                style={{ background: currentStatus.bg, color: currentStatus.color, border: `1px solid ${currentStatus.color}30` }}
            >
                <Zap size={16} />
                {statusChanging ? 'Cambiando...' : currentStatus.label}
            </button>

            {/* KPIs */}
            <div className="tech-kpi-grid">
                <div className="tech-kpi">
                    <div className="tech-kpi-value" style={{ color: '#818cf8' }}>{todayOrders.length}</div>
                    <div className="tech-kpi-label">Hoy</div>
                </div>
                <div className="tech-kpi">
                    <div className="tech-kpi-value" style={{ color: '#f59e0b' }}>{pendingToday.length}</div>
                    <div className="tech-kpi-label">Pendientes</div>
                </div>
                <div className="tech-kpi">
                    <div className="tech-kpi-value" style={{ color: '#10b981' }}>{completedToday.length}</div>
                    <div className="tech-kpi-label">Completadas</div>
                </div>
            </div>

            {/* ── MAP ── */}
            {mapOrders.length > 0 && (
                <div>
                    <div className="tech-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Navigation size={13} /> Mapa de Órdenes
                    </div>
                    <div style={{
                        borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)',
                        height: 260, position: 'relative'
                    }}>
                        {/* Map Mode Toggle */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setMapTheme(t => t === 'dark' ? 'light' : 'dark'); }}
                            style={{
                                position: 'absolute', top: 10, right: 10, zIndex: 1000,
                                background: mapTheme === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)', 
                                backdropFilter: 'blur(12px)',
                                borderRadius: 8, padding: '6px 10px', border: '1px solid rgba(148,163,184,0.2)',
                                color: mapTheme === 'dark' ? '#94a3b8' : '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}
                        >
                            {mapTheme === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
                        </button>
                        <MapContainer
                            center={mapCenter}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                            attributionControl={false}
                        >
                            <TileLayer url={`https://{s}.basemaps.cartocdn.com/${mapTheme}_all/{z}/{x}/{y}{r}.png`} />

                            {/* Technician position */}
                            {tech?.lat && tech?.lng && (
                                <Marker position={[tech.lat, tech.lng]} icon={createTechMarker()}>
                                    <Popup>
                                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, minWidth: 120 }}>
                                            <div style={{ fontWeight: 800, fontSize: 13 }}>📍 Mi ubicación</div>
                                            <div style={{ color: '#64748b', marginTop: 2 }}>{user?.name}</div>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}

                            {/* Order markers */}
                            {mapOrders.map(order => {
                                const sc = statusColors[order.status] || '#64748b';
                                return (
                                    <Marker
                                        key={order.id}
                                        position={[order.lat, order.lng]}
                                        icon={createOrderMarker(order.status, order.priority)}
                                    >
                                        <Popup>
                                            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, minWidth: 170, lineHeight: 1.5 }}>
                                                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{order.id} · {order.title}</div>
                                                <div style={{ color: '#64748b' }}>🏢 {order.client}</div>
                                                <div style={{ color: '#64748b' }}>📍 {order.clientAddress?.split(',')[0] || '—'}</div>
                                                <div style={{ color: '#64748b' }}>⏱ {order.estimatedDuration} · 📅 {order.scheduledDate}</div>
                                                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                                        background: `${sc}25`, color: sc,
                                                    }}>{order.status.replace('-', ' ')}</span>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/tech/ordenes/${order.id}`)}
                                                    style={{
                                                        marginTop: 8, width: '100%', padding: '6px 0',
                                                        borderRadius: 6, border: 'none',
                                                        background: '#818cf8', color: 'white',
                                                        fontWeight: 700, fontSize: 12, cursor: 'pointer',
                                                    }}
                                                >
                                                    Ver Detalle →
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>
                    </div>
                </div>
            )}

            {/* Today's Orders */}
            <div>
                <div className="tech-section-title">Órdenes de Hoy</div>
                {pendingToday.length === 0 && (
                    <div className="tech-card" style={{ textAlign: 'center', color: '#64748b', padding: 24, fontSize: 13 }}>
                        🎉 No tienes órdenes pendientes hoy
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pendingToday.slice(0, 5).map(order => (
                        <div
                            key={order.id}
                            className="tech-order-card"
                            onClick={() => navigate(`/tech/ordenes/${order.id}`)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{order.id}</span>
                                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{order.title}</div>
                                </div>
                                <ChevronRight size={18} style={{ color: '#64748b' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#94a3b8' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <MapPin size={12} /> {order.clientAddress?.split(',')[0] || order.client}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={12} /> {order.estimatedDuration}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span className="tech-badge" style={{
                                    background: `${statusColors[order.status] || '#64748b'}20`,
                                    color: statusColors[order.status] || '#64748b',
                                }}>
                                    {order.status.replace('-', ' ')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
