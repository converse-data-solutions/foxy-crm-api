import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { closeAllConnections } from 'src/shared/database-connection/get-connection';

@Injectable()
export class ConnectionCleanupService implements OnModuleDestroy {
  constructor(private readonly loggerService: LoggerService) {}
  async onModuleDestroy() {
    this.loggerService.logSuccess('[TenantDB] Cleaning up all connections on app shutdown...');
    await closeAllConnections();
  }
}
