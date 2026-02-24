import { Controller, Get, Post, Param, Patch, Delete, Body, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('api/inventory')
export class InventoryController {
    constructor(private readonly svc: InventoryService) { }

    @Get()
    findAll(@Request() req: any) { return this.svc.findAll(req.user.tenantId); }

    @Post()
    create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.tenantId); }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any, @Request() req: any) { return this.svc.update(id, body, req.user.tenantId); }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) { return this.svc.remove(id, req.user.tenantId); }
}
