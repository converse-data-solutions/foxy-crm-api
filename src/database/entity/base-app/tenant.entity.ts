import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantSubscription } from './tenant-subscription.entity';

@Entity()
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

  @Column({ name: 'password', type: 'varchar', length: 100 })
  password: string;

  @Column({ name: 'url', type: 'text', nullable: true })
  url?: string;

  @Column({ name: 'email', type: 'varchar', length: 40, unique: true })
  email: string;

  @Column({ name: 'domain', type: 'varchar', length: 50 })
  domain: string;

  @Column({
    name: 'schema_name',
    type: 'uuid',
    default: () => 'uuid_generate_v4()',
  })
  schemaName: string;

  @OneToOne(() => TenantSubscription, (ts) => ts.tenant, { cascade: true })
  tenantSubscription: TenantSubscription;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt?: Date;
}
