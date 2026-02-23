import { useState } from 'react';
import { Search, Filter, ChevronDown, Clock, User, FileText, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface AuditEntry {
    id: number; timestamp: string; user: string;
    action: string; resource: string; details: string;
}

const actionIcons: Record<string, React.ReactNode> = {
    'CREATE': <CheckCircle size={14} />,
    'UPDATE': <FileText size={14} />,
    'DELETE': <AlertTriangle size={14} />,
    'ARCHIVE': <AlertTriangle size={14} />,
};

const actionColors: Record<string, string> = {
    'CREATE': '#10b981',
    'UPDATE': '#3b82f6',
    'DELETE': '#ef4444',
    'ARCHIVE': '#f59e0b',
};

export default function AuditPage() {
    const { data: logs } = useApi<AuditEntry[]>('/api/audit?limit=200', []);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('all');

    const filtered = logs.filter(l => {
        const matchesSearch = search === '' ||
            l.details.toLowerCase().includes(search.toLowerCase()) ||
            l.resource.toLowerCase().includes(search.toLowerCase()) ||
            l.user.toLowerCase().includes(search.toLowerCase());
        const matchesAction = actionFilter === 'all' || l.action === actionFilter;
        return matchesSearch && matchesAction;
    });

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Auditoría</h1>
                <p style={{ fontSize: 14, color: 'var(--color-geo-text-muted)', marginTop: 4 }}>
                    Registro de todas las acciones administrativas — solo lectura
                </p>
            </div>

            {/* Info banner */}
            <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, borderColor: 'rgba(59,130,246,0.2)' }}>
                <Info size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: 'var(--color-geo-text-muted)' }}>
                    Los registros de auditoría no pueden ser editados ni eliminados por seguridad. Se generan automáticamente con cada operación en el sistema.
                </p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-geo-text-dim)' }} />
                    <input className="geo-input" placeholder="Buscar por acción, recurso o usuario..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: 40 }} />
                </div>
                <div style={{ position: 'relative' }}>
                    <Filter size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-geo-text-dim)', pointerEvents: 'none' }} />
                    <select className="geo-input" value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ paddingLeft: 40, paddingRight: 32, appearance: 'none', cursor: 'pointer', minWidth: 160 }}>
                        <option value="all">Todas las acciones</option>
                        <option value="CREATE">Crear</option>
                        <option value="UPDATE">Editar</option>
                        <option value="DELETE">Eliminar</option>
                        <option value="ARCHIVE">Archivar</option>
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-geo-text-dim)', pointerEvents: 'none' }} />
                </div>
            </div>

            {/* Log table */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                {filtered.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                        <Clock size={40} style={{ color: 'var(--color-geo-text-dim)', marginBottom: 12 }} />
                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-geo-text-muted)' }}>Sin registros de auditoría</p>
                        <p style={{ fontSize: 13, color: 'var(--color-geo-text-dim)', marginTop: 4 }}>Las acciones de los administradores se registrarán aquí automáticamente</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 50 }}>#</th>
                                    <th>Fecha / Hora</th>
                                    <th>Usuario</th>
                                    <th>Acción</th>
                                    <th>Recurso</th>
                                    <th>Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(log => {
                                    const color = actionColors[log.action] || '#64748b';
                                    return (
                                        <tr key={log.id}>
                                            <td style={{ fontWeight: 600, fontSize: 12, color: 'var(--color-geo-text-dim)' }}>{log.id}</td>
                                            <td style={{ fontSize: 13 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Clock size={13} style={{ color: 'var(--color-geo-text-dim)' }} />
                                                    {new Date(log.timestamp).toLocaleString('es-MX')}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <User size={13} style={{ color: 'var(--color-geo-text-dim)' }} />
                                                    {log.user}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                                    padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                                    background: `${color}15`, color,
                                                }}>
                                                    {actionIcons[log.action]} {log.action}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 500, color: 'var(--color-geo-text)' }}>{log.resource}</td>
                                            <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
