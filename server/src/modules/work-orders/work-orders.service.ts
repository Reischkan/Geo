import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, ILike, LessThanOrEqual, MoreThanOrEqual, FindOptionsWhere } from 'typeorm';
import { WorkOrder } from '../../entities/work-order.entity';
import { OrderComment } from '../../entities/order-comment.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { MaterialLog } from '../../entities/material-log.entity';
import { Technician } from '../../entities/technician.entity';
import { User } from '../../entities/user.entity';
import { TechInventory } from '../../entities/tech-inventory.entity';

@Injectable()
export class WorkOrdersService {
    constructor(
        @InjectRepository(WorkOrder) private readonly repo: Repository<WorkOrder>,
        @InjectRepository(OrderComment) private readonly commentRepo: Repository<OrderComment>,
        @InjectRepository(InventoryItem) private readonly inventoryRepo: Repository<InventoryItem>,
        @InjectRepository(MaterialLog) private readonly logRepo: Repository<MaterialLog>,
        @InjectRepository(Technician) private readonly techRepo: Repository<Technician>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(TechInventory) private readonly techInvRepo: Repository<TechInventory>,
        private readonly dataSource: DataSource,
    ) { }

    async findAll(
        tenantId: string,
        opts?: { status?: string; archived?: boolean; page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string },
    ) {
        const { status, archived, page, limit, search, dateFrom, dateTo } = opts || {};
        const where: FindOptionsWhere<WorkOrder> = { tenantId, archived: archived ?? false };
        if (status && status !== 'all') where.status = status;

        // Build a query builder for complex search + date filtering
        const qb = this.repo.createQueryBuilder('wo')
            .where('wo.tenantId = :tenantId', { tenantId })
            .andWhere('wo.archived = :archived', { archived: archived ?? false });

        if (status && status !== 'all') {
            qb.andWhere('wo.status = :status', { status });
        }

        if (search) {
            qb.andWhere(
                '(LOWER(wo.id) LIKE :search OR LOWER(wo.title) LIKE :search OR LOWER(wo.client) LIKE :search)',
                { search: `%${search.toLowerCase()}%` },
            );
        }

        if (dateFrom) {
            qb.andWhere('wo.scheduledDate >= :dateFrom', { dateFrom });
        }
        if (dateTo) {
            qb.andWhere('wo.scheduledDate <= :dateTo', { dateTo });
        }

        qb.orderBy('wo.scheduledDate', 'DESC');

        // If pagination params provided, return paginated response
        if (page && limit) {
            const safePage = Math.max(1, page);
            const safeLimit = Math.min(100, Math.max(1, limit));
            qb.skip((safePage - 1) * safeLimit).take(safeLimit);

            const [data, total] = await qb.getManyAndCount();
            return {
                data,
                meta: { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
            };
        }

        // No pagination — return plain array (backward compat for tech views)
        return qb.getMany();
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
        const order = await this.findOne(id, tenantId);

        // Auto-sync linked technician status when order status changes
        if (data.status && order.technicianId) {
            const statusMap: Record<string, string> = {
                'en-ruta': 'en-ruta',
                'en-servicio': 'en-servicio',
                'completada': 'disponible',
            };
            const newTechStatus = statusMap[data.status];
            if (newTechStatus) {
                await this.techRepo.update(
                    { id: order.technicianId, tenantId },
                    { status: newTechStatus },
                );
            }
        }

        return order;
    }

    async archive(id: string, tenantId: string) {
        await this.repo.update({ id, tenantId }, { archived: true });
        return { message: `WorkOrder ${id} archived` };
    }

    async unarchive(id: string, tenantId: string) {
        await this.repo.update({ id, tenantId }, { archived: false });
        return { message: `WorkOrder ${id} unarchived` };
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

    /**
     * BUG-03 + BUG-04 FIX: consumeMaterials
     * - BUG-03: now checks vehicle qty sufficiency — throws BadRequestException with details if insufficient
     * - BUG-04: entire operation wrapped in a single DataSource transaction — no partial writes on failure
     */
    async consumeMaterials(
        orderId: string,
        materials: { inventoryId: string; name: string; qty: number }[],
        technicianId: string,
        tenantId: string,
    ) {
        // Validate input
        if (!materials || materials.length === 0) {
            throw new BadRequestException('Se requiere al menos un material');
        }

        return this.dataSource.transaction(async (manager) => {
            const order = await manager.findOneBy(WorkOrder, { id: orderId, tenantId });
            if (!order) throw new NotFoundException(`WorkOrder ${orderId} not found`);

            // Resolve technician name (outside of inventory loop for efficiency)
            let techName = technicianId;
            const tech = await manager.findOneBy(Technician, { id: technicianId });
            if (tech) {
                techName = tech.name;
            } else {
                const user = await manager.findOneBy(User, { id: technicianId });
                if (user) {
                    techName = user.name;
                } else {
                    const userByTech = await this.userRepo.findOneBy({ technicianId });
                    if (userByTech) techName = userByTech.name;
                }
            }

            // BUG-03 + BUG-01 FIX: Pre-validate ALL materials against technician's personal inventory
            const insufficientItems: string[] = [];
            const missingAssignments: string[] = [];
            for (const mat of materials) {
                if (!mat.inventoryId || mat.qty <= 0) {
                    throw new BadRequestException(`Material inválido: inventoryId=${mat.inventoryId}, qty=${mat.qty}`);
                }

                // Validate against technician's personal assignment (TechInventory), not just global pool
                const techAssign = await manager.findOneBy(TechInventory, {
                    technicianId, inventoryId: mat.inventoryId, tenantId,
                });
                if (!techAssign) {
                    missingAssignments.push(
                        `${mat.name || mat.inventoryId}: no está asignado al técnico`
                    );
                } else if (techAssign.qty < mat.qty) {
                    insufficientItems.push(
                        `${mat.name || mat.inventoryId}: solicitado ${mat.qty}, asignado ${techAssign.qty}`
                    );
                }

                // Also validate global vehicleQty as a safety net
                const item = await manager.findOneBy(InventoryItem, { id: mat.inventoryId, tenantId });
                if (item && item.vehicleQty < mat.qty) {
                    insufficientItems.push(
                        `${mat.name || mat.inventoryId}: solicitado ${mat.qty}, disponible en vehículo ${item.vehicleQty}`
                    );
                }
            }
            if (missingAssignments.length > 0) {
                throw new BadRequestException(
                    `Materiales no asignados al técnico: ${missingAssignments.join('; ')}`
                );
            }
            if (insufficientItems.length > 0) {
                throw new BadRequestException(
                    `Stock insuficiente: ${insufficientItems.join('; ')}`
                );
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
            await manager.save(WorkOrder, order);

            // Deduct from inventory & create log entries (BUG-04: all within same transaction)
            const now = new Date().toISOString();
            for (const mat of materials) {
                const item = await manager.findOneBy(InventoryItem, { id: mat.inventoryId, tenantId });
                if (item) {
                    // Safe: we pre-validated sufficiency above
                    item.vehicleQty = Math.max(0, item.vehicleQty - mat.qty);
                    await manager.save(InventoryItem, item);
                }

                // Log each consumption event
                const logId = `ML-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                const log = manager.create(MaterialLog, {
                    id: logId,
                    inventoryId: mat.inventoryId,
                    inventoryName: mat.name,
                    qty: mat.qty,
                    orderId: order.id,
                    orderTitle: order.title,
                    technicianId,
                    technicianName: techName,
                    consumedAt: now,
                    tenantId,
                });
                await manager.save(MaterialLog, log);

                // Deduct from technician's personal assignment
                const techAssign = await manager.findOneBy(TechInventory, { technicianId, inventoryId: mat.inventoryId, tenantId });
                if (techAssign) {
                    techAssign.qty = Math.max(0, techAssign.qty - mat.qty);
                    await manager.save(TechInventory, techAssign);
                }
            }

            return order;
        });
    }

    // ── Material logs ──
    async getMaterialLogs(tenantId: string) {
        return this.logRepo.find({ where: { tenantId }, order: { consumedAt: 'DESC' } });
    }

    async getMaterialLogsByItem(inventoryId: string, tenantId: string) {
        return this.logRepo.find({ where: { inventoryId, tenantId }, order: { consumedAt: 'DESC' } });
    }
}
