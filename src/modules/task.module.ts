import { Module } from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { TaskController } from '../controllers/task.controller';
import { TaskEventHandler } from 'src/services/task-event-handler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { Plan } from 'src/database/entity/base-app/plan.entity';
import { Subscription } from 'src/database/entity/base-app/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Plan, Subscription])],
  controllers: [TaskController],
  providers: [TaskService, TaskEventHandler],
})
export class TaskModule {}
