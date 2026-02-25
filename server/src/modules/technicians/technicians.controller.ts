import { Controller, Get, Post, Param, Patch, Delete, Body, Request } from '@nestjs/common';
import { TechniciansService } from './technicians.service';

@Controller('api/technicians')
export class TechniciansController {
    constructor(private readonly svc: TechniciansService) { }

    @Get()
    findAll(@Request() req: any) { return this.svc.findAll(req.user.tenantId); }

    @Get('stats')
    getStats(@Request() req: any) { return this.svc.getStats(req.user.tenantId); }

    // ── Self location update (must be before :id) ──
    @Patch('me/location')
    updateMyLocation(@Body() body: { lat: number; lng: number }, @Request() req: any) {
        const techId = req.user.technicianId;
        if (!techId) return { message: 'No technician linked' };
        return this.svc.update(techId, { lat: body.lat, lng: body.lng }, req.user.tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) { return this.svc.findOne(id, req.user.tenantId); }

    @Post()
    create(@Body() body: any, @Request() req: any) { return this.svc.create(body, req.user.tenantId); }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any, @Request() req: any) { return this.svc.update(id, body, req.user.tenantId); }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) { return this.svc.deactivate(id, req.user.tenantId); }
}
