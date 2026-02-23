import { useState } from 'react';
import { Search, Plus, Mail, Phone, MapPin, Building2, Edit, Trash2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import Modal, { FormField, BtnPrimary, BtnSecondary } from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

interface Client {
    id: string; name: string; contactName: string; phone: string;
    email: string; address: string; lat: number; lng: number;
    notes: string; active: boolean;
}

const emptyClient: Partial<Client> = {
    id: '', name: '', contactName: '', phone: '', email: '',
    address: '', lat: 19.43, lng: -99.13, notes: '',
};

export default function ClientsPage() {
    const { data: clients, refetch } = useApi<Client[]>('/api/clients', []);
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [form, setForm] = useState<Partial<Client>>(emptyClient);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const filtered = clients.filter(c =>
        c.active && (search === '' ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.contactName.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()))
    );

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        const isNew = modal === 'create';
        const id = isNew ? `C${String(Date.now()).slice(-4)}` : form.id;
        const body = { ...form, id };
        const res = await fetch(isNew ? '/api/clients' : `/api/clients/${id}`, {
            method: isNew ? 'POST' : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (res.ok) {
            toast('success', isNew ? 'Cliente creado exitosamente' : 'Cliente actualizado');
            setModal(null); refetch();
        } else { toast('error', 'Error al guardar'); }
    };

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
        if (res.ok) { toast('success', 'Cliente desactivado'); refetch(); }
        else { toast('error', 'Error al desactivar'); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Clientes</h1>
                    <p style={{ fontSize: 14, color: 'var(--color-geo-text-muted)', marginTop: 4 }}>
                        {filtered.length} clientes activos
                    </p>
                </div>
                <button
                    onClick={() => { setForm(emptyClient); setModal('create'); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                        borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600,
                        background: 'var(--color-geo-primary)', color: '#fff', cursor: 'pointer',
                    }}
                >
                    <Plus size={16} /> Nuevo Cliente
                </button>
            </div>

            <div style={{ marginBottom: 20, position: 'relative', maxWidth: 400 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-geo-text-dim)' }} />
                <input className="geo-input" placeholder="Buscar por nombre, contacto..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: 40 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {filtered.map((c, i) => (
                    <div key={c.id} className="glass-card animate-fade-in-up" style={{ padding: 20, animationDelay: `${i * 0.06}s`, opacity: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Building2 size={20} style={{ color: '#60a5fa' }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</h3>
                                    <p style={{ fontSize: 12, color: 'var(--color-geo-text-dim)' }}>{c.id}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button onClick={() => { setForm(c); setModal('edit'); }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--color-geo-surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-geo-text-dim)' }}>
                                    <Edit size={14} />
                                </button>
                                <button onClick={() => setConfirmId(c.id)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--color-geo-text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={13} style={{ color: 'var(--color-geo-text-dim)', flexShrink: 0 }} /> {c.phone}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={13} style={{ color: 'var(--color-geo-text-dim)', flexShrink: 0 }} /> {c.email}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={13} style={{ color: 'var(--color-geo-text-dim)', flexShrink: 0 }} /> {c.address}</div>
                        </div>
                        {c.notes && (
                            <p style={{ fontSize: 12, color: 'var(--color-geo-text-dim)', marginTop: 12, padding: '8px 10px', borderRadius: 8, background: 'var(--color-geo-surface-2)', lineHeight: 1.5 }}>
                                💬 {c.notes}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Create / Edit Modal */}
            <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'} subtitle="Datos del cliente y ubicación" footer={<><BtnSecondary onClick={() => setModal(null)}>Cancelar</BtnSecondary><BtnPrimary onClick={handleSave}>Guardar</BtnPrimary></>}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <FormField label="Nombre / Razón Social"><input className="geo-input" style={{ width: '100%' }} value={form.name || ''} onChange={e => set('name', e.target.value)} /></FormField>
                    <FormField label="Persona de Contacto"><input className="geo-input" style={{ width: '100%' }} value={form.contactName || ''} onChange={e => set('contactName', e.target.value)} /></FormField>
                    <FormField label="Teléfono"><input className="geo-input" style={{ width: '100%' }} value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></FormField>
                    <FormField label="Email"><input className="geo-input" style={{ width: '100%' }} value={form.email || ''} onChange={e => set('email', e.target.value)} /></FormField>
                </div>
                <FormField label="Dirección"><input className="geo-input" style={{ width: '100%' }} value={form.address || ''} onChange={e => set('address', e.target.value)} /></FormField>
                <FormField label="Notas Internas"><textarea className="geo-input" style={{ width: '100%', minHeight: 70, resize: 'vertical' }} value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></FormField>
            </Modal>

            <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => { if (confirmId) handleDelete(confirmId); setConfirmId(null); }} message="Este cliente será desactivado pero su historial de obra se conservará." confirmText="Desactivar" />
        </div>
    );
}
