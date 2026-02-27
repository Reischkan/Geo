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

    // ── Tech Inventory Assignment ──

    @Get('assignments')
    getAssignments(@Request() req: any) { return this.svc.getAssignments(req.user.tenantId); }

    @Post('assign')
    assign(@Body() body: { technicianId: string; inventoryId: string; qty: number }, @Request() req: any) {
        return this.svc.assign(body.technicianId, body.inventoryId, body.qty, req.user.tenantId);
    }

    @Post('remove-assignment')
    removeAssignment(@Body() body: { technicianId: string; inventoryId: string }, @Request() req: any) {
        return this.svc.removeAssignment(body.technicianId, body.inventoryId, req.user.tenantId);
    }

    @Post('return')
    returnToWarehouse(@Body() body: { technicianId: string; inventoryId: string; qty: number }, @Request() req: any) {
        return this.svc.returnToWarehouse(body.technicianId, body.inventoryId, body.qty, req.user.tenantId);
    }

    @Get('my')
    getMyInventory(@Request() req: any) {
        return this.svc.getMyInventory(req.user.technicianId, req.user.tenantId);
    }
}
