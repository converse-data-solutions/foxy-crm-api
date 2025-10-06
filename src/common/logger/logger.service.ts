import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';

@Injectable()
export class LoggerService {
  private successLogger: winston.Logger;
  private errorLogger: winston.Logger;

  constructor() {
    // JSON format for file logs
    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.json(),
    );

    // Colored console format
    const consoleFormat = winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp, requestId }) => {
        return `[${timestamp}] ${level} ${message} ${requestId ? `requestId=${requestId}` : ''}`;
      }),
    );

    // Success logger
    this.successLogger = winston.createLogger({
      level: 'info',
      format: fileFormat,
      transports: [
        new winston.transports.File({ filename: path.join('logs', 'success.log') }),
        new winston.transports.Console({ format: consoleFormat }),
      ],
    });

    // Error logger
    this.errorLogger = winston.createLogger({
      level: 'error',
      format: fileFormat,
      transports: [
        new winston.transports.File({ filename: path.join('logs', 'error.log') }),
        new winston.transports.Console({ format: consoleFormat }),
      ],
    });
  }

  logSuccess(message: string, meta?: { requestId?: string }) {
    this.successLogger.info(message, meta);
  }

  logError(message: string, meta?: { requestId?: string }) {
    this.errorLogger.error(message, meta);
  }
}
