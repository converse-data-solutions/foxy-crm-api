import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TenantSubscription } from './tenant-subscription.entity';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_name', type: 'varchar', length: 20 })
  planName: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int', name: 'user_count' })
  userCount: number;

  @Column({ type: 'int', name: 'valid_upto' })
  validUpto: number;

  @OneToMany(() => TenantSubscription, (ts) => ts.subscription)
  tenantsSubscription: TenantSubscription[];
}
