import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { LoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class QueueCleanupService implements OnApplicationShutdown {
  constructor(private readonly loggerService: LoggerService) {}

  private queues: Queue[] = [];
  private workers: Worker[] = [];

  registerQueue(queue: Queue) {
    this.queues.push(queue);
  }

  registerWorker(worker: Worker) {
    this.workers.push(worker);
  }

  async onApplicationShutdown(signal?: string) {
    for (const worker of this.workers) {
      await worker.close();
    }

    for (const queue of this.queues) {
      await queue.close();
    }

    this.loggerService.logSuccess(`[${signal || 'shutdown'}] All queues/workers closed`);
  }
}
