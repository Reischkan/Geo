import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarEvent } from '../../entities/calendar-event.entity';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
    imports: [TypeOrmModule.forFeature([CalendarEvent])],
    controllers: [CalendarController],
    providers: [CalendarService],
})
export class CalendarModule { }
