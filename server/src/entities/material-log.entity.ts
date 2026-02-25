import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('material_logs')
export class MaterialLog {
    @PrimaryColumn()
    id: string;

    @Column()
    inventoryId: string;

    @Column()
    inventoryName: string;

    @Column('int')
    qty: number;

    @Column()
    orderId: string;

    @Column()
    orderTitle: string;

    @Column()
    technicianId: string;

    @Column()
    technicianName: string;

    @Column()
    consumedAt: string;

    @Column({ default: 'tenant-mx' })
    tenantId: string;
}
