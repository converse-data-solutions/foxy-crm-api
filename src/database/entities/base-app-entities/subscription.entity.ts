import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne, Column } from 'typeorm';
import { Tenant } from './tenant.entity';
import { Plan } from './plan.entity';

@Entity({ name: 'subscriptions' })
export class Subscription {
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

  @OneToOne(() => Tenant, (tenant) => tenant.subscription, { cascade: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Plan, (plan) => plan.tenantsSubscription, {
    nullable: true,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;
}
