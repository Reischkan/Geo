import { Controller, Get, Post, Param, Patch, Delete, Body, Query, Request } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';

@Controller('api/work-orders')
export class WorkOrdersController {
    constructor(private readonly svc: WorkOrdersService) { }

    @Get()
    findAll(@Request() req: any, @Query('status') status?: string) { return this.svc.findAll(req.user.tenantId, status); }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) { return this.svc.findOne(id, req.user.tenantId); }

    @Post()
    create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.tenantId); }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any, @Request() req: any) { return this.svc.update(id, body, req.user.tenantId); }

    @Delete(':id')
    archive(@Param('id') id: string, @Request() req: any) { return this.svc.archive(id, req.user.tenantId); }
}
