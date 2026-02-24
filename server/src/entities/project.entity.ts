import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('projects')
export class Project {
    @PrimaryColumn()
    id: string;

    @Column()
    title: string;

    @Column()
    clientId: string;

    @Column()
    client: string;

    @Column({ default: 'activo' })
    status: string;

    @Column()
    startDate: string;

    @Column()
    endDateEst: string;

    @Column('int', { default: 0 })
    progress: number;

    @Column('int', { default: 0 })
    sessionsTotal: number;

    @Column('int', { default: 0 })
    sessionsCompleted: number;

    @Column('simple-json', { default: '[]' })
    technicianIds: string[];

    @Column({ default: 'tenant-mx' })
    tenantId: string;
}
