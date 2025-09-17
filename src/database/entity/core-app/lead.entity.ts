import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { LeadStatus } from 'src/enum/status.enum';
import { LeadSource } from 'src/enum/core-app.enum';

@Entity()
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 30, nullable: false })
  name: string;

  @Column({ name: 'email', type: 'varchar', length: 50, unique: true })
  email: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: LeadStatus,
    default: LeadStatus.New,
  })
  status: LeadStatus;

  @Column({ name: 'phone', type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ name: 'company', type: 'varchar', length: 100, nullable: true })
  company: string;

  @Column({
    name: 'source',
    type: 'enum',
    enum: LeadSource,
    nullable: true,
  })
  source: LeadSource;

  @ManyToOne(() => User, (user) => user.leads, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
