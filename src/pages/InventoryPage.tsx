import { useState } from 'react';
import { Search, AlertTriangle, Package, Truck, Plus, Edit, Trash2, Warehouse } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import Modal, { FormField, BtnPrimary, BtnSecondary } from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

interface Item {
    id: string; name: string; sku: string; category: string;
    vehicleQty: number; warehouseQty: number; minStock: number;
    unit: string; location: string; unitCost: number;
}

const emptyItem: Partial<Item> = {
    name: '', sku: '', category: 'Herramientas', vehicleQty: 0, warehouseQty: 0,
    minStock: 5, unit: 'pza', location: 'Almacén Central', unitCost: 0,
};

export default function InventoryPage() {
    const { data: items, refetch } = useApi<Item[]>('/api/inventory', []);
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [form, setForm] = useState<Partial<Item>>(emptyItem);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))];
    const totalStock = (i: Item) => (i.vehicleQty || 0) + (i.warehouseQty || 0);
    const filtered = items.filter(i => {
        const s = search.toLowerCase();
        return (search === '' || i.name.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s)) &&
            (catFilter === 'all' || i.category === catFilter);
    });

    const lowStock = items.filter(i => totalStock(i) <= i.minStock);
    const totalValue = items.reduce((s, i) => s + totalStock(i) * (i.unitCost || 0), 0);
    const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        const isNew = modal === 'create';
        const id = isNew ? `INV-${String(Date.now()).slice(-4)}` : form.id;
        const body = { ...form, id };
        const res = await fetch(isNew ? '/api/inventory' : `/api/inventory/${id}`, {
            method: isNew ? 'POST' : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (res.ok) { toast('success', isNew ? 'Producto creado' : 'Producto actualizado'); setModal(null); refetch(); }
        else toast('error', 'Error al guardar');
    };

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
        if (res.ok) { toast('success', 'Producto eliminado'); refetch(); }
        else toast('error', 'Error al eliminar');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Inventario</h1>
                    <p style={{ fontSize: 14, color: 'var(--color-geo-text-muted)', marginTop: 4 }}>{items.length} productos en catálogo</p>
                </div>
                <button onClick={() => { setForm(emptyItem); setModal('create'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, background: 'var(--color-geo-primary)', color: '#fff', cursor: 'pointer' }}>
                    <Plus size={16} /> Nuevo Producto
                </button>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                {[
                    { label: 'Productos', value: items.length, icon: <Package size={18} style={{ color: '#60a5fa' }} />, bg: 'rgba(59,130,246,0.1)' },
                    { label: 'Stock Bajo', value: lowStock.length, icon: <AlertTriangle size={18} style={{ color: '#f87171' }} />, bg: 'rgba(239,68,68,0.1)' },
                    { label: 'En Vehículos', value: items.reduce((s, i) => s + (i.vehicleQty || 0), 0), icon: <Truck size={18} style={{ color: '#34d399' }} />, bg: 'rgba(16,185,129,0.1)' },
                    { label: 'Valor Total', value: `$${(totalValue / 1000).toFixed(0)}K`, icon: <Warehouse size={18} style={{ color: '#a78bfa' }} />, bg: 'rgba(139,92,246,0.1)' },
                ].map((kpi, i) => (
                    <div key={i} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{kpi.icon}</div>
                        <div><div style={{ fontSize: 20, fontWeight: 800 }}>{kpi.value}</div><div style={{ fontSize: 11, color: 'var(--color-geo-text-dim)' }}>{kpi.label}</div></div>
                    </div>
                ))}
            </div>

            {/* Low stock alerts */}
            {lowStock.length > 0 && (
                <div className="glass-card" style={{ padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, borderColor: 'rgba(239,68,68,0.25)' }}>
                    <AlertTriangle size={18} style={{ color: '#f87171', flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: 'var(--color-geo-text-muted)' }}>
                        <strong style={{ color: '#f87171' }}>{lowStock.length} productos</strong> por debajo del nivel mínimo: {lowStock.map(i => i.name).join(', ')}
                    </p>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-geo-text-dim)' }} />
                    <input className="geo-input" placeholder="Buscar por nombre o SKU..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: 40 }} />
                </div>
                <div style={{ display: 'flex', gap: 4, background: 'var(--color-geo-surface-2)', padding: 3, borderRadius: 10 }}>
                    {categories.map(c => (
                        <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: catFilter === c ? 'var(--color-geo-primary)' : 'transparent', color: catFilter === c ? '#fff' : 'var(--color-geo-text-muted)' }}>
                            {c === 'all' ? 'Todos' : c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                    <thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th>Almacén</th><th>Vehículo</th><th>Total</th><th>Mín</th><th>Unidad</th><th>Costo</th><th>Acciones</th></tr></thead>
                    <tbody>
                        {filtered.map(item => {
                            const total = totalStock(item);
                            const isLow = total <= item.minStock;
                            return (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 600, fontSize: 12, color: 'var(--color-geo-text-dim)' }}>{item.sku}</td>
                                    <td style={{ fontWeight: 500, color: 'var(--color-geo-text)' }}>{item.name}</td>
                                    <td><span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>{item.category}</span></td>
                                    <td style={{ fontWeight: 600 }}>{item.warehouseQty}</td>
                                    <td style={{ fontWeight: 600 }}>{item.vehicleQty}</td>
                                    <td style={{ fontWeight: 700, color: isLow ? '#f87171' : '#34d399' }}>
                                        {isLow && <AlertTriangle size={12} style={{ marginRight: 4, verticalAlign: -1 }} />}
                                        {total}
                                    </td>
                                    <td>{item.minStock}</td>
                                    <td>{item.unit}</td>
                                    <td style={{ fontWeight: 600 }}>${item.unitCost || 0}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button onClick={() => { setForm(item); setModal('edit'); }} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'var(--color-geo-surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-geo-text-dim)' }}><Edit size={13} /></button>
                                            <button onClick={() => setDeleteId(item.id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}><Trash2 size={13} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo Producto' : 'Editar Producto'} subtitle="Catálogo de inventario" footer={<><BtnSecondary onClick={() => setModal(null)}>Cancelar</BtnSecondary><BtnPrimary onClick={handleSave}>Guardar</BtnPrimary></>}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <FormField label="Nombre"><input className="geo-input" style={{ width: '100%' }} value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Cable UTP Cat 6" /></FormField>
                    <FormField label="SKU"><input className="geo-input" style={{ width: '100%' }} value={form.sku || ''} onChange={e => set('sku', e.target.value)} placeholder="CAB-UTP-001" /></FormField>
                    <FormField label="Categoría">
                        <select className="geo-input" style={{ width: '100%', appearance: 'none' }} value={form.category || 'Herramientas'} onChange={e => set('category', e.target.value)}>
                            <option>Cableado</option><option>Conectores</option><option>Herramientas</option><option>Equipos</option><option>EPP</option><option>Consumibles</option>
                        </select>
                    </FormField>
                    <FormField label="Unidad"><input className="geo-input" style={{ width: '100%' }} value={form.unit || ''} onChange={e => set('unit', e.target.value)} placeholder="m, pza, rollo" /></FormField>
                    <FormField label="Qty en Almacén"><input className="geo-input" type="number" style={{ width: '100%' }} value={form.warehouseQty ?? 0} onChange={e => set('warehouseQty', +e.target.value)} /></FormField>
                    <FormField label="Qty en Vehículos"><input className="geo-input" type="number" style={{ width: '100%' }} value={form.vehicleQty ?? 0} onChange={e => set('vehicleQty', +e.target.value)} /></FormField>
                    <FormField label="Stock Mínimo (Alerta)"><input className="geo-input" type="number" style={{ width: '100%' }} value={form.minStock ?? 5} onChange={e => set('minStock', +e.target.value)} /></FormField>
                    <FormField label="Costo Unitario ($)"><input className="geo-input" type="number" step="0.01" style={{ width: '100%' }} value={form.unitCost ?? 0} onChange={e => set('unitCost', +e.target.value)} /></FormField>
                </div>
            </Modal>

            <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) handleDelete(deleteId); setDeleteId(null); }} message="Este producto será eliminado permanentemente del catálogo." confirmText="Eliminar" />
        </div>
    );
}
