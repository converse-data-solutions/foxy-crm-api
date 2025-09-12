import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant-entity';
import { Subscription } from './subscription.entity';

@Entity()
export class TenantSubscription {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @OneToOne(() => Tenant, (tenant) => tenant.id)
  @JoinColumn({ name: 'tenant_id' })
  tenantId: Tenant;

  @Column({ name: 'status', type: 'boolean' })
  status: boolean;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @ManyToOne(() => Subscription, (subscription) => subscription.id)
  @JoinColumn({name: 'subscription_id'})
  subscriptionId: Subscription;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;
}
