import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Contact } from './contact.entity';
import { User } from './user.entity';
import { TicketStatus } from 'src/enum/status.enum';
import { Deal } from './deal.entity';

@Entity({ name: 'tickets' })
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'title', type: 'varchar', length: 30, nullable: false })
  title: string;

  @Column({ name: 'description', type: 'varchar', length: 300 })
  description: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.Open,
  })
  status: TicketStatus;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contactId: Contact;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  @ManyToOne(() => Deal)
  @JoinColumn({ name: 'deal_id' })
  dealId: Deal;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;
}
