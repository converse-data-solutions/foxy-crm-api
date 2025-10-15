import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lead } from './lead.entity';
import { Role } from 'src/enums/core-app.enum';
import { StatusCause } from 'src/enums/status.enum';
import { Exclude } from 'class-transformer';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  email: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, unique: true })
  phone: string;

  @Exclude()
  @Column({ type: 'varchar', length: 100 })
  password: string;

  @Column({ name: 'role', type: 'enum', enum: Role, default: Role.SalesRep })
  role: Role;

  @Column({ name: 'address', type: 'varchar', length: 50, nullable: true })
  address?: string;

  @Column({ name: 'city', type: 'varchar', length: 40, nullable: true })
  city?: string;

  @Column({ name: 'country', type: 'varchar', length: 50, nullable: true })
  country?: string;

  @Column({ name: 'status', type: 'boolean', default: true })
  status: boolean;

  @Column({ name: 'status_cause', type: 'enum', enum: StatusCause, nullable: true })
  statusCause?: StatusCause | null;

  @Exclude()
  @Column({ name: 'otp', type: 'int', nullable: true })
  otp?: number;

  @Exclude()
  @Column({ name: 'otp_expiry_at', type: 'timestamp', nullable: true })
  otpExpiryAt?: Date;

  @Exclude()
  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Exclude()
  @Column({ name: 'otp_verified', type: 'boolean', default: false })
  otpVerified: boolean;

  @OneToMany(() => Lead, (lead) => lead.assignedTo, { nullable: true })
  leads: Lead[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
