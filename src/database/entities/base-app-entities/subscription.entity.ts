import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne, Column } from 'typeorm';
import { Tenant } from './tenant.entity';
import { PlanPricing } from './plan-pricing.entity';

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

  @Column({ name: 'razorpay_payment_id', type: 'varchar', nullable: true, length: 100 })
  razorpayPaymentId?: string;

  @Column({ name: 'razorpay_subscription_id', type: 'varchar', nullable: true, length: 50 })
  razorpaySubscriptionId?: string;

  @Column({ name: 'razorpay_customer_id', type: 'varchar', nullable: true, length: 50 })
  razorpayCustomerId?: string;

  @OneToOne(() => Tenant, (tenant) => tenant.subscription, { cascade: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => PlanPricing, (planPrice) => planPrice.tenantsSubscription, {
    nullable: true,
  })
  @JoinColumn({ name: 'plan_price_id' })
  planPrice: PlanPricing;
}
