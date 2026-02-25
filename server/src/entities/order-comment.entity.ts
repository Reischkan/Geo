import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('order_comments')
export class OrderComment {
    @PrimaryColumn()
    id: string;

    @Column()
    orderId: string;

    @Column()
    authorId: string;

    @Column()
    authorName: string;

    @Column()
    text: string;

    @Column()
    createdAt: string;

    @Column({ default: 'tenant-mx' })
    tenantId: string;
}
