import { Module } from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { TaskController } from '../controllers/task.controller';
import { TaskEventHandler } from 'src/services/task-event-handler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Plan, Subscription])],
  controllers: [TaskController],
  providers: [TaskService, TaskEventHandler],
})
export class TaskModule {}
