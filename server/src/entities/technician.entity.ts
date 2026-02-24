import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('technicians')
export class Technician {
    @PrimaryColumn()
    id: string;

    @Column()
    name: string;

    @Column()
    avatar: string;

    @Column()
    role: string;

    @Column({ default: 'disponible' })
    status: string;

    @Column()
    phone: string;

    @Column('float')
    lat: number;

    @Column('float')
    lng: number;

    @Column({ default: 0 })
    completedOrders: number;

    @Column('float', { default: 0 })
    rating: number;

    @Column({ default: 0 })
    hoursLogged: number;

    @Column({ default: 'tenant-mx' })
    tenantId: string;
}
