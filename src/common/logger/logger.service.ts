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
  winston.format.printf(({ level, message, timestamp, requestId }) => {
    return `[${timestamp}] ${level} ${message} ${requestId ? `requestId=${requestId}` : ''}`;
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
  log(message: string, meta?: any) {
    winstonLogger.info(message, meta);
  }

  error(message: string, trace?: string, meta?: any) {
    winstonLogger.error(`${message} ${trace || ''}`, meta);
  }

  warn(message: string, meta?: any) {
    winstonLogger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    winstonLogger.debug(message, meta);
  }

  verbose(message: string, meta?: any) {
    winstonLogger.verbose(message, meta);
  }

  logSuccess(message: string, meta?: any) {
    winstonLogger.info(message, meta);
  }

  logError(message: string, meta?: any) {
    winstonLogger.error(message, meta);
  }
}
