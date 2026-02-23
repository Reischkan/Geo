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

    findAll() { return this.repo.find(); }

    async findOne(id: string) {
        const client = await this.repo.findOneBy({ id });
        if (!client) throw new NotFoundException(`Client ${id} not found`);
        return client;
    }

    create(data: Partial<Client>) {
        const client = this.repo.create(data);
        return this.repo.save(client);
    }

    async update(id: string, data: Partial<Client>) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async deactivate(id: string) {
        await this.repo.update(id, { active: false });
        return { message: `Client ${id} deactivated` };
    }
}
