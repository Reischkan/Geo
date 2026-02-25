import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder } from '../../entities/work-order.entity';
import { OrderComment } from '../../entities/order-comment.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { MaterialLog } from '../../entities/material-log.entity';
import { Technician } from '../../entities/technician.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class WorkOrdersService {
    constructor(
        @InjectRepository(WorkOrder) private readonly repo: Repository<WorkOrder>,
        @InjectRepository(OrderComment) private readonly commentRepo: Repository<OrderComment>,
        @InjectRepository(InventoryItem) private readonly inventoryRepo: Repository<InventoryItem>,
        @InjectRepository(MaterialLog) private readonly logRepo: Repository<MaterialLog>,
        @InjectRepository(Technician) private readonly techRepo: Repository<Technician>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
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

    // ── Self-assign ──
    async assignTechnician(orderId: string, technicianId: string, tenantId: string) {
        const order = await this.findOne(orderId, tenantId);
        order.technicianId = technicianId;
        return this.repo.save(order);
    }

    // ── Comments ──
    async getComments(orderId: string, tenantId: string) {
        return this.commentRepo.find({ where: { orderId, tenantId }, order: { createdAt: 'ASC' } });
    }

    async addComment(orderId: string, authorId: string, authorName: string, text: string, tenantId: string) {
        const comment = this.commentRepo.create({
            id: `CMT-${Date.now()}`,
            orderId,
            authorId,
            authorName,
            text,
            createdAt: new Date().toISOString(),
            tenantId,
        });
        return this.commentRepo.save(comment);
    }

    // ── Materials consumption ──
    async consumeMaterials(
        orderId: string,
        materials: { inventoryId: string; name: string; qty: number }[],
        technicianId: string,
        tenantId: string,
    ) {
        const order = await this.findOne(orderId, tenantId);

        // Resolve technician name
        let techName = technicianId;
        const tech = await this.techRepo.findOneBy({ id: technicianId });
        if (tech) {
            techName = tech.name;
        } else {
            // Fallback: look up User entity by userId or technicianId
            const user = await this.userRepo.findOneBy({ id: technicianId });
            if (user) techName = user.name;
            else {
                const userByTech = await this.userRepo.findOneBy({ technicianId });
                if (userByTech) techName = userByTech.name;
            }
        }

        // Merge with existing materials on the order
        const existing: any[] = JSON.parse(order.materials || '[]');
        const merged = [...existing];
        for (const mat of materials) {
            const idx = merged.findIndex(m => m.inventoryId === mat.inventoryId);
            if (idx >= 0) merged[idx].qty += mat.qty;
            else merged.push(mat);
        }
        order.materials = JSON.stringify(merged);
        await this.repo.save(order);

        // Deduct from inventory & create log entries
        for (const mat of materials) {
            const item = await this.inventoryRepo.findOneBy({ id: mat.inventoryId, tenantId });
            if (item) {
                item.vehicleQty = Math.max(0, item.vehicleQty - mat.qty);
                await this.inventoryRepo.save(item);
            }

            // Log each consumption event
            const log = this.logRepo.create({
                id: `ML-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                inventoryId: mat.inventoryId,
                inventoryName: mat.name,
                qty: mat.qty,
                orderId: order.id,
                orderTitle: order.title,
                technicianId,
                technicianName: techName,
                consumedAt: new Date().toISOString(),
                tenantId,
            });
            await this.logRepo.save(log);
        }

        return order;
    }

    // ── Material logs ──
    async getMaterialLogs(tenantId: string) {
        return this.logRepo.find({ where: { tenantId }, order: { consumedAt: 'DESC' } });
    }

    async getMaterialLogsByItem(inventoryId: string, tenantId: string) {
        return this.logRepo.find({ where: { inventoryId, tenantId }, order: { consumedAt: 'DESC' } });
    }
}
