import { Controller, Get, Post, Param, Patch, Delete, Body } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('api/inventory')
export class InventoryController {
    constructor(private readonly svc: InventoryService) { }

    @Get()
    findAll() { return this.svc.findAll(); }

    @Post()
    create(@Body() body: any) { return this.svc.create(body); }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

    @Delete(':id')
    remove(@Param('id') id: string) { return this.svc.remove(id); }
}
