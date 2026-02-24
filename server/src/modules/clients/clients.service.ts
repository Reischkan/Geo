import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../entities/client.entity';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(Client)
        private readonly repo: Repository<Client>,
    ) { }

    findAll(tenantId: string) { return this.repo.find({ where: { tenantId } }); }

    async findOne(id: string, tenantId: string) {
        const client = await this.repo.findOneBy({ id, tenantId });
        if (!client) throw new NotFoundException(`Client ${id} not found`);
        return client;
    }

    create(data: Partial<Client>, tenantId: string) {
        const client = this.repo.create({ ...data, tenantId });
        return this.repo.save(client);
    }

    async update(id: string, data: Partial<Client>, tenantId: string) {
        await this.repo.update({ id, tenantId }, data);
        return this.findOne(id, tenantId);
    }

    async deactivate(id: string, tenantId: string) {
        await this.repo.update({ id, tenantId }, { active: false });
        return { message: `Client ${id} deactivated` };
    }
}
