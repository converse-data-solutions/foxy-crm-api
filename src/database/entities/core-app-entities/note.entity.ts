import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { NotesEntityName } from 'src/enums/lead-activity.enum';
import { Exclude } from 'class-transformer';

@Entity({ name: 'notes' })
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Exclude()
  @Column({ name: 'entity_name', type: 'enum', enum: NotesEntityName })
  entityName: NotesEntityName;

  @Exclude()
  @Column({ name: 'entity_id', type: 'varchar', length: 40 })
  entityId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
