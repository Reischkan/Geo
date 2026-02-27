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
import { TechInventory } from './entities/tech-inventory.entity';

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
        @InjectRepository(TechInventory) private techInvRepo: Repository<TechInventory>,
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
            // MX users
            { id: 'U001', email: 'super@geofield.com', passwordHash: hash('super123'), name: 'Super Admin', role: 'super-admin', tenantId: T1, active: true },
            { id: 'U002', email: 'admin@geofield.mx', passwordHash: hash('admin123'), name: 'Admin Principal', role: 'admin', tenantId: T1, active: true },
            { id: 'U004', email: 'viewer@geofield.mx', passwordHash: hash('viewer123'), name: 'Visor MX', role: 'viewer', tenantId: T1, active: true },
            { id: 'U005', email: 'carlos@geofield.mx', passwordHash: hash('tech123'), name: 'Carlos Méndez', role: 'tecnico', technicianId: 'T001', tenantId: T1, active: true },
            { id: 'U006', email: 'maria@geofield.mx', passwordHash: hash('tech123'), name: 'María González', role: 'tecnico', technicianId: 'T002', tenantId: T1, active: true },
            { id: 'U007', email: 'roberto@geofield.mx', passwordHash: hash('tech123'), name: 'Roberto Silva', role: 'tecnico', technicianId: 'T003', tenantId: T1, active: true },
            // CO users
            { id: 'U003', email: 'admin@geofield.co', passwordHash: hash('admin123'), name: 'Admin Colombia', role: 'admin', tenantId: T2, active: true },
            { id: 'U010', email: 'andres@geofield.co', passwordHash: hash('tech123'), name: 'Andrés Gutiérrez', role: 'tecnico', technicianId: 'TC01', tenantId: T2, active: true },
            { id: 'U011', email: 'camila@geofield.co', passwordHash: hash('tech123'), name: 'Camila Restrepo', role: 'tecnico', technicianId: 'TC02', tenantId: T2, active: true },
            { id: 'U012', email: 'julian@geofield.co', passwordHash: hash('tech123'), name: 'Julián Ospina', role: 'tecnico', technicianId: 'TC03', tenantId: T2, active: true },
        ]);

        /* ══════════════════════════════════════════
           TENANT-MX  (México)
           ══════════════════════════════════════════ */

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
            { id: 'OT-2401', title: 'Instalación Panel Solar 5kW', client: 'Residencial Las Lomas', clientAddress: 'Av. Reforma 234, Col. Polanco', technicianId: 'T004', status: 'en-progreso', priority: 'alta', scheduledDate: '2026-02-23', endDate: '2026-02-25', estimatedDuration: '4h', projectId: 'P001', description: 'Instalación de sistema fotovoltaico residencial de 5kW', lat: 19.4280, lng: -99.2060, tenantId: T1 },
            { id: 'OT-2402', title: 'Reparación Fuga de Agua', client: 'Torre Corporativa Alfa', clientAddress: 'Blvd. Miguel de Cervantes 150', technicianId: 'T002', status: 'en-progreso', priority: 'alta', scheduledDate: '2026-02-23', endDate: '', estimatedDuration: '2h', projectId: undefined, description: 'Fuga detectada en el piso 12, baño de ejecutivos', lat: 19.4400, lng: -99.2040, tenantId: T1 },
            { id: 'OT-2403', title: 'Mantenimiento A/C Preventivo', client: 'Hospital Santa Fe', clientAddress: 'Av. Vasco de Quiroga 3000', technicianId: 'T003', status: 'pendiente', priority: 'media', scheduledDate: '2026-02-23', endDate: '', estimatedDuration: '3h', projectId: undefined, description: 'Mantenimiento preventivo de 6 unidades HVAC', lat: 19.3590, lng: -99.2710, tenantId: T1 },
            { id: 'OT-2404', title: 'Cableado Estructurado Piso 3', client: 'Edificio Sigma', clientAddress: 'Insurgentes Sur 1602', technicianId: 'T001', status: 'pendiente', priority: 'media', scheduledDate: '2026-02-23', endDate: '2026-02-26', estimatedDuration: '6h', projectId: 'P002', description: 'Tendido de cableado Cat6A para 40 puntos de red', lat: 19.3920, lng: -99.1780, tenantId: T1 },
            { id: 'OT-2405', title: 'Pintura Interior Oficinas', client: 'Centro Comercial Delta', clientAddress: 'Av. Universidad 1000', technicianId: 'T006', status: 'completada', priority: 'baja', scheduledDate: '2026-02-22', endDate: '2026-02-24', estimatedDuration: '8h', projectId: 'P003', description: 'Pintura de acabados en 3 locales comerciales', lat: 19.3580, lng: -99.1870, tenantId: T1 },
            { id: 'OT-2406', title: 'Revisión Tablero Eléctrico', client: 'Fábrica Omega', clientAddress: 'Parque Industrial Naucalpan', technicianId: 'T001', status: 'completada', priority: 'alta', scheduledDate: '2026-02-24', endDate: '2026-02-24', estimatedDuration: '2h', projectId: undefined, description: 'Diagnóstico y corrección de tablero principal de distribución', lat: 19.4780, lng: -99.2350, tenantId: T1 },
            { id: 'OT-2407', title: 'Instalación Calentador Solar', client: 'Residencial Monte Alto', clientAddress: 'Cerrada de los Pinos 45', technicianId: 'T002', status: 'pendiente', priority: 'media', scheduledDate: '2026-02-24', endDate: '2026-02-25', estimatedDuration: '3h', projectId: undefined, description: 'Instalación de calentador solar 150L', lat: 19.4100, lng: -99.2200, tenantId: T1 },
            { id: 'OT-2408', title: 'Servicio A/C Emergencia', client: 'Restaurant La Hacienda', clientAddress: 'Av. Patriotismo 229', technicianId: 'T003', status: 'cancelada', priority: 'alta', scheduledDate: '2026-02-21', endDate: '', estimatedDuration: '2h', projectId: undefined, description: 'Cliente canceló — rescheduled para la siguiente semana', lat: 19.4010, lng: -99.1730, tenantId: T1 },
            { id: 'OT-2409', title: 'Impermeabilización Azotea', client: 'Edificio Gamma', clientAddress: 'Calle Durango 247, Roma Norte', technicianId: 'T006', status: 'en-progreso', priority: 'media', scheduledDate: '2026-02-23', endDate: '2026-02-25', estimatedDuration: '5h', projectId: 'P004', description: 'Aplicación de membrana impermeabilizante en 200m²', lat: 19.4200, lng: -99.1630, tenantId: T1 },
            { id: 'OT-2410', title: 'Instalación Cámaras CCTV', client: 'Farmacia Biofarma', clientAddress: 'Av. Coyoacán 1538', technicianId: 'T005', status: 'completada', priority: 'baja', scheduledDate: '2026-02-20', endDate: '2026-02-22', estimatedDuration: '4h', projectId: undefined, description: 'Instalación de 8 cámaras IP + NVR', lat: 19.3720, lng: -99.1560, tenantId: T1 },
            { id: 'OT-7691', title: 'HINTA', client: 'Residencial Las Lomas', clientAddress: 'Av. Reforma 234', technicianId: 'T004', status: 'completada', priority: 'media', scheduledDate: '2026-02-25', endDate: '2026-02-25', estimatedDuration: '2h', projectId: undefined, description: '', lat: 19.43, lng: -99.13, tenantId: T1 },
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
            { id: 'INV-001', sku: 'CAB-CAT6A-305', name: 'Cable Cat6A 305m', category: 'Cableado', vehicleQty: 4, warehouseQty: 12, minStock: 5, unit: 'rollos', unitCost: 2800, tenantId: T1 },
            { id: 'INV-002', sku: 'PNL-SOL-400W', name: 'Panel Solar 400W Mono', category: 'Solar', vehicleQty: 8, warehouseQty: 24, minStock: 10, unit: 'piezas', unitCost: 4500, tenantId: T1 },
            { id: 'INV-003', sku: 'TUB-COP-19MM', name: 'Tubo Cobre 19mm x 6m', category: 'Plomería', vehicleQty: 15, warehouseQty: 40, minStock: 20, unit: 'tramos', unitCost: 380, tenantId: T1 },
            { id: 'INV-004', sku: 'IMP-MEM-20L', name: 'Membrana Impermeabilizante 20L', category: 'Impermeabilización', vehicleQty: 3, warehouseQty: 8, minStock: 5, unit: 'cubetas', unitCost: 1200, tenantId: T1 },
            { id: 'INV-005', sku: 'PIN-VIN-19L', name: 'Pintura Vinílica 19L', category: 'Pintura', vehicleQty: 6, warehouseQty: 18, minStock: 8, unit: 'cubetas', unitCost: 950, tenantId: T1 },
            { id: 'INV-006', sku: 'REF-R410A-10K', name: 'Refrigerante R-410A 10kg', category: 'HVAC', vehicleQty: 2, warehouseQty: 6, minStock: 4, unit: 'tanques', unitCost: 3200, tenantId: T1 },
            { id: 'INV-007', sku: 'CAM-IP-4MP', name: 'Cámara IP 4MP PoE', category: 'Seguridad', vehicleQty: 0, warehouseQty: 14, minStock: 6, unit: 'piezas', unitCost: 1800, tenantId: T1 },
            { id: 'INV-008', sku: 'INV-SOL-5KW', name: 'Inversor Solar 5kW Híbrido', category: 'Solar', vehicleQty: 1, warehouseQty: 3, minStock: 2, unit: 'piezas', unitCost: 12000, tenantId: T1 },
            { id: 'INV-009', sku: 'TERM-DIG-PRO', name: 'Termostato Digital Programable', category: 'HVAC', vehicleQty: 5, warehouseQty: 22, minStock: 8, unit: 'piezas', unitCost: 650, tenantId: T1 },
            { id: 'INV-010', sku: 'SOLD-EST-1KG', name: 'Soldadura de Estaño 1kg', category: 'General', vehicleQty: 3, warehouseQty: 10, minStock: 4, unit: 'rollos', unitCost: 280, tenantId: T1 },
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

        // Clients (tenant-mx)
        await this.clientRepo.save([
            { id: 'C001', name: 'Residencial Las Lomas', contactName: 'Ing. Roberto Garza', phone: '+52 55 1111 2222', email: 'admin@laslomas.mx', address: 'Av. Reforma 234, Col. Polanco', lat: 19.4326, lng: -99.1332, notes: 'Acceso by badge — guardia en caseta', active: true, tenantId: T1 },
            { id: 'C002', name: 'Edificio Sigma', contactName: 'Lic. Patricia Vega', phone: '+52 55 3333 4444', email: 'pvega@sigma.com', address: 'Insurgentes Sur 1602', lat: 19.3950, lng: -99.1700, notes: 'Estacionamiento subterráneo P3', active: true, tenantId: T1 },
            { id: 'C003', name: 'Centro Comercial Delta', contactName: 'Arq. Marco Torres', phone: '+52 55 5555 6666', email: 'mtorres@delta.mx', address: 'Av. Universidad 1000', lat: 19.3500, lng: -99.1800, notes: 'Coordinar con administración para acceso locales', active: true, tenantId: T1 },
            { id: 'C004', name: 'Edificio Gamma', contactName: 'Sr. Luis Herrera', phone: '+52 55 7777 8888', email: 'lherrera@gamma.mx', address: 'Calle Durango 247, Roma Norte', lat: 19.4200, lng: -99.1600, notes: 'Azotea tiene doble llave', active: true, tenantId: T1 },
            { id: 'C005', name: 'Fábrica Omega', contactName: 'Ing. Sandra Ruiz', phone: '+52 55 9999 0000', email: 'sruiz@omega.ind.mx', address: 'Parque Industrial Naucalpan', lat: 19.4800, lng: -99.2300, notes: 'Requiere casco y chaleco', active: true, tenantId: T1 },
            { id: 'C006', name: 'Hospital Santa Fe', contactName: 'Dr. Alejandro Fuentes', phone: '+52 55 1234 0000', email: 'mantenimiento@hsantafe.mx', address: 'Av. Vasco de Quiroga 3000', lat: 19.3660, lng: -99.2700, notes: 'Solo acceso por puerta de servicio', active: true, tenantId: T1 },
        ]);

        /* ══════════════════════════════════════════
           TENANT-CO  (Colombia — Bogotá)
           ══════════════════════════════════════════ */

        // Technicians (tenant-co) — Bogotá area coords
        await this.techRepo.save([
            { id: 'TC01', name: 'Andrés Gutiérrez', avatar: 'AG', role: 'Electricista Industrial', status: 'en-servicio', phone: '+57 310 123 4567', lat: 4.6510, lng: -74.0550, completedOrders: 215, rating: 4.7, hoursLogged: 1200, tenantId: T2 },
            { id: 'TC02', name: 'Camila Restrepo', avatar: 'CR', role: 'Técnica HVAC', status: 'en-ruta', phone: '+57 311 234 5678', lat: 4.6350, lng: -74.0830, completedOrders: 178, rating: 4.9, hoursLogged: 980, tenantId: T2 },
            { id: 'TC03', name: 'Julián Ospina', avatar: 'JO', role: 'Plomero Certificado', status: 'disponible', phone: '+57 312 345 6789', lat: 4.6690, lng: -74.0620, completedOrders: 143, rating: 4.6, hoursLogged: 850, tenantId: T2 },
            { id: 'TC04', name: 'Valentina Herrera', avatar: 'VH', role: 'Instaladora Solar', status: 'en-ruta', phone: '+57 313 456 7890', lat: 4.6200, lng: -74.0700, completedOrders: 92, rating: 4.8, hoursLogged: 540, tenantId: T2 },
            { id: 'TC05', name: 'Santiago Muñoz', avatar: 'SM', role: 'Técnico General', status: 'desconectado', phone: '+57 314 567 8901', lat: 4.6800, lng: -74.0450, completedOrders: 310, rating: 4.4, hoursLogged: 1650, tenantId: T2 },
        ]);

        // Work Orders (tenant-co) — Bogotá locations
        await this.orderRepo.save([
            { id: 'CO-3001', title: 'Instalación Red Eléctrica Trifásica', client: 'Centro Empresarial Andino', clientAddress: 'Carrera 11 #82-71, Bogotá', technicianId: 'TC01', status: 'en-progreso', priority: 'alta', scheduledDate: '2026-02-23', endDate: '2026-02-26', estimatedDuration: '6h', projectId: 'PC01', description: 'Instalación de red trifásica para datacenter piso 5', lat: 4.6680, lng: -74.0530, tenantId: T2 },
            { id: 'CO-3002', title: 'Mantenimiento Aire Acondicionado', client: 'Hotel Tequendama', clientAddress: 'Carrera 10 #26-21, Bogotá', technicianId: 'TC02', status: 'en-progreso', priority: 'alta', scheduledDate: '2026-02-23', endDate: '', estimatedDuration: '3h', projectId: undefined, description: 'Mantenimiento preventivo de 12 mini-splits en pisos 8-10', lat: 4.6140, lng: -74.0700, tenantId: T2 },
            { id: 'CO-3003', title: 'Reparación Tubería Agua Caliente', client: 'Clínica Country', clientAddress: 'Carrera 16 #82-57, Bogotá', technicianId: 'TC03', status: 'pendiente', priority: 'media', scheduledDate: '2026-02-24', endDate: '', estimatedDuration: '2h', projectId: undefined, description: 'Fuga en tubería de agua caliente sector cirugía', lat: 4.6690, lng: -74.0580, tenantId: T2 },
            { id: 'CO-3004', title: 'Instalación Paneles Solares 10kW', client: 'Universidad Javeriana', clientAddress: 'Carrera 7 #40-62, Bogotá', technicianId: 'TC04', status: 'en-progreso', priority: 'alta', scheduledDate: '2026-02-22', endDate: '2026-02-27', estimatedDuration: '8h', projectId: 'PC02', description: 'Sistema fotovoltaico para edificio administrativo', lat: 4.6280, lng: -74.0650, tenantId: T2 },
            { id: 'CO-3005', title: 'Cableado Fibra Óptica', client: 'Torre Colpatria', clientAddress: 'Carrera 7 #24-89, Bogotá', technicianId: 'TC01', status: 'pendiente', priority: 'media', scheduledDate: '2026-02-25', endDate: '2026-02-28', estimatedDuration: '5h', projectId: 'PC01', description: 'Tendido de fibra óptica monomodo pisos 1-15', lat: 4.6120, lng: -74.0690, tenantId: T2 },
            { id: 'CO-3006', title: 'Revisión Sistema Contra Incendios', client: 'Centro Comercial Santafé', clientAddress: 'Autopista Norte #183-55, Bogotá', technicianId: 'TC03', status: 'completada', priority: 'alta', scheduledDate: '2026-02-21', endDate: '2026-02-22', estimatedDuration: '4h', projectId: undefined, description: 'Inspección anual sistema rociadores y detectores de humo', lat: 4.7630, lng: -74.0440, tenantId: T2 },
            { id: 'CO-3007', title: 'Instalación Generador de Respaldo', client: 'Banco de Bogotá Sede Norte', clientAddress: 'Calle 72 #10-03, Bogotá', technicianId: 'TC05', status: 'completada', priority: 'alta', scheduledDate: '2026-02-20', endDate: '2026-02-21', estimatedDuration: '6h', projectId: undefined, description: 'Generador diésel 50kVA + transferencia automática', lat: 4.6560, lng: -74.0590, tenantId: T2 },
            { id: 'CO-3008', title: 'Pintura Fachada Exterior', client: 'Edificio Bacatá', clientAddress: 'Calle 19 #5-20, Bogotá', technicianId: 'TC05', status: 'cancelada', priority: 'baja', scheduledDate: '2026-02-19', endDate: '', estimatedDuration: '10h', projectId: undefined, description: 'Pospuesto por condiciones climáticas de lluvia', lat: 4.6050, lng: -74.0710, tenantId: T2 },
            { id: 'CO-3009', title: 'Mantenimiento Ascensores', client: 'Torres del Parque', clientAddress: 'Carrera 5 #26-63, Bogotá', technicianId: 'TC01', status: 'completada', priority: 'media', scheduledDate: '2026-02-24', endDate: '2026-02-24', estimatedDuration: '3h', projectId: undefined, description: 'Servicio preventivo trimestral ascensores torre B', lat: 4.6190, lng: -74.0660, tenantId: T2 },
            { id: 'CO-3010', title: 'Instalación Calentador Gas', client: 'Conjunto Residencial Laureles', clientAddress: 'Calle 127 #58-32, Bogotá', technicianId: 'TC02', status: 'pendiente', priority: 'media', scheduledDate: '2026-02-25', endDate: '', estimatedDuration: '2h', projectId: undefined, description: 'Instalación calentador de paso 16L y acometida gas', lat: 4.7060, lng: -74.0550, tenantId: T2 },
        ]);

        // Projects (tenant-co)
        await this.projectRepo.save([
            { id: 'PC01', title: 'Modernización Eléctrica Centro Andino', clientId: 'CC01', client: 'Centro Empresarial Andino', status: 'activo', startDate: '2026-02-18', endDateEst: '2026-03-05', progress: 40, sessionsTotal: 6, sessionsCompleted: 2, technicianIds: ['TC01'], tenantId: T2 },
            { id: 'PC02', title: 'Sistema Solar U. Javeriana', clientId: 'CC04', client: 'Universidad Javeriana', status: 'activo', startDate: '2026-02-22', endDateEst: '2026-03-10', progress: 20, sessionsTotal: 5, sessionsCompleted: 1, technicianIds: ['TC04', 'TC01'], tenantId: T2 },
            { id: 'PC03', title: 'Mantenimiento Preventivo Hotel Tequendama', clientId: 'CC02', client: 'Hotel Tequendama', status: 'activo', startDate: '2026-02-15', endDateEst: '2026-02-28', progress: 65, sessionsTotal: 8, sessionsCompleted: 5, technicianIds: ['TC02', 'TC03'], tenantId: T2 },
        ]);

        // Inventory (tenant-co)
        await this.inventoryRepo.save([
            { id: 'CO-INV-001', sku: 'CAB-FO-SM-500', name: 'Fibra Óptica Monomodo 500m', category: 'Cableado', vehicleQty: 2, warehouseQty: 8, minStock: 3, unit: 'rollos', unitCost: 450000, tenantId: T2 },
            { id: 'CO-INV-002', sku: 'PNL-SOL-550W', name: 'Panel Solar 550W Bifacial', category: 'Solar', vehicleQty: 6, warehouseQty: 20, minStock: 8, unit: 'piezas', unitCost: 980000, tenantId: T2 },
            { id: 'CO-INV-003', sku: 'TUB-PVC-2IN', name: 'Tubo PVC Presión 2" x 6m', category: 'Plomería', vehicleQty: 20, warehouseQty: 50, minStock: 15, unit: 'tramos', unitCost: 32000, tenantId: T2 },
            { id: 'CO-INV-004', sku: 'AC-MINISPLIT-18K', name: 'Mini Split Inverter 18000BTU', category: 'HVAC', vehicleQty: 1, warehouseQty: 4, minStock: 2, unit: 'piezas', unitCost: 2800000, tenantId: T2 },
            { id: 'CO-INV-005', sku: 'GEN-DIESEL-50K', name: 'Generador Diésel 50kVA', category: 'Eléctrico', vehicleQty: 0, warehouseQty: 2, minStock: 1, unit: 'piezas', unitCost: 35000000, tenantId: T2 },
            { id: 'CO-INV-006', sku: 'DET-HUMO-CERT', name: 'Detector de Humo Certificado', category: 'Seguridad', vehicleQty: 10, warehouseQty: 30, minStock: 15, unit: 'piezas', unitCost: 85000, tenantId: T2 },
            { id: 'CO-INV-007', sku: 'VALV-BOLA-1IN', name: 'Válvula de Bola 1"', category: 'Plomería', vehicleQty: 8, warehouseQty: 25, minStock: 10, unit: 'piezas', unitCost: 28000, tenantId: T2 },
            { id: 'CO-INV-008', sku: 'CAL-GAS-16L', name: 'Calentador a Gas 16L', category: 'Gas', vehicleQty: 2, warehouseQty: 5, minStock: 3, unit: 'piezas', unitCost: 680000, tenantId: T2 },
        ]);

        // Activity Feed (tenant-co)
        await this.activityRepo.save([
            { id: 7, type: 'check-in', message: 'Andrés Gutiérrez hizo check-in en Centro Andino', time: 'Hace 15 min', icon: 'map-pin', tenantId: T2 },
            { id: 8, type: 'complete', message: 'Santiago Muñoz completó CO-3007 — Generador de Respaldo', time: 'Hace 45 min', icon: 'check-circle', tenantId: T2 },
            { id: 9, type: 'route', message: 'Camila Restrepo en ruta hacia Hotel Tequendama', time: 'Hace 1 hora', icon: 'navigation', tenantId: T2 },
            { id: 10, type: 'material', message: 'Valentina Herrera descontó 4x Panel Solar 550W', time: 'Hace 2 horas', icon: 'package', tenantId: T2 },
            { id: 11, type: 'alert', message: 'Stock bajo: Generador Diésel 50kVA (0 en vehículo)', time: 'Hace 3 horas', icon: 'alert-triangle', tenantId: T2 },
        ]);

        // Clients (tenant-co) — Bogotá
        await this.clientRepo.save([
            { id: 'CC01', name: 'Centro Empresarial Andino', contactName: 'Ing. Felipe Moreno', phone: '+57 601 611 2233', email: 'fmoreno@centroandino.co', address: 'Carrera 11 #82-71, Bogotá', lat: 4.6680, lng: -74.0530, notes: 'Acceso con carnet visitante en recepción', active: true, tenantId: T2 },
            { id: 'CC02', name: 'Hotel Tequendama', contactName: 'Sra. Diana Pardo', phone: '+57 601 382 0000', email: 'mantenimiento@tequendama.co', address: 'Carrera 10 #26-21, Bogotá', lat: 4.6140, lng: -74.0700, notes: 'Coordinar con jefe de mantenimiento', active: true, tenantId: T2 },
            { id: 'CC03', name: 'Clínica Country', contactName: 'Dr. Mauricio Vargas', phone: '+57 601 530 0470', email: 'mvargas@clinicacountry.co', address: 'Carrera 16 #82-57, Bogotá', lat: 4.6690, lng: -74.0580, notes: 'Ingreso solo por urgencias con autorización', active: true, tenantId: T2 },
            { id: 'CC04', name: 'Universidad Javeriana', contactName: 'Arq. Camilo Rincón', phone: '+57 601 320 8320', email: 'crincon@javeriana.edu.co', address: 'Carrera 7 #40-62, Bogotá', lat: 4.6280, lng: -74.0650, notes: 'Acceso por portería de Carrera 7', active: true, tenantId: T2 },
            { id: 'CC05', name: 'Torre Colpatria', contactName: 'Ing. Adriana López', phone: '+57 601 335 6300', email: 'alopez@colpatria.co', address: 'Carrera 7 #24-89, Bogotá', lat: 4.6120, lng: -74.0690, notes: 'Horario de trabajo: 7am-5pm', active: true, tenantId: T2 },
            { id: 'CC06', name: 'Centro Comercial Santafé', contactName: 'Sr. Gustavo Peña', phone: '+57 601 657 0000', email: 'gpena@ccsantafe.co', address: 'Autopista Norte #183-55, Bogotá', lat: 4.7630, lng: -74.0440, notes: 'Acceso por plataforma de carga', active: true, tenantId: T2 },
        ]);

        /* ══════════════════════════════════════════
           Calendar Events (both tenants)
           ══════════════════════════════════════════ */
        const calEvents: any[] = [];

        // MX calendar
        const rawMx: Record<number, { title: string; tech: string; color: string }[]> = {
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
        for (const [day, events] of Object.entries(rawMx)) {
            for (const ev of events) {
                calEvents.push({ day: parseInt(day), month: 2, year: 2026, title: ev.title, tech: ev.tech, color: ev.color, tenantId: T1 });
            }
        }

        // CO calendar
        const rawCo: Record<number, { title: string; tech: string; color: string }[]> = {
            18: [{ title: 'Red Andino', tech: 'AG', color: '#3b82f6' }],
            19: [{ title: 'Red Andino', tech: 'AG', color: '#3b82f6' }, { title: 'Generador Banco', tech: 'SM', color: '#ef4444' }],
            20: [{ title: 'Generador Banco', tech: 'SM', color: '#ef4444' }, { title: 'Incendios Santafé', tech: 'JO', color: '#f59e0b' }],
            21: [{ title: 'Incendios Santafé', tech: 'JO', color: '#f59e0b' }],
            22: [{ title: 'Solar Javeriana', tech: 'VH', color: '#10b981' }, { title: 'A/C Tequendama', tech: 'CR', color: '#8b5cf6' }],
            23: [{ title: 'Red Andino', tech: 'AG', color: '#3b82f6' }, { title: 'Solar Javeriana', tech: 'VH', color: '#10b981' }, { title: 'A/C Tequendama', tech: 'CR', color: '#8b5cf6' }],
            24: [{ title: 'Tubería Country', tech: 'JO', color: '#06b6d4' }, { title: 'Solar Javeriana', tech: 'VH', color: '#10b981' }, { title: 'Ascensores Torres', tech: 'AG', color: '#ec4899' }],
            25: [{ title: 'Fibra Colpatria', tech: 'AG', color: '#3b82f6' }, { title: 'Calentador Laureles', tech: 'CR', color: '#f59e0b' }],
            26: [{ title: 'Fibra Colpatria', tech: 'AG', color: '#3b82f6' }, { title: 'Solar Javeriana', tech: 'VH', color: '#10b981' }],
            27: [{ title: 'Fibra Colpatria', tech: 'AG', color: '#3b82f6' }, { title: 'A/C Tequendama', tech: 'CR', color: '#8b5cf6' }],
            28: [{ title: 'Fibra Colpatria', tech: 'AG', color: '#3b82f6' }],
        };
        for (const [day, events] of Object.entries(rawCo)) {
            for (const ev of events) {
                calEvents.push({ day: parseInt(day), month: 2, year: 2026, title: ev.title, tech: ev.tech, color: ev.color, tenantId: T2 });
            }
        }

        await this.calendarRepo.save(calEvents);

        /* ══════════════════════════════════════════
           TECH INVENTORY ASSIGNMENTS
           ══════════════════════════════════════════ */
        await this.techInvRepo.save([
            // MX assignments
            { technicianId: 'T001', inventoryId: 'INV-001', qty: 3, tenantId: T1 },
            { technicianId: 'T001', inventoryId: 'INV-010', qty: 2, tenantId: T1 },
            { technicianId: 'T002', inventoryId: 'INV-003', qty: 5, tenantId: T1 },
            { technicianId: 'T003', inventoryId: 'INV-006', qty: 2, tenantId: T1 },
            { technicianId: 'T003', inventoryId: 'INV-009', qty: 4, tenantId: T1 },
            { technicianId: 'T004', inventoryId: 'INV-002', qty: 6, tenantId: T1 },
            { technicianId: 'T004', inventoryId: 'INV-008', qty: 1, tenantId: T1 },
            { technicianId: 'T005', inventoryId: 'INV-007', qty: 4, tenantId: T1 },
            { technicianId: 'T006', inventoryId: 'INV-004', qty: 3, tenantId: T1 },
            { technicianId: 'T006', inventoryId: 'INV-005', qty: 4, tenantId: T1 },
            // CO assignments
            { technicianId: 'TC01', inventoryId: 'CO-INV-001', qty: 2, tenantId: T2 },
            { technicianId: 'TC01', inventoryId: 'CO-INV-005', qty: 1, tenantId: T2 },
            { technicianId: 'TC02', inventoryId: 'CO-INV-004', qty: 1, tenantId: T2 },
            { technicianId: 'TC02', inventoryId: 'CO-INV-008', qty: 2, tenantId: T2 },
            { technicianId: 'TC03', inventoryId: 'CO-INV-003', qty: 10, tenantId: T2 },
            { technicianId: 'TC03', inventoryId: 'CO-INV-007', qty: 5, tenantId: T2 },
            { technicianId: 'TC04', inventoryId: 'CO-INV-002', qty: 4, tenantId: T2 },
            { technicianId: 'TC05', inventoryId: 'CO-INV-006', qty: 8, tenantId: T2 },
        ]);
    }
}
