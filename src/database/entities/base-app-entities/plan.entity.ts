import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Subscription } from './subscription.entity';
import { UserCount } from 'src/enums/user-count.enum';

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

  @Column({ name: 'user_count', type: 'enum', enum: UserCount })
  userCount: UserCount;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  tenantsSubscription: Subscription[];
}
