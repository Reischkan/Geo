import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technician } from '../../entities/technician.entity';

@Injectable()
export class TechniciansService {
    constructor(
        @InjectRepository(Technician)
        private readonly repo: Repository<Technician>,
    ) { }

    findAll(tenantId: string) { return this.repo.find({ where: { tenantId } }); }

    async findOne(id: string, tenantId: string) {
        const tech = await this.repo.findOneBy({ id, tenantId });
        if (!tech) throw new NotFoundException(`Technician ${id} not found`);
        return tech;
    }

    create(data: Partial<Technician>, tenantId: string) {
        const tech = this.repo.create({ ...data, tenantId });
        return this.repo.save(tech);
    }

    async update(id: string, data: Partial<Technician>, tenantId: string) {
        await this.repo.update({ id, tenantId }, data);
        return this.findOne(id, tenantId);
    }

    async deactivate(id: string, tenantId: string) {
        await this.repo.update({ id, tenantId }, { status: 'desconectado' });
        return { message: `Technician ${id} deactivated` };
    }
}
