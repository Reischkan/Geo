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

    @Column({ nullable: true, default: '' })
    endDate: string;

    @Column()
    estimatedDuration: string;

    @Column({ nullable: true })
    projectId: string;

    @Column({ default: '' })
    description: string;

    @Column({ default: '[]' })
    materials: string; // JSON: [{inventoryId, name, qty}]

    @Column('float', { default: 19.43 })
    lat: number;

    @Column('float', { default: -99.13 })
    lng: number;

    @Column({ default: false })
    archived: boolean;

    @Column({ default: 'tenant-mx' })
    tenantId: string;
}
