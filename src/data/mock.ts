// GeoField Mock Data Layer
// Realistic data to simulate the API responses

export interface Technician {
    id: string;
    name: string;
    avatar: string;
    role: string;
    status: 'en-ruta' | 'disponible' | 'desconectado' | 'en-servicio';
    phone: string;
    lat: number;
    lng: number;
    completedOrders: number;
    rating: number;
    hoursLogged: number;
}

export interface WorkOrder {
    id: string;
    title: string;
    client: string;
    clientAddress: string;
    technicianId: string;
    status: 'pendiente' | 'en-progreso' | 'completada' | 'cancelada';
    priority: 'alta' | 'media' | 'baja';
    scheduledDate: string;
    estimatedDuration: string;
    projectId?: string;
    description: string;
}

export interface Project {
    id: string;
    title: string;
    clientId: string;
    client: string;
    status: 'activo' | 'completado' | 'pausado';
    startDate: string;
    endDateEst: string;
    progress: number;
    sessionsTotal: number;
    sessionsCompleted: number;
    technicianIds: string[];
}

export interface InventoryItem {
    id: string;
    sku: string;
    name: string;
    category: string;
    vehicleQty: number;
    warehouseQty: number;
    minStock: number;
    unit: string;
}

export interface Session {
    id: string;
    projectId: string;
    technicianId: string;
    date: string;
    checkInTime: string;
    checkOutTime: string | null;
    gpsLat: number;
    gpsLng: number;
    notes: string;
    photos: number;
    materialsUsed: string[];
}

// — Technicians — 
export const technicians: Technician[] = [
    { id: 'T001', name: 'Carlos Méndez', avatar: 'CM', role: 'Electricista Senior', status: 'en-ruta', phone: '+52 55 1234 5678', lat: 19.4326, lng: -99.1332, completedOrders: 342, rating: 4.8, hoursLogged: 1840 },
    { id: 'T002', name: 'María González', avatar: 'MG', role: 'Plomera Certificada', status: 'en-servicio', phone: '+52 55 2345 6789', lat: 19.4150, lng: -99.1700, completedOrders: 289, rating: 4.9, hoursLogged: 1560 },
    { id: 'T003', name: 'Roberto Silva', avatar: 'RS', role: 'Técnico HVAC', status: 'disponible', phone: '+52 55 3456 7890', lat: 19.4500, lng: -99.1200, completedOrders: 198, rating: 4.6, hoursLogged: 1120 },
    { id: 'T004', name: 'Ana Rodríguez', avatar: 'AR', role: 'Instaladora Solar', status: 'en-ruta', phone: '+52 55 4567 8901', lat: 19.3800, lng: -99.1800, completedOrders: 156, rating: 4.7, hoursLogged: 890 },
    { id: 'T005', name: 'Jorge Martínez', avatar: 'JM', role: 'Técnico General', status: 'desconectado', phone: '+52 55 5678 9012', lat: 19.4000, lng: -99.1500, completedOrders: 421, rating: 4.5, hoursLogged: 2100 },
    { id: 'T006', name: 'Laura Sánchez', avatar: 'LS', role: 'Pintora Industrial', status: 'en-servicio', phone: '+52 55 6789 0123', lat: 19.4250, lng: -99.1400, completedOrders: 167, rating: 4.8, hoursLogged: 940 },
];

