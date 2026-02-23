import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('api/audit')
export class AuditController {
    constructor(private readonly svc: AuditService) { }

    @Get()
    findAll(@Query('limit') limit?: string) {
        return this.svc.findAll(limit ? parseInt(limit) : 100);
    }
}
