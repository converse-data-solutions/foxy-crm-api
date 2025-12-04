import { Injectable, LoggerService as INestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, meta }) => {
    return `[${timestamp}] ${level} ${message} ${meta ? `- meta=${JSON.stringify(meta)}` : ''}`;
  }),
);

export const winstonLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  transports: [
    new winston.transports.File({ filename: path.join('logs', 'app.log') }),
    new winston.transports.Console({ format: consoleFormat }),
  ],
});

@Injectable()
export class LoggerService implements INestLoggerService {
  private wrapMeta(meta?: Record<string, any>) {
    return meta ? { meta } : {};
  }

  log(message: string, meta?: Record<string, any>) {
    winstonLogger.info({ message, ...this.wrapMeta(meta) });
  }

  error(message: string, trace?: string, meta?: Record<string, any>) {
    winstonLogger.error({ message, trace, ...this.wrapMeta(meta) });
  }

  warn(message: string, meta?: Record<string, any>) {
    winstonLogger.warn({ message, ...this.wrapMeta(meta) });
  }

  debug(message: string, meta?: Record<string, any>) {
    winstonLogger.debug({ message, ...this.wrapMeta(meta) });
  }

  verbose(message: string, meta?: Record<string, any>) {
    winstonLogger.verbose({ message, ...this.wrapMeta(meta) });
  }

  logSuccess(message: string, meta?: Record<string, any>) {
    this.log(message, meta);
  }

  logError(message: string, meta?: Record<string, any>) {
    this.error(message, undefined, meta);
  }
}
