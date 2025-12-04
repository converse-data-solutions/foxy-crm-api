import { Module } from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { TaskController } from '../controllers/task.controller';
import { TaskEventHandler } from 'src/services/task-event-handler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from 'src/database/entities/base-app-entities';
import { EmailModule } from './email.module';

@Module({
  imports: [TypeOrmModule.forFeature(entities), EmailModule],
  controllers: [TaskController],
  providers: [TaskService, TaskEventHandler],
  exports: [TaskService],
})
export class TaskModule {}
