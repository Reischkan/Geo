import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { TechInventory } from '../../entities/tech-inventory.entity';
import { Technician } from '../../entities/technician.entity';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
    imports: [TypeOrmModule.forFeature([InventoryItem, TechInventory, Technician])],
    controllers: [InventoryController],
    providers: [InventoryService],
})
export class InventoryModule { }
