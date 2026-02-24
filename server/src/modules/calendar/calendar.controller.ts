import { Controller, Get, Query, Request } from '@nestjs/common';
import { CalendarService } from './calendar.service';

@Controller('api/calendar')
export class CalendarController {
    constructor(private readonly svc: CalendarService) { }

    @Get('events')
    getEvents(@Request() req: any, @Query('month') month?: string, @Query('year') year?: string) {
        return this.svc.getEvents(
            month ? parseInt(month) : 2,
            year ? parseInt(year) : 2026,
            req.user.tenantId,
        );
    }
}
