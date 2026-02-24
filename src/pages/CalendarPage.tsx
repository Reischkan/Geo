import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { authFetch } from '../hooks/authFetch';
import { useToast } from '../components/Toast';
import Modal, { FormField, BtnPrimary, BtnSecondary } from '../components/Modal';
import { calendarEvents as fallbackEvents, technicians as fallbackTechs } from '../data/mock';

interface Tech { id: string; name: string; }
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarPage() {
    const [month, setMonth] = useState(1); // Feb = 1 (0-indexed)
    const [year, setYear] = useState(2026);
    const { data: calendarEvents } = useApi<Record<number, { title: string; tech: string; color: string }[]>>(
        `/api/calendar/events?month=${month + 1}&year=${year}`, fallbackEvents,
    );
    const { data: techs } = useApi<Tech[]>('/api/technicians', fallbackTechs as any);
    const { toast } = useToast();
    const [showCreate, setShowCreate] = useState<number | null>(null);
    const [form, setForm] = useState({ title: '', techId: '', time: '09:00' });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const todayDate = new Date();
    const isCurrentMonth = todayDate.getMonth() === month && todayDate.getFullYear() === year;
    const today = isCurrentMonth ? todayDate.getDate() : -1;

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    const handleCreateSession = async () => {
        const tech = techs.find(t => t.id === form.techId);
        if (!form.title || !tech) { toast('error', 'Complete todos los campos'); return; }
        // Create as a work order with the scheduled date
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(showCreate).padStart(2, '0')}`;
        const res = await authFetch('/api/work-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: `OT-${String(Date.now()).slice(-4)}`,
                title: form.title,
                client: 'Ver OT',
                clientAddress: '',
                technicianId: form.techId,
                status: 'pendiente',
                priority: 'media',
                scheduledDate: dateStr,
                estimatedDuration: '2h',
                description: `Sesión programada a las ${form.time}`,
            }),
        });
        if (res.ok) {
            toast('success', `Sesión creada el ${showCreate}/${month + 1} para ${tech.name}`);
            setShowCreate(null);
            setForm({ title: '', techId: '', time: '09:00' });
        } else toast('error', 'Error al crear sesión');
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Calendario Maestro</h1>
                <p style={{ fontSize: 14, color: 'var(--color-geo-text-muted)', marginTop: 4 }}>
                    Haz clic en un día vacío para agendar una sesión
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
                    <div style={{ display: 'flex', gap: 4, background: 'var(--color-geo-surface-2)', padding: 3, borderRadius: 10 }}>
                        {['Mes', 'Semana', 'Día'].map((v, i) => (
                            <button key={v} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: i === 0 ? 'var(--color-geo-primary)' : 'transparent', color: i === 0 ? '#fff' : 'var(--color-geo-text-muted)' }}>
                                {v}
                            </button>
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
                        const events = day ? calendarEvents[day] || [] : [];
                        return (
                            <div
                                key={idx}
                                className={`calendar-cell ${day === today ? 'today' : ''}`}
                                style={{ opacity: day === null ? 0.3 : 1, minHeight: 100, cursor: day !== null ? 'pointer' : 'default', position: 'relative' }}
                                onClick={() => { if (day !== null) setShowCreate(day); }}
                            >
                                {day !== null && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 13, fontWeight: day === today ? 700 : 500, color: day === today ? 'var(--color-geo-primary-light)' : 'var(--color-geo-text-muted)' }}>
                                                {day}
                                            </span>
                                            {events.length === 0 && (
                                                <Plus size={12} style={{ color: 'var(--color-geo-text-dim)', opacity: 0.4 }} />
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            {events.slice(0, 3).map((ev, i) => (
                                                <div key={i} style={{ fontSize: 10, fontWeight: 600, padding: '3px 6px', borderRadius: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: `${ev.color}20`, color: ev.color, borderLeft: `2px solid ${ev.color}` }}>
                                                    {ev.tech} · {ev.title}
                                                </div>
                                            ))}
                                            {events.length > 3 && (
                                                <div style={{ fontSize: 10, color: 'var(--color-geo-text-dim)', paddingLeft: 4 }}>+{events.length - 3} más</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create Session Modal */}
            <Modal open={showCreate !== null} onClose={() => setShowCreate(null)} title="Programar Sesión" subtitle={`Día ${showCreate} de ${monthNames[month]} ${year}`} footer={<><BtnSecondary onClick={() => setShowCreate(null)}>Cancelar</BtnSecondary><BtnPrimary onClick={handleCreateSession}>Agendar</BtnPrimary></>}>
                <FormField label="Título de la Sesión">
                    <input className="geo-input" style={{ width: '100%' }} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Instalación fase 2..." />
                </FormField>
                <FormField label="Técnico Asignado">
                    <select className="geo-input" style={{ width: '100%', appearance: 'none' }} value={form.techId} onChange={e => setForm(f => ({ ...f, techId: e.target.value }))}>
                        <option value="">Seleccionar técnico...</option>
                        {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </FormField>
                <FormField label="Hora">
                    <input className="geo-input" type="time" style={{ width: '100%' }} value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </FormField>
            </Modal>
        </div>
    );
}
