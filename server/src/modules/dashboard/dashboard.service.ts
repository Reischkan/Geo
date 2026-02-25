import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder } from '../../entities/work-order.entity';
import { Technician } from '../../entities/technician.entity';
import { ActivityFeedItem } from '../../entities/activity-feed.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { MaterialLog } from '../../entities/material-log.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(WorkOrder) private readonly orderRepo: Repository<WorkOrder>,
        @InjectRepository(Technician) private readonly techRepo: Repository<Technician>,
        @InjectRepository(ActivityFeedItem) private readonly activityRepo: Repository<ActivityFeedItem>,
        @InjectRepository(InventoryItem) private readonly inventoryRepo: Repository<InventoryItem>,
        @InjectRepository(MaterialLog) private readonly logRepo: Repository<MaterialLog>,
    ) { }

    async getKpis(tenantId: string) {
        const today = new Date().toISOString().slice(0, 10);
        const allOrders = await this.orderRepo.find({ where: { tenantId } });
        const techs = await this.techRepo.find({ where: { tenantId } });

        // Orders scheduled today
        const ordersToday = allOrders.filter(o => o.scheduledDate === today).length;

        // Active technicians (not disconnected)
        const activeTechnicians = techs.filter(t => t.status !== 'desconectado').length;

        // Field hours: completada=2h, en-servicio/en-progreso=1h, en-ruta=0.5h
        const fieldHours = allOrders.reduce((s, o) => {
            if (o.status === 'completada') return s + 2;
            if (o.status === 'en-servicio' || o.status === 'en-progreso') return s + 1;
            if (o.status === 'en-ruta') return s + 0.5;
            return s;
        }, 0);

        // Satisfaction: ratio of completed to total (scaled 1-5)
        const completed = allOrders.filter(o => o.status === 'completada').length;
        const total = allOrders.length;
        const satisfaction = total > 0
            ? Math.round((completed / total) * 5 * 10) / 10
            : 0;

        // Trends: compare this week vs last week
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10);

        const thisWeekOrders = allOrders.filter(o => o.scheduledDate >= weekAgo && o.scheduledDate <= today).length;
        const lastWeekOrders = allOrders.filter(o => o.scheduledDate >= twoWeeksAgo && o.scheduledDate < weekAgo).length;
        const ordersTrend = lastWeekOrders > 0 ? Math.round(((thisWeekOrders - lastWeekOrders) / lastWeekOrders) * 100) : 0;

        return {
            ordersToday,
            activeTechnicians,
            fieldHours,
            satisfaction,
            ordersTrend,
            techTrend: 0,
            hoursTrend: 0,
            satTrend: 0,
        };
    }

    async getActivity(tenantId: string) {
        // Build activity from real data: recent orders + material logs
        const orders = await this.orderRepo.find({ where: { tenantId } });
        const logs = await this.logRepo.find({ where: { tenantId } });
        const techs = await this.techRepo.find({ where: { tenantId } });

        const techMap = new Map(techs.map(t => [t.id, t.name]));
        const activities: { id: string; type: string; icon: string; message: string; time: string }[] = [];

        // Order-based activities
        for (const o of orders) {
            const techName = techMap.get(o.technicianId) || o.technicianId;
            if (o.status === 'completada') {
                activities.push({
                    id: `act-${o.id}-complete`,
                    type: 'complete',
                    icon: 'check-circle',
                    message: `${techName} completó "${o.title}"`,
                    time: o.endDate || o.scheduledDate,
                });
            }
            if (o.status === 'en-ruta') {
                activities.push({
                    id: `act-${o.id}-route`,
                    type: 'route',
                    icon: 'navigation',
                    message: `${techName} en ruta hacia "${o.title}"`,
                    time: o.scheduledDate,
                });
            }
            if (o.status === 'en-servicio' || o.status === 'en-progreso') {
                activities.push({
                    id: `act-${o.id}-checkin`,
                    type: 'check-in',
                    icon: 'map-pin',
                    message: `${techName} llegó al sitio para "${o.title}"`,
                    time: o.scheduledDate,
                });
            }
        }

        // Material consumption activities
        for (const log of logs) {
            activities.push({
                id: `act-log-${log.id}`,
                type: 'material',
                icon: 'package',
                message: `${log.technicianName} usó ${log.qty}× ${log.inventoryName} en OT ${log.orderId}`,
                time: log.consumedAt,
            });
        }

        // Sort by time descending, take latest 15
        activities.sort((a, b) => b.time.localeCompare(a.time));
        return activities.slice(0, 15).map((a, i) => ({
            ...a,
            time: formatRelativeTime(a.time),
        }));
    }

    async getRevenueChart(tenantId: string) {
        // Build revenue/cost chart from real order data per month
        const orders = await this.orderRepo.find({ where: { tenantId } });
        const logs = await this.logRepo.find({ where: { tenantId } });
        const inventory = await this.inventoryRepo.find({ where: { tenantId } });
        const costMap = new Map(inventory.map(i => [i.id, i.unitCost || 0]));

        // Group by month (last 6 months)
        const now = new Date();
        const months: { month: string; key: string }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toISOString().slice(0, 7); // YYYY-MM
            const month = d.toLocaleString('es-MX', { month: 'short' });
            months.push({ month: month.charAt(0).toUpperCase() + month.slice(1), key });
        }

        return months.map(m => {
            // Count completed orders in this month as revenue
            const monthOrders = orders.filter(o => o.scheduledDate.startsWith(m.key));
            const completedInMonth = monthOrders.filter(o => o.status === 'completada').length;
            const ingresos = completedInMonth * 15000; // $15k estimated per order

            // Costs from material consumption in this month
            const monthLogs = logs.filter(l => l.consumedAt.startsWith(m.key));
            const costos = monthLogs.reduce((s, l) => s + l.qty * (costMap.get(l.inventoryId) || 500), 0);

            return { month: m.month, ingresos, costos };
        });
    }

    async getStatusBreakdown(tenantId: string) {
        const orders = await this.orderRepo.find({ where: { tenantId } });
        const counts: Record<string, number> = {};
        orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });

        // Map all status variants
        const enProgreso = (counts['en-progreso'] || 0) + (counts['en-ruta'] || 0) + (counts['en-servicio'] || 0);

        return [
            { name: 'Completadas', value: counts['completada'] || 0, color: '#10b981' },
            { name: 'En Progreso', value: enProgreso, color: '#3b82f6' },
            { name: 'Pendientes', value: counts['pendiente'] || 0, color: '#f59e0b' },
            { name: 'Canceladas', value: counts['cancelada'] || 0, color: '#ef4444' },
        ];
    }

    async getAlerts(tenantId: string) {
        const alerts: { type: string; severity: string; message: string }[] = [];

        // Disconnected technicians
        const techs = await this.techRepo.find({ where: { tenantId } });
        const disconnected = techs.filter(t => t.status === 'desconectado');
        disconnected.forEach(t => {
            alerts.push({ type: 'check-in', severity: 'warning', message: `${t.name} está desconectado` });
        });

        // Overdue orders
        const today = new Date().toISOString().slice(0, 10);
        const orders = await this.orderRepo.find({ where: { tenantId } });
        const overdue = orders.filter(o => o.status === 'pendiente' && o.scheduledDate < today);
        overdue.forEach(o => {
            alerts.push({ type: 'delay', severity: 'error', message: `OT ${o.id} "${o.title}" está retrasada` });
        });

        // Low stock items
        const inventory = await this.inventoryRepo.find({ where: { tenantId } });
        const lowStock = inventory.filter(i => (i.warehouseQty + i.vehicleQty) <= i.minStock);
        lowStock.forEach(i => {
            alerts.push({ type: 'stock', severity: 'warning', message: `Stock bajo: ${i.name} (${i.warehouseQty + i.vehicleQty}/${i.minStock} uds)` });
        });

        if (alerts.length === 0) {
            alerts.push({ type: 'info', severity: 'info', message: 'Sin alertas activas — todo en orden' });
        }
        return alerts;
    }
}

function formatRelativeTime(dateStr: string): string {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Hace ${diffD} día${diffD > 1 ? 's' : ''}`;
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}
