import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from '../../entities/work-order.entity';
import { Technician } from '../../entities/technician.entity';
import { ActivityFeedItem } from '../../entities/activity-feed.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { MaterialLog } from '../../entities/material-log.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
    imports: [TypeOrmModule.forFeature([WorkOrder, Technician, ActivityFeedItem, InventoryItem, MaterialLog])],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
