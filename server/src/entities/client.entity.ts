import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('clients')
export class Client {
    @PrimaryColumn()
    id: string;

    @Column()
    name: string;

    @Column({ default: '' })
    contactName: string;

    @Column({ default: '' })
    phone: string;

    @Column({ default: '' })
    email: string;

    @Column({ default: '' })
    address: string;

    @Column('float', { default: 19.43 })
    lat: number;

    @Column('float', { default: -99.13 })
    lng: number;

    @Column({ default: '' })
    notes: string;

    @Column({ default: true })
    active: boolean;

    @Column({ default: 'tenant-mx' })
    tenantId: string;
}
