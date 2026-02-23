import { Controller, Get, Post, Param, Patch, Delete, Body } from '@nestjs/common';
import { TechniciansService } from './technicians.service';

@Controller('api/technicians')
export class TechniciansController {
    constructor(private readonly svc: TechniciansService) { }

    @Get()
    findAll() { return this.svc.findAll(); }

    @Get(':id')
    findOne(@Param('id') id: string) { return this.svc.findOne(id); }

    @Post()
    create(@Body() body: any) { return this.svc.create(body); }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

    @Delete(':id')
    remove(@Param('id') id: string) { return this.svc.deactivate(id); }
}
