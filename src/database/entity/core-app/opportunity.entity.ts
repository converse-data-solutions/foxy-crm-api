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
import { OpportunityStage } from 'src/enum/core-app.enum';

@Entity()
export class Opportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 30 })
  name: string;

  @Column({ name: 'value', type: 'integer' })
  value: number;

  @Column({ name: 'stage', type: 'enum', enum: OpportunityStage, default: OpportunityStage.Qualified })
  stage: OpportunityStage;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contactId: Contact;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
