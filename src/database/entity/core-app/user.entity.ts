import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lead } from './lead.entity';
import { Role } from 'src/enum/core-app.enum';
import { Country } from '../common-entity/country.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  email: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 100 })
  password: string;

  @Column({ name: 'role', type: 'enum', enum: Role, default: Role.SalesRep })
  role: Role;

  @Column({ name: 'address', type: 'varchar', length: 50, nullable: true })
  address?: string;

  @Column({ name: 'city', type: 'varchar', length: 40, nullable: true })
  city?: string;

  @ManyToOne(() => Country)
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @OneToMany(() => Lead, (lead) => lead.assignedTo, { nullable: true })
  leads: Lead[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
