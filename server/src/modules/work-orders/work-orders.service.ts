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

    findAll(status?: string) {
        if (status && status !== 'all') return this.repo.findBy({ status });
        return this.repo.find();
    }

    async findOne(id: string) {
        const order = await this.repo.findOneBy({ id });
        if (!order) throw new NotFoundException(`WorkOrder ${id} not found`);
        return order;
    }

    create(data: Partial<WorkOrder>) {
        const order = this.repo.create(data);
        return this.repo.save(order);
    }

    async update(id: string, data: Partial<WorkOrder>) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async archive(id: string) {
        await this.repo.update(id, { status: 'archivada' });
        return { message: `WorkOrder ${id} archived` };
    }
}
