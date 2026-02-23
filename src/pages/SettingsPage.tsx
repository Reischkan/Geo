import { useState } from 'react';
import { Building2, FileText, Shield, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../components/Toast';
import { FormField, BtnPrimary, BtnDanger } from '../components/Modal';

export default function SettingsPage() {
    const { toast } = useToast();

    const [company, setCompany] = useState({
        name: 'GeoField MX S.A. de C.V.',
        nit: 'GFM260101ABC',
        address: 'Av. Revolución 1234, Col. Mixcoac, CDMX',
        phone: '+52 55 0000 1111',
        email: 'admin@geofield.mx',
    });

    const [templates, setTemplates] = useState([
        { id: 1, name: 'Reporte Estándar OT', description: 'Incluye datos del cliente, técnico, evidencias fotográficas y firma' },
        { id: 2, name: 'Reporte de Proyecto', description: 'Resumen de sesiones completadas, avance porcentual y materiales usados' },
        { id: 3, name: 'Comprobante de Servicio', description: 'Formato corto para firma del cliente al finalizar la visita' },
    ]);

    const [roles] = useState([
        { name: 'Super Admin', permissions: 'Todos los módulos', users: 1, color: '#ef4444' },
        { name: 'Dispatcher', permissions: 'OTs, Calendario, Mapa, Técnicos', users: 2, color: '#3b82f6' },
        { name: 'Inventario', permissions: 'Inventario, Reportes', users: 1, color: '#10b981' },
        { name: 'Visor', permissions: 'Dashboard, Mapa (solo lectura)', users: 3, color: '#f59e0b' },
    ]);

    const handleSaveCompany = () => { toast('success', 'Datos de empresa actualizados'); };
    const handleDeleteTemplate = (id: number) => {
        setTemplates(t => t.filter(x => x.id !== id));
        toast('success', 'Plantilla eliminada');
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Configuración</h1>
                <p style={{ fontSize: 14, color: 'var(--color-geo-text-muted)', marginTop: 4 }}>
                    Datos de empresa, plantillas de reportes y roles
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Company Info */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={18} style={{ color: '#60a5fa' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Datos de Empresa</h2>
                            <p style={{ fontSize: 12, color: 'var(--color-geo-text-dim)' }}>Aparecen en reportes y comprobantes</p>
                        </div>
                    </div>
                    <FormField label="Razón Social"><input className="geo-input" style={{ width: '100%' }} value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} /></FormField>
                    <FormField label="NIT / RFC"><input className="geo-input" style={{ width: '100%' }} value={company.nit} onChange={e => setCompany(c => ({ ...c, nit: e.target.value }))} /></FormField>
                    <FormField label="Dirección"><input className="geo-input" style={{ width: '100%' }} value={company.address} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} /></FormField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <FormField label="Teléfono"><input className="geo-input" style={{ width: '100%' }} value={company.phone} onChange={e => setCompany(c => ({ ...c, phone: e.target.value }))} /></FormField>
                        <FormField label="Email"><input className="geo-input" style={{ width: '100%' }} value={company.email} onChange={e => setCompany(c => ({ ...c, email: e.target.value }))} /></FormField>
                    </div>
                    <BtnPrimary onClick={handleSaveCompany} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Save size={14} /> Guardar Cambios
                    </BtnPrimary>
                </div>

                {/* Roles */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={18} style={{ color: '#a78bfa' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Roles y Permisos</h2>
                            <p style={{ fontSize: 12, color: 'var(--color-geo-text-dim)' }}>Control de acceso por rol</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {roles.map(r => (
                            <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'var(--color-geo-surface-2)' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-geo-text)' }}>{r.name}</span>
                                    </div>
                                    <span style={{ fontSize: 12, color: 'var(--color-geo-text-dim)' }}>{r.permissions}</span>
                                </div>
                                <span className="badge badge-progress">{r.users} usuario{r.users > 1 ? 's' : ''}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Report Templates */}
            <div className="glass-card" style={{ padding: 24, marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={18} style={{ color: '#34d399' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Plantillas de Reportes</h2>
                            <p style={{ fontSize: 12, color: 'var(--color-geo-text-dim)' }}>Formatos PDF para clientes</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setTemplates(t => [...t, { id: Date.now(), name: 'Nueva Plantilla', description: 'Descripción de la plantilla' }]);
                            toast('success', 'Plantilla creada');
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, background: 'var(--color-geo-primary)', color: '#fff', cursor: 'pointer' }}
                    >
                        <Plus size={14} /> Agregar
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {templates.map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, background: 'var(--color-geo-surface-2)' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-geo-text)' }}>{t.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--color-geo-text-dim)', marginTop: 2 }}>{t.description}</div>
                            </div>
                            <button onClick={() => handleDeleteTemplate(t.id)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
