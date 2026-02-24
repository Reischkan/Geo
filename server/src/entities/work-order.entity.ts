import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('work_orders')
export class WorkOrder {
    @PrimaryColumn()
    id: string;

    @Column()
    title: string;

    @Column()
    client: string;

    @Column()
    clientAddress: string;

    @Column()
    technicianId: string;

    @Column({ default: 'pendiente' })
    status: string;

    @Column({ default: 'media' })
    priority: string;

    @Column()
    scheduledDate: string;

    @Column()
    estimatedDuration: string;

    @Column({ nullable: true })
    projectId: string;

    @Column({ default: '' })
    description: string;

    @Column({ default: 'tenant-mx' })
    tenantId: string;
}
