import { Action } from 'src/enums/action.enum';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Action, nullable: false })
  action: Action;

  @Column({ name: 'tenant_id', type: 'varchar', length: 50 })
  tenantId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 50 })
  userId: string;

  @Column({ nullable: true, name: 'ip_address', type: 'varchar', length: 40 })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
