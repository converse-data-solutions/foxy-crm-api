import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Task } from 'src/database/entity/core-app/task.entity';
import { TaskService } from 'src/services/task.service';

@Injectable()
export class TaskEventHandler {
  constructor(private readonly taskService: TaskService) {}

  @OnEvent('task-created', { async: true })
  async handleTaskCreated(payload: { tenantId: string; task: Task }) {
    const { tenantId, task } = payload;
    await this.taskService.taskMailer(tenantId, task);
  }

  @OnEvent('task-updated', { async: true })
  async handleTaskUpdated(payload: { tenantId: string; task: Task }) {
    const { tenantId, task } = payload;
    await this.taskService.taskMailer(tenantId, task);
  }
}
