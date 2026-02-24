import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../../entities/inventory-item.entity';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(InventoryItem)
        private readonly repo: Repository<InventoryItem>,
    ) { }

    findAll(tenantId: string) { return this.repo.find({ where: { tenantId } }); }

    create(data: Partial<InventoryItem>, tenantId: string) {
        const item = this.repo.create({ ...data, tenantId });
        return this.repo.save(item);
    }

    async update(id: string, data: Partial<InventoryItem>, tenantId: string) {
        const item = await this.repo.findOneBy({ id, tenantId });
        if (!item) throw new NotFoundException(`Item ${id} not found`);
        await this.repo.update({ id, tenantId }, data);
        return this.repo.findOneBy({ id });
    }

    async remove(id: string, tenantId: string) {
        const item = await this.repo.findOneBy({ id, tenantId });
        if (!item) throw new NotFoundException(`Item ${id} not found`);
        await this.repo.delete(id);
        return { message: `Item ${id} deleted` };
    }
}
