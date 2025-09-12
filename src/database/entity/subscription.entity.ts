import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TenantSubscription } from './tenant-subscription.entity';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_name', type: 'varchar', length: 20 })
  planName: string;

  @Column({ name: 'price', type: 'int' })
  price: number;

  @Column({ name: 'user_count', type: 'int' })
  userCount: number;

  @Column({ name: 'valid_upto', type: 'int' })
  validUpto: number;

  @OneToMany(
    () => TenantSubscription,
    (tenantSubscription) => tenantSubscription.id,
  )
  tenantsSubscriptionId: TenantSubscription[];
}
