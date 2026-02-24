import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Technician } from './entities/technician.entity';
import { WorkOrder } from './entities/work-order.entity';
import { Project } from './entities/project.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { CalendarEvent } from './entities/calendar-event.entity';
import { ActivityFeedItem } from './entities/activity-feed.entity';
import { Client } from './entities/client.entity';
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';

const T1 = 'tenant-mx';
const T2 = 'tenant-co';

@Injectable()
export class SeedService implements OnModuleInit {
    private readonly logger = new Logger('SeedService');

    constructor(
        @InjectRepository(Technician) private techRepo: Repository<Technician>,
        @InjectRepository(WorkOrder) private orderRepo: Repository<WorkOrder>,
        @InjectRepository(Project) private projectRepo: Repository<Project>,
        @InjectRepository(InventoryItem) private inventoryRepo: Repository<InventoryItem>,
        @InjectRepository(CalendarEvent) private calendarRepo: Repository<CalendarEvent>,
        @InjectRepository(ActivityFeedItem) private activityRepo: Repository<ActivityFeedItem>,
        @InjectRepository(Client) private clientRepo: Repository<Client>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(User) private userRepo: Repository<User>,
    ) { }

    async onModuleInit() {
        const count = await this.tenantRepo.count();
        if (count > 0) {
            this.logger.log('Database already seeded, skipping.');
            return;
        }
        this.logger.log('Seeding database...');
        await this.seedAll();
        this.logger.log('✅ Database seeded successfully!');
    }

