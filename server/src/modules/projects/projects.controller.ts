import { Controller, Get, Post, Param, Patch, Delete, Body, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('api/projects')
export class ProjectsController {
    constructor(private readonly svc: ProjectsService) { }

    @Get()
    findAll(@Request() req: any) { return this.svc.findAll(req.user.tenantId); }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) { return this.svc.findOne(id, req.user.tenantId); }

    @Post()
    create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.tenantId); }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any, @Request() req: any) { return this.svc.update(id, body, req.user.tenantId); }

    @Delete(':id')
    archive(@Param('id') id: string, @Request() req: any) { return this.svc.archive(id, req.user.tenantId); }
}
