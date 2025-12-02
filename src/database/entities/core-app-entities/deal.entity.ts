import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Contact } from './contact.entity';
import { DealStage } from 'src/enums/status.enum';
import { User } from './user.entity';

@Entity({ name: 'deals' })
@Check(`"expected_close_date" IS NULL OR "expected_close_date" > CURRENT_DATE`)
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 70, unique: true })
  name: string;

  @Column({ name: 'value', type: 'decimal', precision: 8, scale: 2 })
  value: number;

  @Column({
    name: 'stage',
    type: 'enum',
    enum: DealStage,
    default: DealStage.Qualified,
  })
  stage: DealStage;

  @Column({ name: 'expected_close_date', type: 'date', nullable: true })
  expectedCloseDate?: Date;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contactId: Contact;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
