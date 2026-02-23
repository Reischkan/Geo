import { Controller, Get, Post, Param, Patch, Delete, Body } from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('api/clients')
export class ClientsController {
    constructor(private readonly svc: ClientsService) { }

    @Get()
    findAll() { return this.svc.findAll(); }

    @Get(':id')
    findOne(@Param('id') id: string) { return this.svc.findOne(id); }

    @Post()
    create(@Body() body: any) { return this.svc.create(body); }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

    @Delete(':id')
    deactivate(@Param('id') id: string) { return this.svc.deactivate(id); }
}
