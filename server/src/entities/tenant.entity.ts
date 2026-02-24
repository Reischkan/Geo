import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('tenants')
export class Tenant {
    @PrimaryColumn()
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    slug: string;

    @Column({ default: '' })
    logoUrl: string;

    @Column({ default: true })
    active: boolean;
}
