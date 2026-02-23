import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    timestamp: Date;

    @Column({ default: 'Admin' })
    user: string;

    @Column()
    action: string;

    @Column()
    resource: string;

    @Column({ default: '' })
    details: string;
}
