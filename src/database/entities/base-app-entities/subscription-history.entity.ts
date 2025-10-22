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

  @Column({ name: 'razorpay_payment_id', type: 'varchar', nullable: true, length: 100 })
  razorpayPaymentId?: string;

  @Column({ name: 'razorpay_subscription_id', type: 'varchar', nullable: true, length: 50 })
  razorpaySubscriptionId?: string;

  @Column({ name: 'razorpay_customer_id', type: 'varchar', nullable: true, length: 50 })
  razorpayCustomerId?: string;

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
