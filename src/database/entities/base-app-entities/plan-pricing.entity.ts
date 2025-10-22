import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Plan } from './plan.entity';
import { BillingCycle } from 'src/enums/billing-cycle.enum';
import { Subscription } from './subscription.entity';
import { SubscriptionHistory } from './subscription-history.entity';

@Entity({ name: 'plan_pricings' })
export class PlanPricing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Plan, (plan) => plan.planPricings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({
    name: 'billing_cycle',
    type: 'enum',
    enum: BillingCycle,
  })
  billingCycle: BillingCycle;

  @Column({ type: 'int' })
  price: number;

  @Column({ name: 'price_id', type: 'varchar', length: 100, nullable: true })
  priceId: string;

  @OneToMany(() => Subscription, (subscription) => subscription.planPrice)
  tenantsSubscription: Subscription[];

  @OneToMany(() => SubscriptionHistory, (subscriptionHistory) => subscriptionHistory.planPrice)
  subscriptionHistory: SubscriptionHistory[];
}
