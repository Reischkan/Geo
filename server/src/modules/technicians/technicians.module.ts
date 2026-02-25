import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Technician } from '../../entities/technician.entity';
import { User } from '../../entities/user.entity';
import { WorkOrder } from '../../entities/work-order.entity';
import { TechniciansController } from './technicians.controller';
import { TechniciansService } from './technicians.service';

@Module({
    imports: [TypeOrmModule.forFeature([Technician, User, WorkOrder])],
    controllers: [TechniciansController],
    providers: [TechniciansService],
    exports: [TechniciansService],
})
export class TechniciansModule { }
