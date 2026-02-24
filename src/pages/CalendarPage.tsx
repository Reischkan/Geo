import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, MapPin, Clock, Calendar, User } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { authFetch } from '../hooks/authFetch';
import { useToast } from '../components/Toast';
import Modal, { FormField, BtnPrimary, BtnSecondary } from '../components/Modal';
import { technicians as fallbackTechs } from '../data/mock';

interface Tech { id: string; name: string; }
interface WorkOrder {
    id: string; title: string; client: string; clientAddress: string;
    technicianId: string; status: string; priority: string;
    scheduledDate: string; endDate: string; estimatedDuration: string; description: string;
    lat: number; lng: number;
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const statusMap: Record<string, { label: string; color: string }> = {
    'pendiente': { label: 'Pendiente', color: '#f59e0b' },
    'en-progreso': { label: 'En Progreso', color: '#3b82f6' },
    'completada': { label: 'Completada', color: '#10b981' },
    'cancelada': { label: 'Cancelada', color: '#ef4444' },
};
const priorityMap: Record<string, { label: string; color: string }> = {
    'urgente': { label: 'Urgente', color: '#ef4444' },
    'alta': { label: 'Alta', color: '#f87171' },
    'media': { label: 'Media', color: '#fbbf24' },
    'baja': { label: 'Baja', color: '#34d399' },
};

export default function CalendarPage() {
    const [month, setMonth] = useState(() => new Date().getMonth());
    const [year, setYear] = useState(() => new Date().getFullYear());
    const { data: orders, refetch } = useApi<WorkOrder[]>('/api/work-orders', []);
    const { data: techs } = useApi<Tech[]>('/api/technicians', fallbackTechs as any);
    const { toast } = useToast();

    // Modals
    const [showCreate, setShowCreate] = useState<number | null>(null);
    const [viewDay, setViewDay] = useState<number | null>(null);
    const [viewOrder, setViewOrder] = useState<WorkOrder | null>(null);
    const [editOrder, setEditOrder] = useState<WorkOrder | null>(null);
    const [editForm, setEditForm] = useState<Partial<WorkOrder>>({});
    const [createForm, setCreateForm] = useState({ title: '', techId: '', time: '09:00', priority: 'media' });

    // Calendar grid
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const todayDate = new Date();
    const isCurrentMonth = todayDate.getMonth() === month && todayDate.getFullYear() === year;
    const today = isCurrentMonth ? todayDate.getDate() : -1;

    // Group orders by day — expand multi-day orders across their range
    const ordersByDay = useMemo(() => {
        const map: Record<number, WorkOrder[]> = {};
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        for (const order of orders) {
            if (!order.scheduledDate) continue;
            const start = new Date(order.scheduledDate + 'T00:00:00');
            const end = order.endDate ? new Date(order.endDate + 'T00:00:00') : start;
            // iterate day by day from start to end
            const cur = new Date(Math.max(start.getTime(), monthStart.getTime()));
            const last = new Date(Math.min(end.getTime(), monthEnd.getTime()));
            while (cur <= last) {
                if (cur.getMonth() === month && cur.getFullYear() === year) {
                    const day = cur.getDate();
                    if (!map[day]) map[day] = [];
                    // avoid duplicates
                    if (!map[day].some(o => o.id === order.id)) map[day].push(order);
                }
                cur.setDate(cur.getDate() + 1);
            }
        }
        return map;
    }, [orders, month, year]);

    const getTechName = (id: string) => techs.find(t => t.id === id)?.name || id;

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    // Unique order count for header (avoid counting multi-day duplicates)
    const monthOrderCount = useMemo(() => {
        const ids = new Set<string>();
        Object.values(ordersByDay).forEach(arr => arr.forEach(o => ids.add(o.id)));
        return ids.size;
    }, [ordersByDay]);

    // Create new order from calendar
    const handleCreate = async () => {
        const tech = techs.find(t => t.id === createForm.techId);
        if (!createForm.title || !tech) { toast('error', 'Complete todos los campos'); return; }
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(showCreate).padStart(2, '0')}`;
        const res = await authFetch('/api/work-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: `OT-${String(Date.now()).slice(-4)}`,
                title: createForm.title,
                client: 'Por asignar',
                clientAddress: '',
                technicianId: createForm.techId,
                status: 'pendiente',
                priority: createForm.priority,
                scheduledDate: dateStr,
                endDate: '',
                estimatedDuration: '2h',
                description: `Sesión programada a las ${createForm.time}`,
                lat: 19.4326,
                lng: -99.1332,
            }),
        });
        if (res.ok) {
            toast('success', `OT creada el ${showCreate}/${month + 1} para ${tech.name}`);
            setShowCreate(null);
            setCreateForm({ title: '', techId: '', time: '09:00', priority: 'media' });
            refetch();
        } else toast('error', 'Error al crear');
    };

    // Save edits
    const handleSaveEdit = async () => {
        if (!editOrder) return;
        const res = await authFetch(`/api/work-orders/${editOrder.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        });
        if (res.ok) {
            toast('success', `Orden ${editOrder.id} actualizada`);
            setEditOrder(null);
            setViewOrder(null);
            refetch();
        } else toast('error', 'Error al actualizar');
    };

    const openEdit = (order: WorkOrder) => {
        setEditForm({ ...order });
        setEditOrder(order);
    };

    const set = (k: string, v: string) => setEditForm(f => ({ ...f, [k]: v }));
    const setNum = (k: string, v: string) => setEditForm(f => ({ ...f, [k]: v === '' ? 0 : parseFloat(v) }));

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Calendario de Órdenes</h1>
                <p style={{ fontSize: 14, color: 'var(--color-geo-text-muted)', marginTop: 4 }}>
                    {monthOrderCount} órdenes programadas en {monthNames[month]} · Clic en un día para ver sus órdenes
                </p>
            </div>

            <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button onClick={prevMonth} style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--color-geo-surface-2)', border: '1px solid var(--color-geo-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-geo-text-muted)' }}>
                            <ChevronLeft size={16} />
                        </button>
                        <h2 style={{ fontSize: 18, fontWeight: 700, minWidth: 180, textAlign: 'center' }}>{monthNames[month]} {year}</h2>
                        <button onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--color-geo-surface-2)', border: '1px solid var(--color-geo-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-geo-text-muted)' }}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    {/* Legend */}
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--color-geo-text-dim)' }}>
                        {Object.entries(statusMap).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: v.color }} />
                                {v.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
                    {DAYS.map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 0' }}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                    {cells.map((day, idx) => {
                        const dayOrders = day ? ordersByDay[day] || [] : [];
                        return (
                            <div
                                key={idx}
                                className={`calendar-cell ${day === today ? 'today' : ''}`}
                                style={{ opacity: day === null ? 0.3 : 1, minHeight: 100, cursor: day !== null ? 'pointer' : 'default', position: 'relative' }}
                                onClick={() => { if (day !== null && dayOrders.length > 0) setViewDay(day); }}
                            >
                                {day !== null && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 13, fontWeight: day === today ? 700 : 500, color: day === today ? 'var(--color-geo-primary-light)' : 'var(--color-geo-text-muted)' }}>
                                                {day}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowCreate(day); }}
                                                style={{ width: 18, height: 18, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-geo-text-dim)', opacity: 0.4, transition: 'opacity 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--color-geo-surface-3)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.background = 'transparent'; }}
                                                title="Crear OT en este día"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            {dayOrders.slice(0, 3).map(order => {
                                                const st = statusMap[order.status] || statusMap['pendiente'];
                                                const pr = priorityMap[order.priority] || priorityMap['media'];
                                                const isMultiDay = order.endDate && order.endDate !== order.scheduledDate;
                                                const startDay = parseInt(order.scheduledDate.slice(8), 10);
                                                const isStart = startDay === day;
                                                const endDay = isMultiDay ? parseInt(order.endDate.slice(8), 10) : startDay;
                                                const isEnd = endDay === day;
                                                const isMid = isMultiDay && !isStart && !isEnd;
                                                return (
                                                    <div
                                                        key={order.id}
                                                        onClick={(e) => { e.stopPropagation(); setViewOrder(order); }}
                                                        style={{
                                                            fontSize: 10, fontWeight: 600, padding: '3px 6px', borderRadius: 5,
                                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                            background: `${st.color}${isMid ? '10' : '15'}`, color: st.color,
                                                            borderLeft: isStart || !isMultiDay ? `2px solid ${pr.color}` : `2px solid ${st.color}40`,
                                                            cursor: 'pointer', transition: 'all 0.15s',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = `${st.color}30`; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = `${st.color}${isMid ? '10' : '15'}`; }}
                                                        title={`${order.id} · ${order.title}${isMultiDay ? ` (${order.scheduledDate} → ${order.endDate})` : ''}`}
                                                    >
                                                        {isStart && isMultiDay && <span style={{ marginRight: 3 }}>▶</span>}
                                                        {isMid && <span style={{ marginRight: 3 }}>―</span>}
                                                        {isEnd && !isStart && <span style={{ marginRight: 3 }}>◀</span>}
                                                        <span style={{ opacity: 0.7 }}>{order.id}</span> {order.title}
                                                    </div>
                                                );
                                            })}
                                            {dayOrders.length > 3 && (
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); setViewOrder(dayOrders[3]); }}
                                                    style={{ fontSize: 10, color: 'var(--color-geo-text-dim)', paddingLeft: 4, cursor: 'pointer' }}
                                                >
                                                    +{dayOrders.length - 3} más
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Day Detail Modal ── */}
            <Modal
                open={viewDay !== null && viewOrder === null && editOrder === null}
                onClose={() => setViewDay(null)}
                title={`${viewDay} de ${monthNames[month]} ${year}`}
                subtitle={`${(viewDay ? ordersByDay[viewDay]?.length : 0) || 0} órdenes programadas`}
                width={620}
                footer={<>
                    <BtnSecondary onClick={() => setViewDay(null)}>Cerrar</BtnSecondary>
                    <BtnPrimary onClick={() => { if (viewDay) { setViewDay(null); setShowCreate(viewDay); } }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> Nueva OT</span>
                    </BtnPrimary>
                </>}
            >
                {viewDay && (ordersByDay[viewDay] || []).length === 0 && (
                    <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-geo-text-dim)' }}>
                        No hay órdenes programadas para este día
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {viewDay && (ordersByDay[viewDay] || []).map(order => {
                        const st = statusMap[order.status] || statusMap['pendiente'];
                        const pr = priorityMap[order.priority] || priorityMap['media'];
                        return (
                            <div
                                key={order.id}
                                style={{
                                    background: 'var(--color-geo-surface-2)', borderRadius: 12, padding: 16,
                                    border: '1px solid var(--color-geo-border)', cursor: 'pointer',
                                    transition: 'all 0.15s', borderLeft: `3px solid ${st.color}`,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = st.color; e.currentTarget.style.background = 'var(--color-geo-surface-3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-geo-border)'; e.currentTarget.style.borderLeftColor = st.color; e.currentTarget.style.background = 'var(--color-geo-surface-2)'; }}
                                onClick={() => setViewOrder(order)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-geo-text-dim)' }}>{order.id}</span>
                                        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{order.title}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${st.color}20`, color: st.color }}>{st.label}</span>
                                        <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${pr.color}20`, color: pr.color }}>{pr.label}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: 'var(--color-geo-text-muted)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <User size={12} style={{ color: 'var(--color-geo-text-dim)' }} /> {order.client}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <User size={12} style={{ color: 'var(--color-geo-text-dim)' }} /> {getTechName(order.technicianId)}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Clock size={12} style={{ color: 'var(--color-geo-text-dim)' }} /> {order.estimatedDuration}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <MapPin size={12} style={{ color: 'var(--color-geo-text-dim)' }} /> {order.clientAddress || '—'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Modal>

            {/* ── View Order Detail Modal ── */}
            <Modal
                open={viewOrder !== null && editOrder === null}
                onClose={() => setViewOrder(null)}
                title={viewOrder?.id || ''}
                subtitle={viewOrder?.title}
                width={520}
                footer={<>
                    <BtnSecondary onClick={() => setViewOrder(null)}>Cerrar</BtnSecondary>
                    <BtnPrimary onClick={() => { if (viewOrder) openEdit(viewOrder); }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Edit size={14} /> Editar</span>
                    </BtnPrimary>
                </>}
            >
                {viewOrder && (() => {
                    const st = statusMap[viewOrder.status] || statusMap['pendiente'];
                    const pr = priorityMap[viewOrder.priority] || priorityMap['media'];
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Status + Priority badges */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: `${st.color}20`, color: st.color }}>
                                    {st.label}
                                </span>
                                <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: `${pr.color}20`, color: pr.color }}>
                                    {pr.label}
                                </span>
                            </div>
                            {/* Info rows */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <DetailField icon={<User size={14} />} label="Cliente" value={viewOrder.client} />
                                <DetailField icon={<User size={14} />} label="Técnico" value={getTechName(viewOrder.technicianId)} />
                                <DetailField icon={<Calendar size={14} />} label="Fecha" value={viewOrder.endDate && viewOrder.endDate !== viewOrder.scheduledDate ? `${viewOrder.scheduledDate} → ${viewOrder.endDate}` : viewOrder.scheduledDate} />
                                <DetailField icon={<Clock size={14} />} label="Duración" value={viewOrder.estimatedDuration} />
                                <DetailField icon={<MapPin size={14} />} label="Dirección" value={viewOrder.clientAddress || '—'} />
                                <DetailField icon={<MapPin size={14} />} label="Coordenadas" value={`${viewOrder.lat?.toFixed(4)}, ${viewOrder.lng?.toFixed(4)}`} />
                            </div>
                            {viewOrder.description && (
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Descripción</div>
                                    <p style={{ fontSize: 13, color: 'var(--color-geo-text-muted)', lineHeight: 1.5 }}>{viewOrder.description}</p>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Modal>

            {/* ── Edit Order Modal ── */}
            <Modal
                open={editOrder !== null}
                onClose={() => setEditOrder(null)}
                title={`Editar ${editOrder?.id || ''}`}
                subtitle="Modificar datos de la orden"
                width={600}
                footer={<>
                    <BtnSecondary onClick={() => setEditOrder(null)}>Cancelar</BtnSecondary>
                    <BtnPrimary onClick={handleSaveEdit}>Guardar Cambios</BtnPrimary>
                </>}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <FormField label="Título">
                        <input className="geo-input" style={{ width: '100%' }} value={editForm.title || ''} onChange={e => set('title', e.target.value)} />
                    </FormField>
                    <FormField label="Cliente">
                        <input className="geo-input" style={{ width: '100%' }} value={editForm.client || ''} onChange={e => set('client', e.target.value)} />
                    </FormField>
                    <FormField label="Dirección">
                        <input className="geo-input" style={{ width: '100%' }} value={editForm.clientAddress || ''} onChange={e => set('clientAddress', e.target.value)} />
                    </FormField>
                    <FormField label="Técnico Asignado">
                        <select className="geo-input" style={{ width: '100%', appearance: 'none' }} value={editForm.technicianId || ''} onChange={e => set('technicianId', e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </FormField>
                    <FormField label="Fecha Inicio">
                        <input className="geo-input" type="date" style={{ width: '100%' }} value={editForm.scheduledDate || ''} onChange={e => set('scheduledDate', e.target.value)} />
                    </FormField>
                    <FormField label="Fecha Fin" hint="Dejar vacío para 1 día">
                        <input className="geo-input" type="date" style={{ width: '100%' }} value={editForm.endDate || ''} onChange={e => set('endDate', e.target.value)} />
                    </FormField>
                    <FormField label="Duración Estimada">
                        <input className="geo-input" style={{ width: '100%' }} value={editForm.estimatedDuration || ''} onChange={e => set('estimatedDuration', e.target.value)} />
                    </FormField>
                    <FormField label="Estado">
                        <select className="geo-input" style={{ width: '100%', appearance: 'none' }} value={editForm.status || 'pendiente'} onChange={e => set('status', e.target.value)}>
                            <option value="pendiente">Pendiente</option>
                            <option value="en-progreso">En Progreso</option>
                            <option value="completada">Completada</option>
                            <option value="cancelada">Cancelada</option>
                        </select>
                    </FormField>
                    <FormField label="Prioridad">
                        <select className="geo-input" style={{ width: '100%', appearance: 'none' }} value={editForm.priority || 'media'} onChange={e => set('priority', e.target.value)}>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                            <option value="urgente">Urgente</option>
                        </select>
                    </FormField>
                    <FormField label="Latitud">
                        <input className="geo-input" type="number" step="0.0001" style={{ width: '100%' }} value={editForm.lat ?? 19.4326} onChange={e => setNum('lat', e.target.value)} />
                    </FormField>
                    <FormField label="Longitud">
                        <input className="geo-input" type="number" step="0.0001" style={{ width: '100%' }} value={editForm.lng ?? -99.1332} onChange={e => setNum('lng', e.target.value)} />
                    </FormField>
                </div>
                <FormField label="Descripción">
                    <textarea className="geo-input" style={{ width: '100%', minHeight: 70, resize: 'vertical' }} value={editForm.description || ''} onChange={e => set('description', e.target.value)} />
                </FormField>
            </Modal>

            {/* ── Create Order Modal ── */}
            <Modal
                open={showCreate !== null}
                onClose={() => setShowCreate(null)}
                title="Nueva Orden de Trabajo"
                subtitle={`Día ${showCreate} de ${monthNames[month]} ${year}`}
                footer={<>
                    <BtnSecondary onClick={() => setShowCreate(null)}>Cancelar</BtnSecondary>
                    <BtnPrimary onClick={handleCreate}>Crear OT</BtnPrimary>
                </>}
            >
                <FormField label="Título de la Orden">
                    <input className="geo-input" style={{ width: '100%' }} value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="Instalación fase 2..." />
                </FormField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <FormField label="Técnico Asignado">
                        <select className="geo-input" style={{ width: '100%', appearance: 'none' }} value={createForm.techId} onChange={e => setCreateForm(f => ({ ...f, techId: e.target.value }))}>
                            <option value="">Seleccionar técnico...</option>
                            {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </FormField>
                    <FormField label="Hora">
                        <input className="geo-input" type="time" style={{ width: '100%' }} value={createForm.time} onChange={e => setCreateForm(f => ({ ...f, time: e.target.value }))} />
                    </FormField>
                </div>
                <FormField label="Prioridad">
                    <select className="geo-input" style={{ width: '100%', appearance: 'none' }} value={createForm.priority} onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value }))}>
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                    </select>
                </FormField>
            </Modal>
        </div>
    );
}

/* Detail field helper */
function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-geo-text-muted)' }}>{value}</div>
        </div>
    );
}
