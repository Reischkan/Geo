import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { TechInventory } from '../../entities/tech-inventory.entity';
import { Technician } from '../../entities/technician.entity';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(InventoryItem) private readonly repo: Repository<InventoryItem>,
        @InjectRepository(TechInventory) private readonly techInvRepo: Repository<TechInventory>,
        @InjectRepository(Technician) private readonly techRepo: Repository<Technician>,
        private readonly dataSource: DataSource,
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

    /**
     * BUG-01 FIX: Assign qty of an item to a technician.
     * ACCUMULATES if already assigned AND deducts from warehouse stock.
     * Returns error if warehouse stock is insufficient.
     */
    async assign(technicianId: string, inventoryId: string, qty: number, tenantId: string) {
        if (qty <= 0) throw new BadRequestException('Cantidad debe ser mayor a 0');

        return this.dataSource.transaction(async (manager) => {
            const item = await manager.findOneBy(InventoryItem, { id: inventoryId, tenantId });
            if (!item) throw new NotFoundException(`Producto ${inventoryId} no encontrado`);

            // Check sufficient warehouse stock before assigning
            if (item.warehouseQty < qty) {
                throw new BadRequestException(
                    `Stock insuficiente en almacén: disponible ${item.warehouseQty}, solicitado ${qty}`
                );
            }

            // Deduct from warehouse stock (BUG-01 fix)
            item.warehouseQty -= qty;
            await manager.save(InventoryItem, item);

            // Create or accumulate tech assignment
            let record = await manager.findOneBy(TechInventory, { technicianId, inventoryId, tenantId });
            if (record) {
                record.qty += qty;
            } else {
                record = manager.create(TechInventory, { technicianId, inventoryId, qty, tenantId });
            }
            return manager.save(TechInventory, record);
        });
    }

    /** Remove assignment entirely — returns stock back to warehouse */
    async removeAssignment(technicianId: string, inventoryId: string, tenantId: string) {
        return this.dataSource.transaction(async (manager) => {
            const record = await manager.findOneBy(TechInventory, { technicianId, inventoryId, tenantId });
            if (!record) return { message: 'Assignment not found' };

            // Return remaining qty to warehouse
            if (record.qty > 0) {
                const item = await manager.findOneBy(InventoryItem, { id: inventoryId, tenantId });
                if (item) {
                    item.warehouseQty += record.qty;
                    await manager.save(InventoryItem, item);
                }
            }

            await manager.remove(TechInventory, record);
            return { message: 'Asignación eliminada y stock restaurado al almacén' };
        });
    }

    /**
     * BUG-02 FIX: Return material from technician back to warehouse.
     * Wrapped in a transaction to prevent race conditions.
     */
    async returnToWarehouse(technicianId: string, inventoryId: string, qty: number, tenantId: string) {
        if (qty <= 0) throw new BadRequestException('Cantidad debe ser mayor a 0');

        return this.dataSource.transaction(async (manager) => {
            const record = await manager.findOneBy(TechInventory, { technicianId, inventoryId, tenantId });
            if (!record) throw new NotFoundException('Asignación no encontrada');

            // Cap return qty to what the technician actually has
            const actualReturn = Math.min(qty, record.qty);
            record.qty -= actualReturn;

            // Return to warehouse stock atomically
            const item = await manager.findOneBy(InventoryItem, { id: inventoryId, tenantId });
            if (item) {
                item.warehouseQty += actualReturn;
                await manager.save(InventoryItem, item);
            }

            if (record.qty <= 0) {
                await manager.remove(TechInventory, record);
            } else {
                await manager.save(TechInventory, record);
            }

            return {
                message: `${actualReturn} ${item?.unit || 'unidades'} devueltos al almacén`,
                returned: actualReturn,
            };
        });
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
