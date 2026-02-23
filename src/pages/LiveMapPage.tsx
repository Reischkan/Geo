import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Phone, MapPin, Zap, ChevronDown } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';

interface Tech {
    id: string; name: string; avatar: string; status: string;
    phone: string; lat: number; lng: number; role: string;
}

const statusLabels: Record<string, string> = { 'en-ruta': 'En Ruta', 'en-servicio': 'En Servicio', 'disponible': 'Disponible', 'desconectado': 'Desconectado' };
const statusColors: Record<string, string> = { 'en-ruta': '#3b82f6', 'en-servicio': '#10b981', 'disponible': '#f59e0b', 'desconectado': '#64748b' };

function createTechIcon(color: string, initials: string) {
    return L.divIcon({
        className: '',
        html: `<div style="width:38px;height:38px;border-radius:12px;background:${color};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;border:3px solid #1e293b;box-shadow:0 4px 16px rgba(0,0,0,0.5);font-family:Inter,sans-serif">${initials}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
    });
}

export default function LiveMapPage() {
    const { data: techs, refetch } = useApi<Tech[]>('/api/technicians', []);
    const { toast } = useToast();
    const [selected, setSelected] = useState<Tech | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = techs.filter(t => statusFilter === 'all' || t.status === statusFilter);
    const activeTechs = techs.filter(t => t.status !== 'desconectado');

    const handleStatusChange = async (techId: string, newStatus: string) => {
        const res = await fetch(`/api/technicians/${techId}`, {
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
                    <p style={{ fontSize: 12, color: 'var(--color-geo-text-dim)', marginTop: 4 }}>{activeTechs.length} técnicos activos</p>
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
                    {filtered.map(tech => (
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
                    ))}
                </div>
            </div>

            {/* Map */}
            <div className="glass-card" style={{ flex: 1, overflow: 'hidden', borderRadius: 16, padding: 0 }}>
                <MapContainer
                    center={[19.425, -99.17]}
                    zoom={12}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    {filtered.map(tech => (
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
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
