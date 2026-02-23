import { Controller, Get, Post, Param, Patch, Delete, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('api/projects')
export class ProjectsController {
    constructor(private readonly svc: ProjectsService) { }

    @Get()
    findAll() { return this.svc.findAll(); }

    @Get(':id')
    findOne(@Param('id') id: string) { return this.svc.findOne(id); }

    @Post()
    create(@Body() body: any) { return this.svc.create(body); }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

    @Delete(':id')
    archive(@Param('id') id: string) { return this.svc.archive(id); }
}
