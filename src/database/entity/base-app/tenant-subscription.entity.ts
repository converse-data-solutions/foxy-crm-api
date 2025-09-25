import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne, Column } from 'typeorm';
import { Tenant } from './tenant.entity';
import { Subscription } from './subscription.entity';

@Entity({ name: 'tenant_subscriptions' })
export class TenantSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', default: false })
  status: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'start_date' })
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'end_date' })
  endDate?: Date;

  @Column({ name: 'stripe_session_id', type: 'varchar', nullable: true, length: 100 })
  stripeSessionId?: string;

  @Column({ name: 'stripe_subscription_id', type: 'varchar', nullable: true, length: 50 })
  stripeSubscriptionId?: string;

  @Column({ name: 'stripe_customer_id', type: 'varchar', nullable: true, length: 50 })
  stripeCustomerId?: string;

  @OneToOne(() => Tenant, (tenant) => tenant.tenantSubscription, { cascade: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Subscription, (subscription) => subscription.tenantsSubscription, {
    nullable: true,
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;
}
