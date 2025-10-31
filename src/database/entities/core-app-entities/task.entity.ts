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
import { EntityName, TaskPriority, TaskType } from 'src/enums/core-app.enum';
import { TaskStatus } from 'src/enums/status.enum';
import { Exclude } from 'class-transformer';

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Exclude()
  @Column({ name: 'entity_name', type: 'enum', enum: EntityName })
  entityName: EntityName;

  @Exclude()
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

  @Column({ name: 'priority', type: 'enum', enum: TaskPriority, default: TaskPriority.Medium })
  priority: TaskPriority;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
