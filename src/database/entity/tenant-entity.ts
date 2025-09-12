import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantSubscription } from './tenant-subscription.entity';

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_name', type: 'varchar', length: 30 })
  organizationName: string;

  @Column({ name: 'user_name', type: 'varchar', length: 30 })
  userName: string;

  @Column({ name: 'password', type: 'varchar', length: 100 })
  password: string;

  @Column({ name: 'url', type: 'text', nullable: true })
  url: string;

  @Column({
    name: 'schema_name',
    type: 'uuid',
    default: () => 'uuid_generate_v4()',
  })
  schemaName: string;

  @OneToOne(
    () => TenantSubscription,
    (subscription) => subscription.id,
  )
  @JoinColumn({ name: 'tenant_subscription_id' })
  tenantSubscription: TenantSubscription;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;
}
