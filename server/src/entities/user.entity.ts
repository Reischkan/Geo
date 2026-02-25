import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryColumn()
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    passwordHash: string;

    @Column()
    name: string;

    @Column({ default: 'admin' })
    role: string; // super-admin | admin | viewer | tecnico

    @Column({ nullable: true, default: '' })
    technicianId: string;

    @Column()
    tenantId: string;

    @Column({ default: true })
    active: boolean;
}
