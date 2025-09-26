import { Module } from '@nestjs/common';
import { TaskService } from '../service/task.service';
import { TaskController } from '../controller/task.controller';
import { TaskEventHandler } from 'src/service/task-event-handler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { Subscription } from 'src/database/entity/base-app/subscription.entity';
import { TenantSubscription } from 'src/database/entity/base-app/tenant-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Subscription, TenantSubscription])],
  controllers: [TaskController],
  providers: [TaskService, TaskEventHandler],
})
export class TaskModule {}
