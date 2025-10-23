import { Injectable, LoggerService as INestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';

@Injectable()
export class LoggerService implements INestLoggerService {
  private successLogger: winston.Logger;
  private errorLogger: winston.Logger;

  constructor() {
    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.json(),
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp, requestId }) => {
        return `[${timestamp}] ${level} ${message} ${requestId ? `requestId=${requestId}` : ''}`;
      }),
    );

    this.successLogger = winston.createLogger({
      level: 'info',
      format: fileFormat,
      transports: [
        new winston.transports.File({ filename: path.join('logs', 'success.log') }),
        new winston.transports.Console({ format: consoleFormat }),
      ],
    });

    this.errorLogger = winston.createLogger({
      level: 'error',
      format: fileFormat,
      transports: [
        new winston.transports.File({ filename: path.join('logs', 'error.log') }),
        new winston.transports.Console({ format: consoleFormat }),
      ],
    });
  }

  // Nest-compatible methods
  log(message: string, meta?: any) {
    this.successLogger.info(message, meta);
  }

  error(message: string, trace?: string, meta?: any) {
    this.errorLogger.error(`${message} ${trace || ''}`, meta);
  }

  warn(message: string, meta?: any) {
    this.successLogger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.successLogger.debug(message, meta);
  }

  verbose(message: string, meta?: any) {
    this.successLogger.verbose(message, meta);
  }

  // Optional: your custom methods
  logSuccess(message: string, meta?: { requestId?: string }) {
    this.successLogger.info(message, meta);
  }

  logError(message: string, meta?: { requestId?: string }) {
    this.errorLogger.error(message, meta);
  }
}
