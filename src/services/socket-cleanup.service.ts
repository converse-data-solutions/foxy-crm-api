import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class SocketCleanupService {
  constructor(private readonly loggerService: LoggerService) {}

  private sockets: any[] = [];

  register(socket: any) {
    this.sockets.push(socket);
  }

  onApplicationShutdown(signal?: string) {
    for (const socket of this.sockets) {
      socket.disconnect(true);
    }
    this.loggerService.logSuccess(`[${signal || 'shutdown'}] All WebSocket connections closed`);
  }
}
