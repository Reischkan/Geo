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

    findAll() { return this.repo.find(); }

    create(data: Partial<InventoryItem>) {
        const item = this.repo.create(data);
        return this.repo.save(item);
    }

    async update(id: string, data: Partial<InventoryItem>) {
        const item = await this.repo.findOneBy({ id });
        if (!item) throw new NotFoundException(`Item ${id} not found`);
        await this.repo.update(id, data);
        return this.repo.findOneBy({ id });
    }

    async remove(id: string) {
        const item = await this.repo.findOneBy({ id });
        if (!item) throw new NotFoundException(`Item ${id} not found`);
        await this.repo.delete(id);
        return { message: `Item ${id} deleted` };
    }
}
