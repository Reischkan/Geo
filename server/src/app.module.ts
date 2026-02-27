import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Technician } from './entities/technician.entity';
import { WorkOrder } from './entities/work-order.entity';
import { Project } from './entities/project.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { CalendarEvent } from './entities/calendar-event.entity';
import { ActivityFeedItem } from './entities/activity-feed.entity';
import { Client } from './entities/client.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';
import { OrderComment } from './entities/order-comment.entity';
import { MaterialLog } from './entities/material-log.entity';
import { TechInventory } from './entities/tech-inventory.entity';
import { TechniciansModule } from './modules/technicians/technicians.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ClientsModule } from './modules/clients/clients.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { SeedService } from './seed.service';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: 'geofield.db',
            entities: [Technician, WorkOrder, Project, InventoryItem, CalendarEvent, ActivityFeedItem, Client, AuditLog, Tenant, User, OrderComment, MaterialLog, TechInventory],
            synchronize: true,
        }),
        TypeOrmModule.forFeature([Technician, WorkOrder, Project, InventoryItem, CalendarEvent, ActivityFeedItem, Client, AuditLog, Tenant, User, OrderComment, MaterialLog, TechInventory]),
        TechniciansModule,
        WorkOrdersModule,
        ProjectsModule,
        InventoryModule,
        DashboardModule,
        CalendarModule,
        ClientsModule,
        AuditModule,
        AuthModule,
    ],
    providers: [SeedService],
})
export class AppModule { }
