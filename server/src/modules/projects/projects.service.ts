import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private readonly repo: Repository<Project>,
    ) { }

    findAll(tenantId: string) { return this.repo.find({ where: { tenantId } }); }

    async findOne(id: string, tenantId: string) {
        const project = await this.repo.findOneBy({ id, tenantId });
        if (!project) throw new NotFoundException(`Project ${id} not found`);
        return project;
    }

    create(data: Partial<Project>, tenantId: string) {
        const project = this.repo.create({ ...data, tenantId });
        return this.repo.save(project);
    }

    async update(id: string, data: Partial<Project>, tenantId: string) {
        await this.repo.update({ id, tenantId }, data);
        return this.findOne(id, tenantId);
    }

    async archive(id: string, tenantId: string) {
        await this.repo.update({ id, tenantId }, { status: 'archivado' });
        return { message: `Project ${id} archived` };
    }
}
