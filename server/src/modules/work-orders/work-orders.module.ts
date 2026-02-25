import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from '../../entities/work-order.entity';
import { OrderComment } from '../../entities/order-comment.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { MaterialLog } from '../../entities/material-log.entity';
import { Technician } from '../../entities/technician.entity';
import { User } from '../../entities/user.entity';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

@Module({
    imports: [TypeOrmModule.forFeature([WorkOrder, OrderComment, InventoryItem, MaterialLog, Technician, User])],
    controllers: [WorkOrdersController],
    providers: [WorkOrdersService],
})
export class WorkOrdersModule { }
