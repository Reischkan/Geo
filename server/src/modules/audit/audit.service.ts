import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly repo: Repository<AuditLog>,
    ) { }

    findAll(limit = 100) {
        return this.repo.find({ order: { id: 'DESC' }, take: limit });
    }

    log(action: string, resource: string, details: string, user = 'Admin') {
        const entry = this.repo.create({ action, resource, details, user });
        return this.repo.save(entry);
    }
}