// — Work Orders — 
export const workOrders: WorkOrder[] = [
    { id: 'OT-2401', title: 'Instalación Panel Solar 5kW', client: 'Residencial Las Lomas', clientAddress: 'Av. Reforma 234, Col. Polanco', technicianId: 'T004', status: 'en-progreso', priority: 'alta', scheduledDate: '2026-02-23', estimatedDuration: '4h', projectId: 'P001', description: 'Instalación de sistema fotovoltaico residencial de 5kW' },
    { id: 'OT-2402', title: 'Reparación Fuga de Agua', client: 'Torre Corporativa Alfa', clientAddress: 'Blvd. Miguel de Cervantes 150', technicianId: 'T002', status: 'en-progreso', priority: 'alta', scheduledDate: '2026-02-23', estimatedDuration: '2h', description: 'Fuga detectada en el piso 12, baño de ejecutivos' },
    { id: 'OT-2403', title: 'Mantenimiento A/C Preventivo', client: 'Hospital Santa Fe', clientAddress: 'Av. Vasco de Quiroga 3000', technicianId: 'T003', status: 'pendiente', priority: 'media', scheduledDate: '2026-02-23', estimatedDuration: '3h', description: 'Mantenimiento preventivo de 6 unidades HVAC' },
    { id: 'OT-2404', title: 'Cableado Estructurado Piso 3', client: 'Edificio Sigma', clientAddress: 'Insurgentes Sur 1602', technicianId: 'T001', status: 'en-progreso', priority: 'media', scheduledDate: '2026-02-23', estimatedDuration: '6h', projectId: 'P002', description: 'Tendido de cableado Cat6A para 40 puntos de red' },
    { id: 'OT-2405', title: 'Pintura Interior Oficinas', client: 'Centro Comercial Delta', clientAddress: 'Av. Universidad 1000', technicianId: 'T006', status: 'completada', priority: 'baja', scheduledDate: '2026-02-22', estimatedDuration: '8h', projectId: 'P003', description: 'Pintura de acabados en 3 locales comerciales' },
    { id: 'OT-2406', title: 'Revisión Tablero Eléctrico', client: 'Fábrica Omega', clientAddress: 'Parque Industrial Naucalpan', technicianId: 'T001', status: 'pendiente', priority: 'alta', scheduledDate: '2026-02-24', estimatedDuration: '2h', description: 'Diagnóstico y corrección de tablero principal de distribución' },
    { id: 'OT-2407', title: 'Instalación Calentador Solar', client: 'Residencial Monte Alto', clientAddress: 'Cerrada de los Pinos 45', technicianId: 'T002', status: 'pendiente', priority: 'media', scheduledDate: '2026-02-24', estimatedDuration: '3h', description: 'Instalación de calentador solar 150L' },
    { id: 'OT-2408', title: 'Servicio A/C Emergencia', client: 'Restaurant La Hacienda', clientAddress: 'Av. Patriotismo 229', technicianId: 'T003', status: 'cancelada', priority: 'alta', scheduledDate: '2026-02-21', estimatedDuration: '2h', description: 'Cliente canceló — rescheduled para la siguiente semana' },
    { id: 'OT-2409', title: 'Impermeabilización Azotea', client: 'Edificio Gamma', clientAddress: 'Calle Durango 247, Roma Norte', technicianId: 'T006', status: 'en-progreso', priority: 'media', scheduledDate: '2026-02-23', estimatedDuration: '5h', projectId: 'P004', description: 'Aplicación de membrana impermeabilizante en 200m²' },
    { id: 'OT-2410', title: 'Instalación Cámaras CCTV', client: 'Farmacia Biofarma', clientAddress: 'Av. Coyoacán 1538', technicianId: 'T005', status: 'completada', priority: 'baja', scheduledDate: '2026-02-20', estimatedDuration: '4h', description: 'Instalación de 8 cámaras IP + NVR' },
];

// — Projects —
export const projects: Project[] = [
    { id: 'P001', title: 'Sistema Solar Residencial Las Lomas', clientId: 'C001', client: 'Residencial Las Lomas', status: 'activo', startDate: '2026-02-20', endDateEst: '2026-02-25', progress: 60, sessionsTotal: 4, sessionsCompleted: 2, technicianIds: ['T004', 'T001'] },
    { id: 'P002', title: 'Cableado Estructurado Edificio Sigma', clientId: 'C002', client: 'Edificio Sigma', status: 'activo', startDate: '2026-02-18', endDateEst: '2026-02-28', progress: 35, sessionsTotal: 8, sessionsCompleted: 3, technicianIds: ['T001'] },
    { id: 'P003', title: 'Remodelación Centro Comercial Delta', clientId: 'C003', client: 'Centro Comercial Delta', status: 'activo', startDate: '2026-02-15', endDateEst: '2026-03-01', progress: 80, sessionsTotal: 10, sessionsCompleted: 8, technicianIds: ['T006', 'T005'] },
    { id: 'P004', title: 'Impermeabilización Edificio Gamma', clientId: 'C004', client: 'Edificio Gamma', status: 'activo', startDate: '2026-02-22', endDateEst: '2026-02-26', progress: 25, sessionsTotal: 3, sessionsCompleted: 1, technicianIds: ['T006'] },
];

// — Inventory —
export const inventory: InventoryItem[] = [
    { id: 'INV-001', sku: 'CAB-CAT6A-305', name: 'Cable Cat6A 305m', category: 'Cableado', vehicleQty: 4, warehouseQty: 12, minStock: 5, unit: 'rollos' },
    { id: 'INV-002', sku: 'PNL-SOL-400W', name: 'Panel Solar 400W Mono', category: 'Solar', vehicleQty: 8, warehouseQty: 24, minStock: 10, unit: 'piezas' },
    { id: 'INV-003', sku: 'TUB-COP-19MM', name: 'Tubo Cobre 19mm x 6m', category: 'Plomería', vehicleQty: 15, warehouseQty: 40, minStock: 20, unit: 'tramos' },
    { id: 'INV-004', sku: 'IMP-MEM-20L', name: 'Membrana Impermeabilizante 20L', category: 'Impermeabilización', vehicleQty: 3, warehouseQty: 8, minStock: 5, unit: 'cubetas' },
    { id: 'INV-005', sku: 'PIN-VIN-19L', name: 'Pintura Vinílica 19L', category: 'Pintura', vehicleQty: 6, warehouseQty: 18, minStock: 8, unit: 'cubetas' },
    { id: 'INV-006', sku: 'REF-R410A-10K', name: 'Refrigerante R-410A 10kg', category: 'HVAC', vehicleQty: 2, warehouseQty: 6, minStock: 4, unit: 'tanques' },
    { id: 'INV-007', sku: 'CAM-IP-4MP', name: 'Cámara IP 4MP PoE', category: 'Seguridad', vehicleQty: 0, warehouseQty: 14, minStock: 6, unit: 'piezas' },
    { id: 'INV-008', sku: 'INV-SOL-5KW', name: 'Inversor Solar 5kW Híbrido', category: 'Solar', vehicleQty: 1, warehouseQty: 3, minStock: 2, unit: 'piezas' },
    { id: 'INV-009', sku: 'TERM-DIG-PRO', name: 'Termostato Digital Programable', category: 'HVAC', vehicleQty: 5, warehouseQty: 22, minStock: 8, unit: 'piezas' },
    { id: 'INV-010', sku: 'SOLD-EST-1KG', name: 'Soldadura de Estaño 1kg', category: 'General', vehicleQty: 3, warehouseQty: 10, minStock: 4, unit: 'rollos' },
];

