import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarEvent } from '../../entities/calendar-event.entity';

@Injectable()
export class CalendarService {
    constructor(
        @InjectRepository(CalendarEvent)
        private readonly repo: Repository<CalendarEvent>,
    ) { }

    async getEvents(month: number, year: number, tenantId: string) {
        const events = await this.repo.findBy({ month, year, tenantId });

        // Group by day → Record<number, {title, tech, color}[]>
        const grouped: Record<number, { title: string; tech: string; color: string }[]> = {};
        for (const ev of events) {
            if (!grouped[ev.day]) grouped[ev.day] = [];
            grouped[ev.day].push({ title: ev.title, tech: ev.tech, color: ev.color });
        }
        return grouped;
    }
}
