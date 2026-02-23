import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
    constructor(private readonly svc: DashboardService) { }

    @Get('kpis')
    getKpis() { return this.svc.getKpis(); }

    @Get('activity')
    getActivity() { return this.svc.getActivity(); }

    @Get('revenue-chart')
    getRevenueChart() { return this.svc.getRevenueChart(); }

    @Get('status-breakdown')
    getStatusBreakdown() { return this.svc.getStatusBreakdown(); }

    @Get('alerts')
    getAlerts() { return this.svc.getAlerts(); }
}
