import { Module } from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { TaskController } from '../controllers/task.controller';
import { TaskEventHandler } from 'src/services/task-event-handler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities/base-app-entities';
import { EmailModule } from './email.module';
import { SubscriptionModule } from './subscription.module';
import { TenantThrottlerGuard } from 'src/guards/tenant-throttler.guard';

@Module({
  imports: [TypeOrmModule.forFeature(entities), EmailModule, SubscriptionModule],
  controllers: [TaskController],
  providers: [TaskService, TaskEventHandler, TenantThrottlerGuard],
  exports: [TaskService],
})
export class TaskModule {}
