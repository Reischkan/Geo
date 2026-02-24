import { useState } from 'react';
import { Star, Phone, MapPin, Clock, CheckCircle, TrendingUp, Plus, Edit, UserX, Search } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { authFetch } from '../hooks/authFetch';
import { useToast } from '../components/Toast';
import Modal, { FormField, BtnPrimary, BtnSecondary } from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { technicians as fallbackTechs } from '../data/mock';
import type { Technician } from '../data/mock';

const statusLabels: Record<string, string> = { 'en-ruta': 'En Ruta', 'en-servicio': 'En Servicio', 'disponible': 'Disponible', 'desconectado': 'Desconectado' };
const statusColors: Record<string, string> = { 'en-ruta': '#3b82f6', 'en-servicio': '#10b981', 'disponible': '#f59e0b', 'desconectado': '#64748b' };
const gradients = ['linear-gradient(135deg, #3b82f6, #06b6d4)', 'linear-gradient(135deg, #8b5cf6, #ec4899)', 'linear-gradient(135deg, #10b981, #06b6d4)', 'linear-gradient(135deg, #f59e0b, #ef4444)', 'linear-gradient(135deg, #6366f1, #8b5cf6)', 'linear-gradient(135deg, #ec4899, #f43f5e)'];

const emptyTech: Partial<Technician> = {
    name: '', avatar: '', role: '', status: 'disponible', phone: '',
    lat: 19.43, lng: -99.13, completedOrders: 0, rating: 5.0, hoursLogged: 0,
};

