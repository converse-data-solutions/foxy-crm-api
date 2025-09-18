import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { Lead } from './lead.entity';
import { Note } from './note.entity';

@Entity()
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Account)
  @JoinColumn({name: 'account_id'})
  accountId: Account;

  @Column({ name: 'name', type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  email: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, unique: true })
  phone: string;

  @OneToOne(() => Lead, (lead) => lead.contact)
  lead: Lead;

  @OneToMany(()=>Note,note =>note.contact )
  note: Note[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
