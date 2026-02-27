import { useState, useEffect } from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import { authFetch } from '../../hooks/authFetch';

interface AssignedItem {
    assignmentId: number;
    inventoryId: string;
    qty: number;
    name: string;
    sku: string;
    category: string;
    unit: string;
    unitCost: number;
}

export default function TechInventoryPage() {
    const [items, setItems] = useState<AssignedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authFetch('/api/inventory/my')
            .then(r => r.json())
            .then(d => { setItems(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="tech-animate" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Cargando inventario...</div>
    );

    const categories = Array.from(new Set(items.map(i => i.category)));

    return (
        <div className="tech-animate" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>Mi Inventario</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{items.length} productos asignados</div>
            </div>

            {items.length === 0 ? (
                <div className="tech-card" style={{ textAlign: 'center', padding: 40 }}>
                    <Package size={36} style={{ color: '#334155', marginBottom: 12 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Sin productos asignados</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>El administrador te asignará materiales</div>
                </div>
            ) : (
                <>
                    {/* Summary strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                        <div className="tech-card" style={{ textAlign: 'center', padding: '14px 10px' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#818cf8' }}>{items.length}</div>
                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Productos</div>
                        </div>
                        <div className="tech-card" style={{ textAlign: 'center', padding: '14px 10px' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>{items.reduce((s, i) => s + i.qty, 0)}</div>
                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Unidades Total</div>
                        </div>
                    </div>

                    {/* Items by category */}
                    {categories.map(cat => (
                        <div key={cat}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, padding: '0 4px' }}>{cat}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {items.filter(i => i.category === cat).map(item => (
                                    <div key={item.assignmentId} className="tech-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            background: 'rgba(129,140,248,0.12)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Package size={18} style={{ color: '#818cf8' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{item.sku}</div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: item.qty <= 2 ? '#f87171' : '#34d399' }}>
                                                {item.qty <= 2 && <AlertTriangle size={12} style={{ marginRight: 3, verticalAlign: -1 }} />}
                                                {item.qty}
                                            </div>
                                            <div style={{ fontSize: 10, color: '#64748b' }}>{item.unit}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}
