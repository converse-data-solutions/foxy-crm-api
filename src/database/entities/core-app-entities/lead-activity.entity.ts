import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Lead } from './lead.entity';
import { LeadActivityType } from 'src/enums/lead-activity.enum';
import { User } from './user.entity';

@Entity('lead_activities')
export class LeadActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lead, (lead) => lead.id)
  @JoinColumn({ name: 'lead_id' })
  leadId: Lead;

  @Column({ name: 'activity_type', type: 'enum', enum: LeadActivityType })
  activityType: LeadActivityType;

  @Column({ name: 'activity_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  activityDate: Date;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
