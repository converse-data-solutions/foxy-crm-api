import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Subscription } from './subscription.entity';

@Entity({ name: 'plans' })
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_name', type: 'varchar', length: 20 })
  planName: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'varchar', name: 'price_id', length: 50 })
  priceId: string;

  @Column({ type: 'varchar', name: 'valid_upto', length: 20 })
  validUpto: string;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  tenantsSubscription: Subscription[];
}
