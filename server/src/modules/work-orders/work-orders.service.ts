import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder } from '../../entities/work-order.entity';

@Injectable()
export class WorkOrdersService {
    constructor(
        @InjectRepository(WorkOrder)
        private readonly repo: Repository<WorkOrder>,
    ) { }

    findAll(tenantId: string, status?: string) {
        const where: any = { tenantId };
        if (status && status !== 'all') where.status = status;
        return this.repo.find({ where });
    }

    async findOne(id: string, tenantId: string) {
        const order = await this.repo.findOneBy({ id, tenantId });
        if (!order) throw new NotFoundException(`WorkOrder ${id} not found`);
        return order;
    }

    create(data: Partial<WorkOrder>, tenantId: string) {
        const order = this.repo.create({ ...data, tenantId });
        return this.repo.save(order);
    }

    async update(id: string, data: Partial<WorkOrder>, tenantId: string) {
        await this.repo.update({ id, tenantId }, data);
        return this.findOne(id, tenantId);
    }

    async archive(id: string, tenantId: string) {
        await this.repo.update({ id, tenantId }, { status: 'archivada' });
        return { message: `WorkOrder ${id} archived` };
    }
}
