import { Controller, Get, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
    constructor(private readonly svc: DashboardService) { }

    @Get('kpis')
    getKpis(@Request() req: any) { return this.svc.getKpis(req.user.tenantId); }

    @Get('activity')
    getActivity(@Request() req: any) { return this.svc.getActivity(req.user.tenantId); }

    @Get('revenue-chart')
    getRevenueChart(@Request() req: any) { return this.svc.getRevenueChart(req.user.tenantId); }

    @Get('status-breakdown')
    getStatusBreakdown(@Request() req: any) { return this.svc.getStatusBreakdown(req.user.tenantId); }

    @Get('alerts')
    getAlerts(@Request() req: any) { return this.svc.getAlerts(req.user.tenantId); }
}
