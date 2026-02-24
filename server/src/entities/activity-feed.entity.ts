import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('activity_feed')
export class ActivityFeedItem {
    @PrimaryColumn('int')
    id: number;

    @Column()
    type: string;

    @Column()
    message: string;

    @Column()
    time: string;

    @Column()
    icon: string;

    @Column({ default: 'tenant-mx' })
    tenantId: string;
}
