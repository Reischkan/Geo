import { useState, useEffect } from 'react';
import { Search, AlertTriangle, Package, Truck, Plus, Edit, Trash2, History, User, ClipboardList, ChevronRight, X, UserPlus, ChevronDown, ChevronUp, Users, RotateCcw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { authFetch } from '../hooks/authFetch';
import { useToast } from '../components/Toast';
import Modal, { FormField, BtnPrimary, BtnSecondary } from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

interface Item {
    id: string; name: string; sku: string; category: string;
    vehicleQty: number; warehouseQty: number; minStock: number;
    unit: string; location: string; unitCost: number;
}
interface MaterialLogEntry {
    id: string; inventoryId: string; inventoryName: string; qty: number;
    orderId: string; orderTitle: string; technicianId: string; technicianName: string;
    consumedAt: string;
}
interface TechAssignment {
    id: number; technicianId: string; inventoryId: string; qty: number;
    technicianName: string; inventoryName: string; inventorySku: string; unit: string;
}
interface Tech { id: string; name: string; avatar: string; }

const emptyItem: Partial<Item> = {
    name: '', sku: '', category: 'Herramientas', vehicleQty: 0, warehouseQty: 0,
    minStock: 5, unit: 'pza', location: 'Almacén Central', unitCost: 0,
};

export default function InventoryPage() {
    const { data: items, refetch } = useApi<Item[]>('/api/inventory', []);
    const { data: techs } = useApi<Tech[]>('/api/technicians', []);
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [form, setForm] = useState<Partial<Item>>(emptyItem);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Consumption log state
    const [logs, setLogs] = useState<MaterialLogEntry[]>([]);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [itemLogs, setItemLogs] = useState<MaterialLogEntry[]>([]);
    const [showConsumption, setShowConsumption] = useState(false);

    // Assignment state
    const [assignments, setAssignments] = useState<TechAssignment[]>([]);
    const [assignModal, setAssignModal] = useState(false);
    const [assignTechId, setAssignTechId] = useState('');
    const [assignItemId, setAssignItemId] = useState('');
    const [assignQty, setAssignQty] = useState(1);

    // Load all logs
    useEffect(() => {
        authFetch('/api/work-orders/material-logs')
            .then(r => r.json())
            .then(d => setLogs(d))
            .catch(() => { });
    }, []);

    // Load assignments
    const loadAssignments = () => {
        authFetch('/api/inventory/assignments')
            .then(r => r.json())
            .then(setAssignments)
            .catch(() => { });
    };
    useEffect(loadAssignments, []);

    // Load per-item logs when item selected
    useEffect(() => {
        if (!selectedItem) { setItemLogs([]); return; }
        authFetch(`/api/work-orders/material-logs/${selectedItem.id}`)
            .then(r => r.json())
            .then(setItemLogs)
            .catch(() => setItemLogs([]));
    }, [selectedItem?.id]);

    const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))];
    const totalStock = (i: Item) => (i.vehicleQty || 0) + (i.warehouseQty || 0);
    const filtered = items.filter(i => {
        const s = search.toLowerCase();
        return (search === '' || i.name.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s)) &&
            (catFilter === 'all' || i.category === catFilter);
    });

    const lowStock = items.filter(i => totalStock(i) <= i.minStock);
    const totalConsumed = logs.reduce((s, l) => s + l.qty, 0);
    const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

    const techBreakdown = logs.reduce<Record<string, { name: string; totalQty: number; items: Record<string, number> }>>((acc, l) => {
        if (!acc[l.technicianId]) acc[l.technicianId] = { name: l.technicianName, totalQty: 0, items: {} };
        acc[l.technicianId].totalQty += l.qty;
        acc[l.technicianId].items[l.inventoryName] = (acc[l.technicianId].items[l.inventoryName] || 0) + l.qty;
        return acc;
    }, {});

    const handleSave = async () => {
        const isNew = modal === 'create';
        const id = isNew ? `INV-${String(Date.now()).slice(-4)}` : form.id;
        const body = { ...form, id };
        const res = await authFetch(isNew ? '/api/inventory' : `/api/inventory/${id}`, {
            method: isNew ? 'POST' : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (res.ok) { toast('success', isNew ? 'Producto creado' : 'Producto actualizado'); setModal(null); refetch(); }
        else toast('error', 'Error al guardar');
    };

    const handleDelete = async (id: string) => {
        const res = await authFetch(`/api/inventory/${id}`, { method: 'DELETE' });
        if (res.ok) { toast('success', 'Producto eliminado'); refetch(); }
        else toast('error', 'Error al eliminar');
    };

    const handleAssign = async () => {
        if (!assignTechId || !assignItemId || assignQty <= 0) { toast('error', 'Completa todos los campos'); return; }
        const res = await authFetch('/api/inventory/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ technicianId: assignTechId, inventoryId: assignItemId, qty: assignQty }),
        });
        if (res.ok) { toast('success', 'Material asignado'); setAssignModal(false); setAssignTechId(''); setAssignItemId(''); setAssignQty(1); loadAssignments(); }
        else toast('error', 'Error al asignar');
    };

    const handleRemoveAssignment = async (a: TechAssignment) => {
        const res = await authFetch('/api/inventory/remove-assignment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ technicianId: a.technicianId, inventoryId: a.inventoryId }),
        });
        // BUG-08 FIX: only show success when server confirms the operation
        if (res.ok) {
            toast('success', 'Asignación eliminada y stock restaurado');
            loadAssignments();
            refetch(); // also refresh warehouse qty since stock was returned
        } else {
            const err = await res.json().catch(() => ({}));
            toast('error', err.message || 'Error al eliminar asignación');
        }
    };

    const handleReturn = async (a: TechAssignment, returnQty: number) => {
        if (returnQty <= 0 || returnQty > a.qty) { toast('error', `Cantidad inválida (máx ${a.qty})`); return; }
        const res = await authFetch('/api/inventory/return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ technicianId: a.technicianId, inventoryId: a.inventoryId, qty: returnQty }),
        });
        if (res.ok) {
            const data = await res.json();
            toast('success', data.message || 'Material devuelto');
            loadAssignments();
            refetch(); // refresh warehouse qty
        } else toast('error', 'Error al devolver');
    };

    // Group assignments by technician for display
    const assignmentsByTech = assignments.reduce<Record<string, { name: string; items: TechAssignment[] }>>((acc, a) => {
        if (!acc[a.technicianId]) acc[a.technicianId] = { name: a.technicianName, items: [] };
        acc[a.technicianId].items.push(a);
        return acc;
    }, {});

    // Assignments for selected item
    const itemAssignments = selectedItem ? assignments.filter(a => a.inventoryId === selectedItem.id) : [];

    return (
        <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 108px)' }}>
            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Inventario</h1>
                        <p style={{ fontSize: 14, color: 'var(--color-geo-text-muted)', marginTop: 4 }}>{items.length} productos en catálogo</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setAssignModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(129,140,248,0.3)', fontSize: 13, fontWeight: 600, background: 'rgba(129,140,248,0.08)', color: '#818cf8', cursor: 'pointer' }}>
                            <UserPlus size={16} /> Asignar a Técnico
                        </button>
                        <button onClick={() => { setForm(emptyItem); setModal('create'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, background: 'var(--color-geo-primary)', color: '#fff', cursor: 'pointer' }}>
                            <Plus size={16} /> Nuevo Producto
                        </button>
                    </div>
                </div>

                {/* KPI strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                    {[
                        { label: 'Productos', value: items.length, icon: <Package size={18} style={{ color: '#60a5fa' }} />, bg: 'rgba(59,130,246,0.1)' },
                        { label: 'Stock Bajo', value: lowStock.length, icon: <AlertTriangle size={18} style={{ color: '#f87171' }} />, bg: 'rgba(239,68,68,0.1)' },
                        { label: 'En Vehículos', value: items.reduce((s, i) => s + (i.vehicleQty || 0), 0), icon: <Truck size={18} style={{ color: '#34d399' }} />, bg: 'rgba(16,185,129,0.1)' },
                        { label: 'Unidades Consumidas', value: totalConsumed, icon: <History size={18} style={{ color: '#fbbf24' }} />, bg: 'rgba(245,158,11,0.1)' },
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
                <div className="glass-card" style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ minWidth: 900 }}>
                        <thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th>Almacén</th><th>Vehículo</th><th>Total</th><th>Mín</th><th>Unidad</th><th>Costo</th><th>Acciones</th></tr></thead>
                        <tbody>
                            {filtered.map(item => {
                                const total = totalStock(item);
                                const isLow = total <= item.minStock;
                                const techCount = assignments.filter(a => a.inventoryId === item.id).length;
                                return (
                                    <tr key={item.id} style={{ cursor: 'pointer', background: selectedItem?.id === item.id ? 'rgba(59,130,246,0.06)' : undefined }} onClick={() => setSelectedItem(item)}>
                                        <td style={{ fontWeight: 600, fontSize: 12, color: 'var(--color-geo-text-dim)' }}>{item.sku}</td>
                                        <td style={{ fontWeight: 500, color: 'var(--color-geo-text)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {item.name}
                                                {techCount > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>{techCount} <Users size={9} style={{ verticalAlign: -1 }} /></span>}
                                                <ChevronRight size={12} style={{ color: 'var(--color-geo-text-dim)' }} />
                                            </div>
                                        </td>
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
                                            <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                                <button onClick={() => { setAssignItemId(item.id); setAssignModal(true); }} title="Asignar" style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(129,140,248,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}><UserPlus size={13} /></button>
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

                {/* Collapsible Consumption Summary */}
                {logs.length > 0 && (
                    <div className="glass-card" style={{ marginTop: 16 }}>
                        <button onClick={() => setShowConsumption(!showConsumption)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-geo-text)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <History size={16} style={{ color: '#fbbf24' }} />
                                <span style={{ fontSize: 14, fontWeight: 700 }}>Resumen de Consumo Global</span>
                                <span style={{ fontSize: 12, color: 'var(--color-geo-text-dim)', fontWeight: 500 }}>{logs.length} registros · {totalConsumed} unidades</span>
                            </div>
                            {showConsumption ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {showConsumption && (
                            <div style={{ padding: '0 20px 20px', display: 'flex', gap: 20 }}>
                                {/* By technician */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <User size={13} /> Por Técnico
                                    </div>
                                    {Object.entries(techBreakdown).map(([tid, data]) => (
                                        <div key={tid} style={{ padding: '10px 12px', background: 'var(--color-geo-surface-2)', borderRadius: 8, marginBottom: 8, fontSize: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#818cf8' }}>
                                                        {data.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <span style={{ fontWeight: 700 }}>{data.name}</span>
                                                </div>
                                                <span style={{ fontWeight: 800, color: '#fbbf24' }}>{data.totalQty} uds</span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {Object.entries(data.items).map(([name, qty]) => (
                                                    <span key={name} style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: 'var(--color-geo-text-muted)' }}>
                                                        {name} ×{qty}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Recent log entries */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <History size={13} /> Últimos Registros
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                                        {logs.slice(0, 20).map(log => (
                                            <div key={log.id} style={{ padding: '8px 10px', background: 'var(--color-geo-surface-2)', borderRadius: 8, fontSize: 11 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                                    <span style={{ fontWeight: 700 }}>{log.inventoryName} ×{log.qty}</span>
                                                    <span style={{ fontSize: 10, color: 'var(--color-geo-text-dim)' }}>{new Date(log.consumedAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div style={{ color: 'var(--color-geo-text-dim)' }}>
                                                    {log.orderId} · {log.technicianName}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Detail / Logs Panel */}
            {selectedItem && (
                <div className="glass-card animate-fade-in-up" style={{ width: 370, flexShrink: 0, padding: 24, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)' }}>{selectedItem.sku}</span>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{selectedItem.name}</h3>
                        </div>
                        <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', color: 'var(--color-geo-text-dim)', cursor: 'pointer' }}><X size={18} /></button>
                    </div>

                    {/* Stock Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {[
                            { label: 'Almacén', value: selectedItem.warehouseQty, color: '#60a5fa' },
                            { label: 'Vehículo', value: selectedItem.vehicleQty, color: '#34d399' },
                            { label: 'Total', value: totalStock(selectedItem), color: totalStock(selectedItem) <= selectedItem.minStock ? '#f87171' : '#a78bfa' },
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: 'center', padding: '10px 0', background: 'var(--color-geo-surface-2)', borderRadius: 8 }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: 10, color: 'var(--color-geo-text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Assigned To section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Users size={13} /> Asignado a Técnicos
                            </div>
                            <button onClick={() => { setAssignItemId(selectedItem.id); setAssignModal(true); }} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(129,140,248,0.3)', background: 'rgba(129,140,248,0.08)', color: '#818cf8', cursor: 'pointer' }}>+ Asignar</button>
                        </div>
                        {itemAssignments.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--color-geo-text-dim)', fontSize: 12, padding: 10 }}>No asignado a ningún técnico</div>
                        ) : (
                            itemAssignments.map(a => (
                                <div key={a.id} style={{ padding: '8px 10px', background: 'var(--color-geo-surface-2)', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#818cf8' }}>
                                                {a.technicianName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{a.technicianName}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontWeight: 800, color: a.qty <= 2 ? '#f87171' : '#34d399' }}>{a.qty} {a.unit}</span>
                                            <button onClick={() => handleRemoveAssignment(a)} title="Quitar asignación" style={{ width: 20, height: 20, borderRadius: 5, border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontSize: 12 }}>×</button>
                                        </div>
                                    </div>
                                    {/* Return to warehouse controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                        <button
                                            onClick={() => handleReturn(a, 1)}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.08)', color: '#fbbf24', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}
                                        >
                                            <RotateCcw size={10} /> Devolver 1 al almacén
                                        </button>
                                        <button
                                            onClick={() => handleReturn(a, a.qty)}
                                            title="Devolver todo al almacén"
                                            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.08)', color: '#fbbf24', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}
                                        >
                                            Todo ({a.qty})
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Consumo por Técnico */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 11, fontWeight: 700, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <User size={13} /> Consumo por Técnico
                        </div>
                        {(() => {
                            const itemTechBreakdown = itemLogs.reduce<Record<string, { name: string; totalQty: number }>>((acc, l) => {
                                if (!acc[l.technicianId]) acc[l.technicianId] = { name: l.technicianName, totalQty: 0 };
                                acc[l.technicianId].totalQty += l.qty;
                                return acc;
                            }, {});
                            const entries = Object.entries(itemTechBreakdown);
                            if (entries.length === 0) return <div style={{ textAlign: 'center', color: 'var(--color-geo-text-dim)', fontSize: 12, padding: 10 }}>Sin consumo registrado</div>;
                            return entries.map(([tid, data]) => (
                                <div key={tid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--color-geo-surface-2)', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#818cf8' }}>
                                            {data.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{data.name}</span>
                                    </div>
                                    <span style={{ fontWeight: 800, color: '#fbbf24' }}>×{data.totalQty}</span>
                                </div>
                            ));
                        })()}
                    </div>

                    {/* Historial de Consumo */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 11, fontWeight: 700, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <History size={13} /> Historial de Consumo
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                            {itemLogs.length === 0 && <div style={{ textAlign: 'center', color: 'var(--color-geo-text-dim)', fontSize: 12, padding: 10 }}>Sin registros</div>}
                            {itemLogs.map(log => (
                                <div key={log.id} style={{ padding: '10px 12px', background: 'var(--color-geo-surface-2)', borderRadius: 8, fontSize: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontWeight: 700, color: 'var(--color-geo-primary-light)' }}>×{log.qty} {selectedItem.unit}</span>
                                        <span style={{ fontSize: 10, color: 'var(--color-geo-text-dim)' }}>{new Date(log.consumedAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-geo-text-muted)' }}>
                                        <ClipboardList size={11} /> <span style={{ fontWeight: 600 }}>{log.orderId}</span> — {log.orderTitle}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-geo-text-muted)', marginTop: 2 }}>
                                        <User size={11} /> {log.technicianName}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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

            {/* Assign Modal */}
            <Modal open={assignModal} onClose={() => { setAssignModal(false); setAssignTechId(''); setAssignItemId(''); setAssignQty(1); }} title="Asignar Material a Técnico" subtitle="El técnico verá este material en su inventario" footer={<><BtnSecondary onClick={() => { setAssignModal(false); setAssignTechId(''); setAssignItemId(''); setAssignQty(1); }}>Cancelar</BtnSecondary><BtnPrimary onClick={handleAssign}>Asignar</BtnPrimary></>}>
                <FormField label="Técnico">
                    <select className="geo-input" style={{ width: '100%' }} value={assignTechId} onChange={e => setAssignTechId(e.target.value)}>
                        <option value="">Seleccionar técnico...</option>
                        {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </FormField>
                <FormField label="Producto">
                    <select className="geo-input" style={{ width: '100%' }} value={assignItemId} onChange={e => setAssignItemId(e.target.value)}>
                        <option value="">Seleccionar producto...</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                    </select>
                </FormField>
                <FormField label="Cantidad a agregar">
                    <input className="geo-input" type="number" min="1" style={{ width: '100%' }} value={assignQty} onChange={e => setAssignQty(+e.target.value)} />
                    <div style={{ fontSize: 10, color: 'var(--color-geo-text-dim)', marginTop: 4 }}>Se suma al material que ya tenga asignado</div>
                </FormField>

                {/* Current assignments for selected tech */}
                {assignTechId && (() => {
                    const techAssigns = assignments.filter(a => a.technicianId === assignTechId);
                    if (techAssigns.length === 0) return null;
                    return (
                        <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--color-geo-surface-2)', borderRadius: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Material actual asignado</div>
                            {techAssigns.map(a => (
                                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                                    <span>{a.inventoryName}</span>
                                    <span style={{ fontWeight: 700, color: '#818cf8' }}>{a.qty} {a.unit}</span>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </Modal>

            <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) handleDelete(deleteId); setDeleteId(null); }} message="Este producto será eliminado permanentemente del catálogo." confirmText="Eliminar" />
        </div>
    );
}
