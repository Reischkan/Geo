import { Controller, Get, Post, Param, Patch, Delete, Body, Query, Request } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';

@Controller('api/work-orders')
export class WorkOrdersController {
    constructor(private readonly svc: WorkOrdersService) { }

    @Get()
    findAll(@Request() req: any, @Query('status') status?: string, @Query('archived') archived?: string) {
        return this.svc.findAll(req.user.tenantId, status, archived === 'true' ? true : archived === 'false' ? false : undefined);
    }

    @Get('material-logs')
    getMaterialLogs(@Request() req: any) { return this.svc.getMaterialLogs(req.user.tenantId); }

    @Get('material-logs/:inventoryId')
    getMaterialLogsByItem(@Param('inventoryId') inventoryId: string, @Request() req: any) {
        return this.svc.getMaterialLogsByItem(inventoryId, req.user.tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) { return this.svc.findOne(id, req.user.tenantId); }

    @Post()
    create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.tenantId); }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any, @Request() req: any) { return this.svc.update(id, body, req.user.tenantId); }

    @Delete(':id')
    archive(@Param('id') id: string, @Request() req: any) { return this.svc.archive(id, req.user.tenantId); }

    @Patch(':id/unarchive')
    unarchive(@Param('id') id: string, @Request() req: any) { return this.svc.unarchive(id, req.user.tenantId); }

    // ── Self-assign ──
    @Patch(':id/assign')
    assign(@Param('id') id: string, @Body() body: { technicianId: string }, @Request() req: any) {
        return this.svc.assignTechnician(id, body.technicianId, req.user.tenantId);
    }

    // ── Comments ──
    @Get(':id/comments')
    getComments(@Param('id') id: string, @Request() req: any) {
        return this.svc.getComments(id, req.user.tenantId);
    }

    @Post(':id/comments')
    addComment(@Param('id') id: string, @Body() body: { text: string }, @Request() req: any) {
        return this.svc.addComment(id, req.user.userId, req.user.email, body.text, req.user.tenantId);
    }

    // ── Materials consumption ──
    @Patch(':id/materials')
    consumeMaterials(@Param('id') id: string, @Body() body: { materials: any[] }, @Request() req: any) {
        return this.svc.consumeMaterials(id, body.materials, req.user.technicianId || req.user.userId, req.user.tenantId);
    }
}
