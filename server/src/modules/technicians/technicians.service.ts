import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Technician } from '../../entities/technician.entity';
import { User } from '../../entities/user.entity';
import { WorkOrder } from '../../entities/work-order.entity';

@Injectable()
export class TechniciansService {
    constructor(
        @InjectRepository(Technician) private readonly repo: Repository<Technician>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(WorkOrder) private readonly orderRepo: Repository<WorkOrder>,
    ) { }

    findAll(tenantId: string) { return this.repo.find({ where: { tenantId } }); }

    async findOne(id: string, tenantId: string) {
        const tech = await this.repo.findOneBy({ id, tenantId });
        if (!tech) throw new NotFoundException(`Technician ${id} not found`);
        return tech;
    }

    async create(data: Partial<Technician> & { email?: string; password?: string }, tenantId: string) {
        const tech = this.repo.create({ ...data, tenantId });
        delete (tech as any).email;
        delete (tech as any).password;
        const saved = await this.repo.save(tech);

        // If credentials provided, create a User account
        if (data.email && data.password) {
            const exists = await this.userRepo.findOneBy({ email: data.email });
            if (exists) throw new ConflictException(`El email ${data.email} ya está en uso`);
            const user = this.userRepo.create({
                id: `U-${Date.now()}`,
                email: data.email,
                passwordHash: await bcrypt.hash(data.password, 10),
                name: data.name || saved.name,
                role: 'tecnico',
                technicianId: saved.id,
                tenantId,
                active: true,
            });
            await this.userRepo.save(user);
        }

        return saved;
    }

    async update(id: string, data: Partial<Technician> & { email?: string; password?: string }, tenantId: string) {
        // Update the technician entity (strip credential fields)
        const updateData = { ...data };
        const email = updateData.email;
        const password = updateData.password;
        delete (updateData as any).email;
        delete (updateData as any).password;

        await this.repo.update({ id, tenantId }, updateData);

        // Update or create linked User credentials
        if (email || password) {
            let user = await this.userRepo.findOneBy({ technicianId: id });
            if (user) {
                if (email) user.email = email;
                if (password) user.passwordHash = await bcrypt.hash(password, 10);
                if (data.name) user.name = data.name;
                await this.userRepo.save(user);
            } else if (email && password) {
                const exists = await this.userRepo.findOneBy({ email });
                if (exists) throw new ConflictException(`El email ${email} ya está en uso`);
                const newUser = this.userRepo.create({
                    id: `U-${Date.now()}`,
                    email,
                    passwordHash: await bcrypt.hash(password, 10),
                    name: data.name || id,
                    role: 'tecnico',
                    technicianId: id,
                    tenantId,
                    active: true,
                });
                await this.userRepo.save(newUser);
            }
        }

        return this.findOne(id, tenantId);
    }

    async deactivate(id: string, tenantId: string) {
        await this.repo.update({ id, tenantId }, { status: 'desconectado' });
        // Also deactivate the linked User
        const user = await this.userRepo.findOneBy({ technicianId: id });
        if (user) {
            user.active = false;
            await this.userRepo.save(user);
        }
        return { message: `Technician ${id} deactivated` };
    }

    // ── Real stats from work orders ──
    async getStats(tenantId: string) {
        const techs = await this.repo.find({ where: { tenantId } });
        const orders = await this.orderRepo.find({ where: { tenantId } });
        const users = await this.userRepo.find({ where: { tenantId, role: 'tecnico' } });

        const result = techs.map(tech => {
            const techOrders = orders.filter(o => o.technicianId === tech.id);
            const completed = techOrders.filter(o => o.status === 'completada').length;
            const total = techOrders.length;
            const rating = total > 0 ? Math.min(5, Math.round((completed / Math.max(total, 1)) * 5 * 10) / 10) : 0;

            // Estimate hours: each completed order ~ 2h, in-progress ~ 1h
            const hours = techOrders.reduce((s, o) => {
                if (o.status === 'completada') return s + 2;
                if (o.status === 'en-servicio' || o.status === 'en-progreso') return s + 1;
                return s;
            }, 0);

            // Linked user email
            const linkedUser = users.find(u => u.technicianId === tech.id);

            return {
                technicianId: tech.id,
                completedOrders: completed,
                totalOrders: total,
                rating,
                hoursLogged: hours,
                email: linkedUser?.email || null,
                hasCredentials: !!linkedUser,
            };
        });

        return result;
    }
}
