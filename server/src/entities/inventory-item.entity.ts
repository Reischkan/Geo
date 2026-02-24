import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('inventory')
export class InventoryItem {
    @PrimaryColumn()
    id: string;

    @Column()
    sku: string;

    @Column()
    name: string;

    @Column()
    category: string;

    @Column('int', { default: 0 })
    vehicleQty: number;

    @Column('int', { default: 0 })
    warehouseQty: number;

    @Column('int', { default: 0 })
    minStock: number;

    @Column({ default: 'piezas' })
    unit: string;

    @Column({ default: 'Almacén Central' })
    location: string;

    @Column('float', { default: 0 })
    unitCost: number;

    @Column({ default: 'tenant-mx' })
    tenantId: string;
}