    private async seedAll() {
        // Tenants
        await this.tenantRepo.save([
            { id: T1, name: 'GeoField México', slug: 'geofield-mx', logoUrl: '', active: true },
            { id: T2, name: 'GeoField Colombia', slug: 'geofield-co', logoUrl: '', active: true },
        ]);

        // Users (passwords hashed with bcrypt)
        const hash = (pw: string) => bcrypt.hashSync(pw, 10);
        await this.userRepo.save([
            { id: 'U001', email: 'super@geofield.com', passwordHash: hash('super123'), name: 'Super Admin', role: 'super-admin', tenantId: T1, active: true },
            { id: 'U002', email: 'admin@geofield.mx', passwordHash: hash('admin123'), name: 'Admin Principal', role: 'admin', tenantId: T1, active: true },
            { id: 'U003', email: 'admin@geofield.co', passwordHash: hash('admin123'), name: 'Admin Colombia', role: 'admin', tenantId: T2, active: true },
            { id: 'U004', email: 'viewer@geofield.mx', passwordHash: hash('viewer123'), name: 'Visor MX', role: 'viewer', tenantId: T1, active: true },
        ]);

        // Technicians (tenant-mx)
        await this.techRepo.save([
            { id: 'T001', name: 'Carlos Méndez', avatar: 'CM', role: 'Electricista Senior', status: 'en-ruta', phone: '+52 55 1234 5678', lat: 19.4326, lng: -99.1332, completedOrders: 342, rating: 4.8, hoursLogged: 1840, tenantId: T1 },
            { id: 'T002', name: 'María González', avatar: 'MG', role: 'Plomera Certificada', status: 'en-servicio', phone: '+52 55 2345 6789', lat: 19.4150, lng: -99.1700, completedOrders: 289, rating: 4.9, hoursLogged: 1560, tenantId: T1 },
            { id: 'T003', name: 'Roberto Silva', avatar: 'RS', role: 'Técnico HVAC', status: 'disponible', phone: '+52 55 3456 7890', lat: 19.4500, lng: -99.1200, completedOrders: 198, rating: 4.6, hoursLogged: 1120, tenantId: T1 },
            { id: 'T004', name: 'Ana Rodríguez', avatar: 'AR', role: 'Instaladora Solar', status: 'en-ruta', phone: '+52 55 4567 8901', lat: 19.3800, lng: -99.1800, completedOrders: 156, rating: 4.7, hoursLogged: 890, tenantId: T1 },
            { id: 'T005', name: 'Jorge Martínez', avatar: 'JM', role: 'Técnico General', status: 'desconectado', phone: '+52 55 5678 9012', lat: 19.4000, lng: -99.1500, completedOrders: 421, rating: 4.5, hoursLogged: 2100, tenantId: T1 },
            { id: 'T006', name: 'Laura Sánchez', avatar: 'LS', role: 'Pintora Industrial', status: 'en-servicio', phone: '+52 55 6789 0123', lat: 19.4250, lng: -99.1400, completedOrders: 167, rating: 4.8, hoursLogged: 940, tenantId: T1 },
        ]);

        // Work Orders (tenant-mx)
        await this.orderRepo.save([
            { id: 'OT-2401', title: 'Instalación Panel Solar 5kW', client: 'Residencial Las Lomas', clientAddress: 'Av. Reforma 234, Col. Polanco', technicianId: 'T004', status: 'en-progreso', priority: 'alta', scheduledDate: '2026-02-23', estimatedDuration: '4h', projectId: 'P001', description: 'Instalación de sistema fotovoltaico residencial de 5kW', tenantId: T1 },
            { id: 'OT-2402', title: 'Reparación Fuga de Agua', client: 'Torre Corporativa Alfa', clientAddress: 'Blvd. Miguel de Cervantes 150', technicianId: 'T002', status: 'en-progreso', priority: 'alta', scheduledDate: '2026-02-23', estimatedDuration: '2h', projectId: undefined, description: 'Fuga detectada en el piso 12, baño de ejecutivos', tenantId: T1 },
            { id: 'OT-2403', title: 'Mantenimiento A/C Preventivo', client: 'Hospital Santa Fe', clientAddress: 'Av. Vasco de Quiroga 3000', technicianId: 'T003', status: 'pendiente', priority: 'media', scheduledDate: '2026-02-23', estimatedDuration: '3h', projectId: undefined, description: 'Mantenimiento preventivo de 6 unidades HVAC', tenantId: T1 },
            { id: 'OT-2404', title: 'Cableado Estructurado Piso 3', client: 'Edificio Sigma', clientAddress: 'Insurgentes Sur 1602', technicianId: 'T001', status: 'en-progreso', priority: 'media', scheduledDate: '2026-02-23', estimatedDuration: '6h', projectId: 'P002', description: 'Tendido de cableado Cat6A para 40 puntos de red', tenantId: T1 },
            { id: 'OT-2405', title: 'Pintura Interior Oficinas', client: 'Centro Comercial Delta', clientAddress: 'Av. Universidad 1000', technicianId: 'T006', status: 'completada', priority: 'baja', scheduledDate: '2026-02-22', estimatedDuration: '8h', projectId: 'P003', description: 'Pintura de acabados en 3 locales comerciales', tenantId: T1 },
            { id: 'OT-2406', title: 'Revisión Tablero Eléctrico', client: 'Fábrica Omega', clientAddress: 'Parque Industrial Naucalpan', technicianId: 'T001', status: 'pendiente', priority: 'alta', scheduledDate: '2026-02-24', estimatedDuration: '2h', projectId: undefined, description: 'Diagnóstico y corrección de tablero principal de distribución', tenantId: T1 },
            { id: 'OT-2407', title: 'Instalación Calentador Solar', client: 'Residencial Monte Alto', clientAddress: 'Cerrada de los Pinos 45', technicianId: 'T002', status: 'pendiente', priority: 'media', scheduledDate: '2026-02-24', estimatedDuration: '3h', projectId: undefined, description: 'Instalación de calentador solar 150L', tenantId: T1 },
            { id: 'OT-2408', title: 'Servicio A/C Emergencia', client: 'Restaurant La Hacienda', clientAddress: 'Av. Patriotismo 229', technicianId: 'T003', status: 'cancelada', priority: 'alta', scheduledDate: '2026-02-21', estimatedDuration: '2h', projectId: undefined, description: 'Cliente canceló — rescheduled para la siguiente semana', tenantId: T1 },
            { id: 'OT-2409', title: 'Impermeabilización Azotea', client: 'Edificio Gamma', clientAddress: 'Calle Durango 247, Roma Norte', technicianId: 'T006', status: 'en-progreso', priority: 'media', scheduledDate: '2026-02-23', estimatedDuration: '5h', projectId: 'P004', description: 'Aplicación de membrana impermeabilizante en 200m²', tenantId: T1 },
            { id: 'OT-2410', title: 'Instalación Cámaras CCTV', client: 'Farmacia Biofarma', clientAddress: 'Av. Coyoacán 1538', technicianId: 'T005', status: 'completada', priority: 'baja', scheduledDate: '2026-02-20', estimatedDuration: '4h', projectId: undefined, description: 'Instalación de 8 cámaras IP + NVR', tenantId: T1 },
        ]);

        // Projects (tenant-mx)
        await this.projectRepo.save([
            { id: 'P001', title: 'Sistema Solar Residencial Las Lomas', clientId: 'C001', client: 'Residencial Las Lomas', status: 'activo', startDate: '2026-02-20', endDateEst: '2026-02-25', progress: 60, sessionsTotal: 4, sessionsCompleted: 2, technicianIds: ['T004', 'T001'], tenantId: T1 },
            { id: 'P002', title: 'Cableado Estructurado Edificio Sigma', clientId: 'C002', client: 'Edificio Sigma', status: 'activo', startDate: '2026-02-18', endDateEst: '2026-02-28', progress: 35, sessionsTotal: 8, sessionsCompleted: 3, technicianIds: ['T001'], tenantId: T1 },
            { id: 'P003', title: 'Remodelación Centro Comercial Delta', clientId: 'C003', client: 'Centro Comercial Delta', status: 'activo', startDate: '2026-02-15', endDateEst: '2026-03-01', progress: 80, sessionsTotal: 10, sessionsCompleted: 8, technicianIds: ['T006', 'T005'], tenantId: T1 },
            { id: 'P004', title: 'Impermeabilización Edificio Gamma', clientId: 'C004', client: 'Edificio Gamma', status: 'activo', startDate: '2026-02-22', endDateEst: '2026-02-26', progress: 25, sessionsTotal: 3, sessionsCompleted: 1, technicianIds: ['T006'], tenantId: T1 },
        ]);

        // Inventory (tenant-mx)
        await this.inventoryRepo.save([
            { id: 'INV-001', sku: 'CAB-CAT6A-305', name: 'Cable Cat6A 305m', category: 'Cableado', vehicleQty: 4, warehouseQty: 12, minStock: 5, unit: 'rollos', tenantId: T1 },
            { id: 'INV-002', sku: 'PNL-SOL-400W', name: 'Panel Solar 400W Mono', category: 'Solar', vehicleQty: 8, warehouseQty: 24, minStock: 10, unit: 'piezas', tenantId: T1 },
            { id: 'INV-003', sku: 'TUB-COP-19MM', name: 'Tubo Cobre 19mm x 6m', category: 'Plomería', vehicleQty: 15, warehouseQty: 40, minStock: 20, unit: 'tramos', tenantId: T1 },
            { id: 'INV-004', sku: 'IMP-MEM-20L', name: 'Membrana Impermeabilizante 20L', category: 'Impermeabilización', vehicleQty: 3, warehouseQty: 8, minStock: 5, unit: 'cubetas', tenantId: T1 },
            { id: 'INV-005', sku: 'PIN-VIN-19L', name: 'Pintura Vinílica 19L', category: 'Pintura', vehicleQty: 6, warehouseQty: 18, minStock: 8, unit: 'cubetas', tenantId: T1 },
            { id: 'INV-006', sku: 'REF-R410A-10K', name: 'Refrigerante R-410A 10kg', category: 'HVAC', vehicleQty: 2, warehouseQty: 6, minStock: 4, unit: 'tanques', tenantId: T1 },
            { id: 'INV-007', sku: 'CAM-IP-4MP', name: 'Cámara IP 4MP PoE', category: 'Seguridad', vehicleQty: 0, warehouseQty: 14, minStock: 6, unit: 'piezas', tenantId: T1 },
            { id: 'INV-008', sku: 'INV-SOL-5KW', name: 'Inversor Solar 5kW Híbrido', category: 'Solar', vehicleQty: 1, warehouseQty: 3, minStock: 2, unit: 'piezas', tenantId: T1 },
            { id: 'INV-009', sku: 'TERM-DIG-PRO', name: 'Termostato Digital Programable', category: 'HVAC', vehicleQty: 5, warehouseQty: 22, minStock: 8, unit: 'piezas', tenantId: T1 },
            { id: 'INV-010', sku: 'SOLD-EST-1KG', name: 'Soldadura de Estaño 1kg', category: 'General', vehicleQty: 3, warehouseQty: 10, minStock: 4, unit: 'rollos', tenantId: T1 },
        ]);

        // Activity Feed (tenant-mx)
        await this.activityRepo.save([
            { id: 1, type: 'check-in', message: 'Carlos Méndez hizo check-in en Edificio Sigma', time: 'Hace 12 min', icon: 'map-pin', tenantId: T1 },
            { id: 2, type: 'complete', message: 'Laura Sánchez completó OT-2405 — Pintura Interior', time: 'Hace 28 min', icon: 'check-circle', tenantId: T1 },
            { id: 3, type: 'photo', message: 'María González subió 3 fotos de evidencia', time: 'Hace 35 min', icon: 'camera', tenantId: T1 },
            { id: 4, type: 'material', message: 'Ana Rodríguez descontó 2x Panel Solar 400W', time: 'Hace 1 hora', icon: 'package', tenantId: T1 },
            { id: 5, type: 'alert', message: 'Stock bajo: Refrigerante R-410A (2 en vehículo)', time: 'Hace 1.5 horas', icon: 'alert-triangle', tenantId: T1 },
            { id: 6, type: 'route', message: 'Roberto Silva inició ruta hacia Hospital Santa Fe', time: 'Hace 2 horas', icon: 'navigation', tenantId: T1 },
        ]);

        // Calendar Events February 2026 (tenant-mx)
        const calEvents: any[] = [];
        const raw: Record<number, { title: string; tech: string; color: string }[]> = {
            15: [{ title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' }],
            16: [{ title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' }],
            17: [{ title: 'Remodelación Delta', tech: 'JM', color: '#ec4899' }],
            18: [{ title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' }, { title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' }],
            19: [{ title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' }, { title: 'Remodelación Delta', tech: 'JM', color: '#ec4899' }],
            20: [{ title: 'Solar Las Lomas', tech: 'AR', color: '#f59e0b' }, { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' }, { title: 'CCTV Biofarma', tech: 'JM', color: '#8b5cf6' }, { title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' }],
            21: [{ title: 'Solar Las Lomas', tech: 'AR', color: '#f59e0b' }, { title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' }],
            22: [{ title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' }, { title: 'Impermeab. Gamma', tech: 'LS', color: '#06b6d4' }],
            23: [{ title: 'Solar Las Lomas', tech: 'AR', color: '#f59e0b' }, { title: 'Fuga Torre Alfa', tech: 'MG', color: '#10b981' }, { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' }, { title: 'A/C Hospital', tech: 'RS', color: '#8b5cf6' }, { title: 'Impermeab. Gamma', tech: 'LS', color: '#06b6d4' }],
            24: [{ title: 'Tablero Fábrica', tech: 'CM', color: '#ef4444' }, { title: 'Calentador Monte Alto', tech: 'MG', color: '#10b981' }, { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' }],
            25: [{ title: 'Solar Las Lomas', tech: 'AR', color: '#f59e0b' }, { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' }, { title: 'Remodelación Delta', tech: 'JM', color: '#ec4899' }],
            26: [{ title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' }, { title: 'Impermeab. Gamma', tech: 'LS', color: '#06b6d4' }, { title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' }],
            27: [{ title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' }, { title: 'Remodelación Delta', tech: 'JM', color: '#ec4899' }],
            28: [{ title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' }],
        };
        for (const [day, events] of Object.entries(raw)) {
            for (const ev of events) {
                calEvents.push({ day: parseInt(day), month: 2, year: 2026, title: ev.title, tech: ev.tech, color: ev.color, tenantId: T1 });
            }
        }
        await this.calendarRepo.save(calEvents);

        // Clients (tenant-mx)
        await this.clientRepo.save([
            { id: 'C001', name: 'Residencial Las Lomas', contactName: 'Ing. Roberto Garza', phone: '+52 55 1111 2222', email: 'admin@laslomas.mx', address: 'Av. Reforma 234, Col. Polanco', lat: 19.4326, lng: -99.1332, notes: 'Acceso by badge — guardia en caseta', active: true, tenantId: T1 },
            { id: 'C002', name: 'Edificio Sigma', contactName: 'Lic. Patricia Vega', phone: '+52 55 3333 4444', email: 'pvega@sigma.com', address: 'Insurgentes Sur 1602', lat: 19.3950, lng: -99.1700, notes: 'Estacionamiento subterráneo P3', active: true, tenantId: T1 },
            { id: 'C003', name: 'Centro Comercial Delta', contactName: 'Arq. Marco Torres', phone: '+52 55 5555 6666', email: 'mtorres@delta.mx', address: 'Av. Universidad 1000', lat: 19.3500, lng: -99.1800, notes: 'Coordinar con administración para acceso locales', active: true, tenantId: T1 },
            { id: 'C004', name: 'Edificio Gamma', contactName: 'Sr. Luis Herrera', phone: '+52 55 7777 8888', email: 'lherrera@gamma.mx', address: 'Calle Durango 247, Roma Norte', lat: 19.4200, lng: -99.1600, notes: 'Azotea tiene doble llave', active: true, tenantId: T1 },
            { id: 'C005', name: 'Fábrica Omega', contactName: 'Ing. Sandra Ruiz', phone: '+52 55 9999 0000', email: 'sruiz@omega.ind.mx', address: 'Parque Industrial Naucalpan', lat: 19.4800, lng: -99.2300, notes: 'Requiere casco y chaleco', active: true, tenantId: T1 },
            { id: 'C006', name: 'Hospital Santa Fe', contactName: 'Dr. Alejandro Fuentes', phone: '+52 55 1234 0000', email: 'mantenimiento@hsantafe.mx', address: 'Av. Vasco de Quiroga 3000', lat: 19.3660, lng: -99.2700, notes: 'Solo acceso por puerta de servicio', active: true, tenantId: T1 },
        ]);
    }
}
