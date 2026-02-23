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

    findAll() { return this.repo.find(); }

    async findOne(id: string) {
        const project = await this.repo.findOneBy({ id });
        if (!project) throw new NotFoundException(`Project ${id} not found`);
        return project;
    }

    create(data: Partial<Project>) {
        const project = this.repo.create(data);
        return this.repo.save(project);
    }

    async update(id: string, data: Partial<Project>) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async archive(id: string) {
        await this.repo.update(id, { status: 'archivado' });
        return { message: `Project ${id} archived` };
    }
}
