import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Contact } from './contact.entity';
import { OpportunityStatus } from 'src/enum/status.enum';

@Entity({ name: 'oppurtunities' })
export class Opportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 30 })
  name: string;

  @Column({ name: 'value', type: 'integer' })
  value: number;

  @Column({
    name: 'stage',
    type: 'enum',
    enum: OpportunityStatus,
    default: OpportunityStatus.Qualified,
  })
  stage: OpportunityStatus;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contactId: Contact;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
