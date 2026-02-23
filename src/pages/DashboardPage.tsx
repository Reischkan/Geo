import {
    TrendingUp, TrendingDown, Minus,
    ClipboardList, Users, Clock, Star,
    MapPin, CheckCircle, Camera, Package, AlertTriangle, Navigation,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { kpiData as fallbackKpi, revenueChart as fallbackRevenue, statusBreakdown as fallbackStatus, activityFeed as fallbackActivity } from '../data/mock';

const iconMap: Record<string, React.ReactNode> = {
    'map-pin': <MapPin size={15} />,
    'check-circle': <CheckCircle size={15} />,
    'camera': <Camera size={15} />,
    'package': <Package size={15} />,
    'alert-triangle': <AlertTriangle size={15} />,
    'navigation': <Navigation size={15} />,
};

const typeColorMap: Record<string, string> = {
    'check-in': '#3b82f6',
    'complete': '#10b981',
    'photo': '#8b5cf6',
    'material': '#f59e0b',
    'alert': '#ef4444',
    'route': '#06b6d4',
};

function TrendBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
    if (value > 0) return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: '#34d399' }}>
            <TrendingUp size={13} /> +{value}{suffix}
        </span>
    );
    if (value < 0) return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: '#f87171' }}>
            <TrendingDown size={13} /> {value}{suffix}
        </span>
    );
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: 'var(--color-geo-text-dim)' }}>
            <Minus size={13} /> 0{suffix}
        </span>
    );
}

export default function DashboardPage() {
    const { data: kpiData } = useApi('/api/dashboard/kpis', fallbackKpi);
    const { data: revenueChart } = useApi('/api/dashboard/revenue-chart', fallbackRevenue);
    const { data: statusBreakdown } = useApi('/api/dashboard/status-breakdown', fallbackStatus);
    const { data: activityFeed } = useApi('/api/dashboard/activity', fallbackActivity);
    const { data: alerts } = useApi<{ type: string; severity: string; message: string }[]>('/api/dashboard/alerts', []);

    const severityColors: Record<string, { bg: string; border: string; color: string }> = {
        error: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.25)', color: '#f87171' },
        warning: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.25)', color: '#fbbf24' },
        info: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)', color: '#60a5fa' },
    };


    const stats = [
        { label: 'Órdenes Hoy', value: kpiData.ordersToday, trend: kpiData.ordersTrend, icon: ClipboardList, color: 'blue', iconBg: 'rgba(59,130,246,0.15)', iconColor: '#60a5fa' },
        { label: 'Técnicos Activos', value: kpiData.activeTechnicians, trend: kpiData.techTrend, icon: Users, color: 'green', iconBg: 'rgba(16,185,129,0.15)', iconColor: '#34d399' },
        { label: 'Horas en Campo', value: kpiData.fieldHours, trend: kpiData.hoursTrend, icon: Clock, color: 'purple', iconBg: 'rgba(139,92,246,0.15)', iconColor: '#a78bfa', suffix: 'h' },
        { label: 'Satisfacción', value: kpiData.satisfaction, trend: kpiData.satTrend, icon: Star, color: 'amber', iconBg: 'rgba(245,158,11,0.15)', iconColor: '#fbbf24', suffix: '' },
    ];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Dashboard</h1>
                <p style={{ fontSize: 14, color: 'var(--color-geo-text-muted)', marginTop: 4 }}>
                    Resumen operativo — 23 de Febrero 2026
                </p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {stats.map((s, i) => (
                    <div
                        key={s.label}
                        className={`glass-card stat-card ${s.color} animate-fade-in-up animate-delay-${i + 1}`}
                        style={{ padding: '22px 24px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 6, color: 'var(--color-geo-text)' }}>
                                    {s.value}{s.suffix !== undefined ? s.suffix : ''}
                                </div>
                            </div>
                            <div style={{
                                width: 42, height: 42, borderRadius: 12,
                                background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <s.icon size={20} style={{ color: s.iconColor }} />
                            </div>
                        </div>
                        <TrendBadge value={s.trend} suffix={s.label === 'Satisfacción' ? '' : '%'} />
                        <span style={{ fontSize: 11, color: 'var(--color-geo-text-dim)', marginLeft: 6 }}>vs. semana pasada</span>
                    </div>
                ))}
            </div>

            {/* Alerts Panel */}
            {alerts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-geo-text)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <AlertTriangle size={16} style={{ color: '#fbbf24' }} /> Alertas del Sistema
                    </div>
                    {alerts.map((a, i) => {
                        const sc = severityColors[a.severity] || severityColors.info;
                        return (
                            <div key={i} className="glass-card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, borderColor: sc.border, background: sc.bg }}>
                                <AlertTriangle size={16} style={{ color: sc.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: 'var(--color-geo-text-muted)', flex: 1 }}>{a.message}</span>
                                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: `${sc.color}18`, color: sc.color }}>{a.severity.toUpperCase()}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
                {/* Revenue chart */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-geo-text)' }}>Ingresos vs Costos</div>
                            <div style={{ fontSize: 12, color: 'var(--color-geo-text-dim)', marginTop: 2 }}>Últimos 6 meses</div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-geo-text-muted)' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> Ingresos
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-geo-text-muted)' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }} /> Costos
                            </span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={revenueChart}>
                            <defs>
                                <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradCostos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                contentStyle={{ background: '#1a2236', border: '1px solid #334155', borderRadius: 8, fontSize: 13 }}
                                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                            />
                            <Area type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradIngresos)" />
                            <Area type="monotone" dataKey="costos" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradCostos)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Status breakdown */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-geo-text)', marginBottom: 4 }}>Estado de OTs</div>
                    <div style={{ fontSize: 12, color: 'var(--color-geo-text-dim)', marginBottom: 16 }}>Este mes</div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <ResponsiveContainer width={200} height={200}>
                            <PieChart>
                                <Pie
                                    data={statusBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {statusBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                        {statusBreakdown.map((s) => (
                            <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                                    <span style={{ fontSize: 13, color: 'var(--color-geo-text-muted)' }}>{s.name}</span>
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-geo-text)' }}>{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Activity Feed */}
            <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-geo-text)' }}>
                    Actividad Reciente
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {activityFeed.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 8px',
                                borderRadius: 10, transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <div style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: `${typeColorMap[item.type]}18`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: typeColorMap[item.type],
                                flexShrink: 0,
                            }}>
                                {iconMap[item.icon]}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, color: 'var(--color-geo-text)', lineHeight: 1.4 }}>{item.message}</div>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-geo-text-dim)', whiteSpace: 'nowrap', flexShrink: 0 }}>{item.time}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
