import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { TechInventory } from '../../entities/tech-inventory.entity';
import { Technician } from '../../entities/technician.entity';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(InventoryItem) private readonly repo: Repository<InventoryItem>,
        @InjectRepository(TechInventory) private readonly techInvRepo: Repository<TechInventory>,
        @InjectRepository(Technician) private readonly techRepo: Repository<Technician>,
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

    // ── Tech Inventory Assignment ──

    /** Get all assignments for a tenant (admin view) — excludes zero-qty */
    async getAssignments(tenantId: string) {
        const assignments = await this.techInvRepo.find({ where: { tenantId } });
        const techs = await this.techRepo.find({ where: { tenantId } });
        const items = await this.repo.find({ where: { tenantId } });

        return assignments
            .filter(a => a.qty > 0)
            .map(a => ({
                ...a,
                technicianName: techs.find(t => t.id === a.technicianId)?.name || a.technicianId,
                inventoryName: items.find(i => i.id === a.inventoryId)?.name || a.inventoryId,
                inventorySku: items.find(i => i.id === a.inventoryId)?.sku || '',
                unit: items.find(i => i.id === a.inventoryId)?.unit || '',
            }));
    }

    /** Assign qty of an item to a technician — ACCUMULATES if already assigned */
    async assign(technicianId: string, inventoryId: string, qty: number, tenantId: string) {
        if (qty <= 0) return { message: 'Cantidad debe ser mayor a 0' };

        let record = await this.techInvRepo.findOneBy({ technicianId, inventoryId, tenantId });
        if (record) {
            record.qty += qty;  // accumulate on top of existing
            return this.techInvRepo.save(record);
        }
        record = this.techInvRepo.create({ technicianId, inventoryId, qty, tenantId });
        return this.techInvRepo.save(record);
    }

    /** Remove assignment entirely */
    async removeAssignment(technicianId: string, inventoryId: string, tenantId: string) {
        const record = await this.techInvRepo.findOneBy({ technicianId, inventoryId, tenantId });
        if (!record) return { message: 'Assignment not found' };
        await this.techInvRepo.remove(record);
        return { message: 'Assignment removed' };
    }

    /** Return material from technician back to warehouse */
    async returnToWarehouse(technicianId: string, inventoryId: string, qty: number, tenantId: string) {
        if (qty <= 0) return { message: 'Cantidad debe ser mayor a 0' };

        const record = await this.techInvRepo.findOneBy({ technicianId, inventoryId, tenantId });
        if (!record) throw new NotFoundException('Assignment not found');

        const actualReturn = Math.min(qty, record.qty);
        record.qty -= actualReturn;

        // Return to warehouse stock
        const item = await this.repo.findOneBy({ id: inventoryId, tenantId });
        if (item) {
            item.warehouseQty += actualReturn;
            await this.repo.save(item);
        }

        if (record.qty <= 0) {
            await this.techInvRepo.remove(record);
        } else {
            await this.techInvRepo.save(record);
        }

        return { message: `${actualReturn} ${item?.unit || 'unidades'} devueltos al almacén`, returned: actualReturn };
    }

    /** Get inventory assigned to a specific technician (tech view) */
    async getMyInventory(technicianId: string, tenantId: string) {
        const assignments = await this.techInvRepo.find({ where: { technicianId, tenantId } });
        const items = await this.repo.find({ where: { tenantId } });

        return assignments
            .filter(a => a.qty > 0)
            .map(a => {
                const item = items.find(i => i.id === a.inventoryId);
                return {
                    assignmentId: a.id,
                    inventoryId: a.inventoryId,
                    qty: a.qty,
                    name: item?.name || a.inventoryId,
                    sku: item?.sku || '',
                    category: item?.category || '',
                    unit: item?.unit || '',
                    unitCost: item?.unitCost || 0,
                };
            });
    }
}
