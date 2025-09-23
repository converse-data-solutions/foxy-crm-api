import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Country } from '../common-entity/country.entity';
import { User } from './user.entity';

@Entity({ name: 'accounts' })
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 40, unique: true })
  name: string;

  @Column({ name: 'industry', type: 'varchar', length: 40 })
  industry: string;

  @Column({ name: 'website', type: 'text' })
  website: string;

  @Column({ name: 'address', type: 'varchar', length: 50, nullable: true })
  address?: string;

  @Column({ name: 'city', type: 'varchar', length: 40, nullable: true })
  city?: string;

  @ManyToOne(() => Country)
  @JoinColumn({ name: 'country_id' })
  country?: Country;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;
}