export default function TechniciansPage() {
    const { data: technicians, refetch } = useApi<Technician[]>('/api/technicians', fallbackTechs);
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [form, setForm] = useState<Partial<Technician>>(emptyTech);
    const [deactivateId, setDeactivateId] = useState<string | null>(null);

    const filtered = technicians.filter(t =>
        search === '' || t.name.toLowerCase().includes(search.toLowerCase()) || t.role.toLowerCase().includes(search.toLowerCase())
    );

    const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        const isNew = modal === 'create';
        const id = isNew ? `T${String(Date.now()).slice(-3)}` : form.id;
        const avatar = form.name ? form.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'XX';
        const body = { ...form, id, avatar };
        const res = await authFetch(isNew ? '/api/technicians' : `/api/technicians/${id}`, {
            method: isNew ? 'POST' : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (res.ok) { toast('success', isNew ? 'Técnico registrado' : 'Técnico actualizado'); setModal(null); refetch(); }
        else toast('error', 'Error al guardar');
    };

    const handleDeactivate = async (id: string) => {
        const res = await authFetch(`/api/technicians/${id}`, { method: 'DELETE' });
        if (res.ok) { toast('success', 'Técnico desactivado'); refetch(); }
        else toast('error', 'Error al desactivar');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Técnicos</h1>
                    <p style={{ fontSize: 14, color: 'var(--color-geo-text-muted)', marginTop: 4 }}>
                        {technicians.length} registrados — {technicians.filter(t => t.status !== 'desconectado').length} activos
                    </p>
                </div>
                <button onClick={() => { setForm(emptyTech); setModal('create'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, background: 'var(--color-geo-primary)', color: '#fff', cursor: 'pointer' }}>
                    <Plus size={16} /> Nuevo Técnico
                </button>
            </div>

            <div style={{ marginBottom: 16, position: 'relative', maxWidth: 400 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-geo-text-dim)' }} />
                <input className="geo-input" placeholder="Buscar técnico..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: 40 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {filtered.map((tech, i) => (
                    <div key={tech.id} className="glass-card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden', animationDelay: `${i * 0.08}s`, opacity: 0 }}>
                        <div style={{ height: 80, background: gradients[i % gradients.length], position: 'relative' }}>
                            <div style={{ position: 'absolute', bottom: -28, left: 20, width: 56, height: 56, borderRadius: 16, background: gradients[i % gradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', border: '3px solid var(--color-geo-surface)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                                {tech.avatar}
                            </div>
                            <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 600, color: statusColors[tech.status] }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[tech.status] }} />
                                {statusLabels[tech.status]}
                            </div>
                            {/* Action buttons */}
                            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 4 }}>
                                <button onClick={() => { setForm(tech); setModal('edit'); }} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(8px)' }}><Edit size={13} /></button>
                                <button onClick={() => setDeactivateId(tech.id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(8px)' }}><UserX size={13} /></button>
                            </div>
                        </div>
                        <div style={{ padding: '36px 20px 20px' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{tech.name}</h3>
                            <p style={{ fontSize: 12, color: 'var(--color-geo-text-dim)', marginBottom: 16 }}>{tech.role}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                                <div style={{ textAlign: 'center', padding: '10px 0', borderRadius: 10, background: 'var(--color-geo-surface-2)' }}><CheckCircle size={15} style={{ color: '#34d399', marginBottom: 4 }} /><div style={{ fontSize: 18, fontWeight: 800 }}>{tech.completedOrders}</div><div style={{ fontSize: 10, color: 'var(--color-geo-text-dim)', marginTop: 2 }}>Completadas</div></div>
                                <div style={{ textAlign: 'center', padding: '10px 0', borderRadius: 10, background: 'var(--color-geo-surface-2)' }}><Star size={15} style={{ color: '#fbbf24', marginBottom: 4 }} /><div style={{ fontSize: 18, fontWeight: 800 }}>{tech.rating}</div><div style={{ fontSize: 10, color: 'var(--color-geo-text-dim)', marginTop: 2 }}>Rating</div></div>
                                <div style={{ textAlign: 'center', padding: '10px 0', borderRadius: 10, background: 'var(--color-geo-surface-2)' }}><Clock size={15} style={{ color: '#60a5fa', marginBottom: 4 }} /><div style={{ fontSize: 18, fontWeight: 800 }}>{tech.hoursLogged}</div><div style={{ fontSize: 10, color: 'var(--color-geo-text-dim)', marginTop: 2 }}>Horas</div></div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--color-geo-text-muted)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={13} style={{ color: 'var(--color-geo-text-dim)' }} /> {tech.phone}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={13} style={{ color: 'var(--color-geo-text-dim)' }} /> {tech.lat.toFixed(4)}, {tech.lng.toFixed(4)}</div>
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={12} /> Rendimiento</span><span style={{ fontSize: 11, fontWeight: 700 }}>{Math.min(100, Math.round((tech.rating / 5) * 100))}%</span></div>
                                <div style={{ height: 5, borderRadius: 3, background: 'var(--color-geo-surface-3)', overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, Math.round((tech.rating / 5) * 100))}%`, background: gradients[i % gradients.length], transition: 'width 1s ease' }} /></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo Técnico' : 'Editar Técnico'} subtitle="Datos del técnico y acceso" footer={<><BtnSecondary onClick={() => setModal(null)}>Cancelar</BtnSecondary><BtnPrimary onClick={handleSave}>Guardar</BtnPrimary></>}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <FormField label="Nombre Completo"><input className="geo-input" style={{ width: '100%' }} value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Carlos López" /></FormField>
                    <FormField label="Rol / Especialidad"><input className="geo-input" style={{ width: '100%' }} value={form.role || ''} onChange={e => set('role', e.target.value)} placeholder="Electricista Industrial" /></FormField>
                    <FormField label="Teléfono"><input className="geo-input" style={{ width: '100%' }} value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+52 55 1234 5678" /></FormField>
                    <FormField label="Estado">
                        <select className="geo-input" style={{ width: '100%', appearance: 'none' }} value={form.status || 'disponible'} onChange={e => set('status', e.target.value)}>
                            <option value="disponible">Disponible</option><option value="en-ruta">En Ruta</option><option value="en-servicio">En Servicio</option><option value="desconectado">Desconectado</option>
                        </select>
                    </FormField>
                </div>
            </Modal>

            <ConfirmDialog open={!!deactivateId} onClose={() => setDeactivateId(null)} onConfirm={() => { if (deactivateId) handleDeactivate(deactivateId); setDeactivateId(null); }} message="El técnico será desactivado e impedido de acceder a la app. Sus datos históricos se conservarán." confirmText="Desactivar" />
        </div>
    );
}
