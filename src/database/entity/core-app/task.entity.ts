import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { EntityName, TaskPriority, TaskType } from 'src/enum/core-app.enum';
import { TaskStatus } from 'src/enum/status.enum';

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  @Column({ name: 'entity_name', type: 'enum', enum: EntityName })
  entityName: EntityName;

  @Column({ name: 'entity_id', type: 'varchar', length: 40 })
  entityId: string;

  @Column({ name: 'type', type: 'enum', enum: TaskType })
  type: TaskType;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.Pending,
  })
  status: TaskStatus;

  @Column({ name: 'priority', type: 'enum', enum: TaskPriority })
  priority: TaskPriority;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
