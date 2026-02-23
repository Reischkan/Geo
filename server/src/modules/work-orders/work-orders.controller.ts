import { Controller, Get, Post, Param, Patch, Delete, Body, Query } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';

@Controller('api/work-orders')
export class WorkOrdersController {
    constructor(private readonly svc: WorkOrdersService) { }

    @Get()
    findAll(@Query('status') status?: string) { return this.svc.findAll(status); }

    @Get(':id')
    findOne(@Param('id') id: string) { return this.svc.findOne(id); }

    @Post()
    create(@Body() body: any) { return this.svc.create(body); }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

    @Delete(':id')
    archive(@Param('id') id: string) { return this.svc.archive(id); }
}
