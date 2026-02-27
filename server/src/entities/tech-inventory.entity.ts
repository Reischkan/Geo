import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tech_inventory')
export class TechInventory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    technicianId: string;

    @Column()
    inventoryId: string;

    @Column('int', { default: 0 })
    qty: number;

    @Column({ default: 'tenant-mx' })
    tenantId: string;
}
