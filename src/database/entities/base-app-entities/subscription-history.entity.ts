import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PlanPricing } from './plan-pricing.entity';
import { Tenant } from './tenant.entity';

@Entity('subscription_history')
export class SubscriptionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stripe_session_id', type: 'varchar', nullable: true, length: 100 })
  stripeSessionId?: string;

  @Column({ name: 'stripe_subscription_id', type: 'varchar', nullable: true, length: 50 })
  stripeSubscriptionId?: string;

  @Column({ name: 'stripe_customer_id', type: 'varchar', nullable: true, length: 50 })
  stripeCustomerId?: string;

  @Column({ type: 'boolean', default: false })
  status: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'start_date' })
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'end_date' })
  endDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ManyToOne(() => Tenant, (tenant) => tenant.subscription)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => PlanPricing, (planPrice) => planPrice.tenantsSubscription, {
    nullable: true,
  })
  @JoinColumn({ name: 'plan_price_id' })
  planPrice: PlanPricing;

  @CreateDateColumn()
  createdAt: Date;
}
