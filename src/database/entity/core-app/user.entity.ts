import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lead } from './lead.entity';
import { Role } from 'src/enum/core-app.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  password: string;

  @Column({ name: 'role', type: 'enum', enum: Role, default: Role.SalesRep })
  role: Role;

  @OneToMany(() => Lead, (lead) => lead.assignedTo, { nullable: true })
  leads: Lead[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