// — KPI Data —
export const kpiData = {
    ordersToday: 8,
    activeTechnicians: 4,
    fieldHours: 26.5,
    satisfaction: 4.7,
    ordersTrend: +12,
    techTrend: 0,
    hoursTrend: +8,
    satTrend: +0.2,
};

export const revenueChart = [
    { month: 'Sep', ingresos: 185000, costos: 72000 },
    { month: 'Oct', ingresos: 210000, costos: 78000 },
    { month: 'Nov', ingresos: 198000, costos: 68000 },
    { month: 'Dic', ingresos: 245000, costos: 85000 },
    { month: 'Ene', ingresos: 230000, costos: 82000 },
    { month: 'Feb', ingresos: 268000, costos: 90000 },
];

export const statusBreakdown = [
    { name: 'Completadas', value: 45, color: '#10b981' },
    { name: 'En Progreso', value: 28, color: '#3b82f6' },
    { name: 'Pendientes', value: 18, color: '#f59e0b' },
    { name: 'Canceladas', value: 9, color: '#ef4444' },
];

export const activityFeed = [
    { id: 1, type: 'check-in', message: 'Carlos Méndez hizo check-in en Edificio Sigma', time: 'Hace 12 min', icon: 'map-pin' },
    { id: 2, type: 'complete', message: 'Laura Sánchez completó OT-2405 — Pintura Interior', time: 'Hace 28 min', icon: 'check-circle' },
    { id: 3, type: 'photo', message: 'María González subió 3 fotos de evidencia', time: 'Hace 35 min', icon: 'camera' },
    { id: 4, type: 'material', message: 'Ana Rodríguez descontó 2x Panel Solar 400W', time: 'Hace 1 hora', icon: 'package' },
    { id: 5, type: 'alert', message: 'Stock bajo: Refrigerante R-410A (2 en vehículo)', time: 'Hace 1.5 horas', icon: 'alert-triangle' },
    { id: 6, type: 'route', message: 'Roberto Silva inició ruta hacia Hospital Santa Fe', time: 'Hace 2 horas', icon: 'navigation' },
];

// — Calendar Events (February 2026) —
export const calendarEvents: Record<number, { title: string; tech: string; color: string }[]> = {
    15: [{ title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' }],
    16: [{ title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' }],
    17: [{ title: 'Remodelación Delta', tech: 'JM', color: '#ec4899' }],
    18: [
        { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' },
        { title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' },
    ],
    19: [
        { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' },
        { title: 'Remodelación Delta', tech: 'JM', color: '#ec4899' },
    ],
    20: [
        { title: 'Solar Las Lomas', tech: 'AR', color: '#f59e0b' },
        { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' },
        { title: 'CCTV Biofarma', tech: 'JM', color: '#8b5cf6' },
        { title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' },
    ],
    21: [
        { title: 'Solar Las Lomas', tech: 'AR', color: '#f59e0b' },
        { title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' },
    ],
    22: [
        { title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' },
        { title: 'Impermeab. Gamma', tech: 'LS', color: '#06b6d4' },
    ],
    23: [
        { title: 'Solar Las Lomas', tech: 'AR', color: '#f59e0b' },
        { title: 'Fuga Torre Alfa', tech: 'MG', color: '#10b981' },
        { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' },
        { title: 'A/C Hospital', tech: 'RS', color: '#8b5cf6' },
        { title: 'Impermeab. Gamma', tech: 'LS', color: '#06b6d4' },
    ],
    24: [
        { title: 'Tablero Fábrica', tech: 'CM', color: '#ef4444' },
        { title: 'Calentador Monte Alto', tech: 'MG', color: '#10b981' },
        { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' },
    ],
    25: [
        { title: 'Solar Las Lomas', tech: 'AR', color: '#f59e0b' },
        { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' },
        { title: 'Remodelación Delta', tech: 'JM', color: '#ec4899' },
    ],
    26: [
        { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' },
        { title: 'Impermeab. Gamma', tech: 'LS', color: '#06b6d4' },
        { title: 'Remodelación Delta', tech: 'LS', color: '#ec4899' },
    ],
    27: [
        { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' },
        { title: 'Remodelación Delta', tech: 'JM', color: '#ec4899' },
    ],
    28: [
        { title: 'Cableado Sigma', tech: 'CM', color: '#3b82f6' },
    ],
};
