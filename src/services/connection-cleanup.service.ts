import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { closeAllConnections } from 'src/shared/database-connection/get-connection';

@Injectable()
export class ConnectionCleanupService implements OnApplicationShutdown {
  constructor(private readonly loggerService: LoggerService) {}

  async onApplicationShutdown(signal?: string) {
    this.loggerService.logSuccess('[TenantDB] Cleaning up all connections on app shutdown...');
    await closeAllConnections();
    this.loggerService.logSuccess(`[${signal || 'shutdown'}] All database connections closed`);
  }
}
