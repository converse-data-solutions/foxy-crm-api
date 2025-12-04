import { Module } from '@nestjs/common';
import { ConnectionCleanupService } from 'src/services/connection-cleanup.service';
import { QueueCleanupService } from 'src/services/queue-cleanup.service';
import { SocketCleanupService } from 'src/services/socket-cleanup.service';
import { LoggerModule } from './logger.module';

@Module({
  imports: [LoggerModule],
  providers: [ConnectionCleanupService, QueueCleanupService, SocketCleanupService],
  exports: [ConnectionCleanupService, QueueCleanupService, SocketCleanupService],
})
export class CleanupModule {}
