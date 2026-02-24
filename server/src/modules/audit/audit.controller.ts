import { Controller, Get, Query, Request } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('api/audit')
export class AuditController {
    constructor(private readonly svc: AuditService) { }

    @Get()
    findAll(@Request() req: any, @Query('limit') limit?: string) {
        return this.svc.findAll(req.user.tenantId, limit ? parseInt(limit) : 100);
    }
}
