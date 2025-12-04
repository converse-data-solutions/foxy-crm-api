import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';
import { SubscriptionHistory } from './subscription-history.entity';
import { Exclude } from 'class-transformer';
import { TenantStatus } from 'src/enums/status.enum';

@Entity({ name: 'tenants' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'organization_name',
    type: 'varchar',
    length: 30,
    unique: true,
  })
  organizationName: string;

  @Column({ name: 'user_name', type: 'varchar', length: 30 })
  userName: string;

  @Exclude()
  @Column({ name: 'password', type: 'varchar', length: 100 })
  password: string;

  @Column({ name: 'url', type: 'text', nullable: true })
  url?: string;

  @Column({ name: 'email', type: 'varchar', length: 50, unique: true })
  email: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ name: 'domain', type: 'varchar', length: 50 })
  domain: string;

  @Column({
    name: 'schema_name',
    type: 'uuid',
    default: () => 'uuid_generate_v4()',
  })
  schemaName: string;

  @Column({ name: 'address', type: 'varchar', length: 50, nullable: true })
  address?: string;

  @Column({ name: 'city', type: 'varchar', length: 40, nullable: true })
  city?: string;

  @Column({ name: 'country', type: 'varchar', length: 50, nullable: true })
  country?: string;

  @Exclude()
  @Column({ name: 'otp', type: 'varchar', length: 100, nullable: true })
  otp?: string;

  @Exclude()
  @Column({ name: 'otp_expiry_at', type: 'timestamp', nullable: true })
  otpExpiryAt?: Date;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({
    name: 'tenant_status',
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.Pending,
  })
  tenantStatus: TenantStatus;

  @OneToOne(() => Subscription, (subscription) => subscription.tenant)
  subscription: Subscription;

  @OneToMany(() => SubscriptionHistory, (subscriptionHistory) => subscriptionHistory.tenant)
  subscriptionHistory: SubscriptionHistory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt?: Date;
}
