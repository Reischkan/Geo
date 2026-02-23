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

    findAll() { return this.repo.find(); }

    async findOne(id: string) {
        const tech = await this.repo.findOneBy({ id });
        if (!tech) throw new NotFoundException(`Technician ${id} not found`);
        return tech;
    }

    create(data: Partial<Technician>) {
        const tech = this.repo.create(data);
        return this.repo.save(tech);
    }

    async update(id: string, data: Partial<Technician>) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async deactivate(id: string) {
        await this.repo.update(id, { status: 'desconectado' });
        return { message: `Technician ${id} deactivated` };
    }
}
