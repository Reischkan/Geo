import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('calendar_events')
export class CalendarEvent {
    @PrimaryColumn('int', { generated: true })
    id: number;

    @Column('int')
    day: number;

    @Column('int')
    month: number;

    @Column('int')
    year: number;

    @Column()
    title: string;

    @Column()
    tech: string;

    @Column()
    color: string;

    @Column({ default: 'tenant-mx' })
    tenantId: string;
}
