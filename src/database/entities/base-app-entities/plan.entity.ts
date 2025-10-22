import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserCount } from 'src/enums/user-count.enum';
import { PlanPricing } from './plan-pricing.entity';

@Entity({ name: 'plans' })
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_name', type: 'varchar', length: 20 })
  planName: string;

  @OneToMany(() => PlanPricing, (pricing) => pricing.plan, { cascade: true })
  planPricings: PlanPricing[];

  @Column({ name: 'user_count', type: 'enum', enum: UserCount })
  userCount: UserCount;
}
