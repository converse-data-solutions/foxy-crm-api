import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { LoggerService } from '../logger/logger.service';
import { Request, Response } from 'express';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctxType = host.getType<'http' | 'ws' | 'rpc'>();

    if (ctxType === 'http') {
      this.handleHttpException(exception, host);
    } else if (ctxType === 'ws') {
      this.handleWsException(exception, host);
    } else {
      this.logger.error(`Unhandled exception: ${this.stringify(exception)}`);
    }
  }

  private getSafeMessage(status: number, internalMessage: string, exception: unknown): string {
    const env = process.env.NODE_ENV;

    if (env === 'production') {
      if (status >= 500) {
        return 'Internal server error. Please contact support.';
      }

      const safeMessages = [
        'Invalid credentials',
        'Resource not found',
        'Unauthorized access',
        'Validation failed',
        'Invalid CSRF token',
        'Rate limit exceeded',
      ];

      if (safeMessages.some((msg) => internalMessage.includes(msg))) {
        return internalMessage;
      }

      return 'Bad request. Please check your input.';
    }

    if (env === 'staging') {
      return internalMessage;
    }

    if (exception instanceof Error && exception.stack) {
      return `${internalMessage}`;
    }

    return internalMessage;
  }

  private handleHttpException(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let internalMessage = '';
    let errors: string[] | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse() as any;

      internalMessage =
        typeof errorResponse === 'string'
          ? errorResponse
          : errorResponse.message || exception.message;

      if (status === HttpStatus.BAD_REQUEST && Array.isArray(errorResponse.message)) {
        errors = errorResponse.message;
      }
    } else if (exception instanceof Error) {
      internalMessage = exception.message;
    } else {
      internalMessage = this.stringify(exception);
    }

    this.logger.error(
      `HTTP Exception [${request.method} ${request.url}] - ${internalMessage}`,
      undefined,
      {
        requestId: request.headers['x-request-id'] ?? request.id,
        tenantId: request.headers['x-tenant-id'] ?? null,
        ip: request.ip,
        method: request.method,
        url: request.url,
        statusCode: status,
      },
    );

    const safeMessage = this.getSafeMessage(status, internalMessage, exception);

    response.status(status).json({
      success: false,
      statusCode: status,
      message: safeMessage,
      ...(errors && { errors }),
    });
  }

  private handleWsException(exception: unknown, host: ArgumentsHost) {
    const client: Socket = host.switchToWs().getClient<Socket>();
    const env = process.env.NODE_ENV;

    let internalMessage = 'Unknown WebSocket error';
    let safeMessage = 'WebSocket error. Please try again later.';

    if (exception instanceof WsException) {
      const error = exception.getError();
      if (typeof error === 'string') internalMessage = error;
      else if (error && typeof error === 'object' && 'message' in error) {
        internalMessage = (error as any).message;
      }
    } else if (exception instanceof Error) {
      internalMessage = exception.message;
    }

    this.logger.error(
      `WebSocket Exception [client ${client.id}] - ${internalMessage}`,
      exception instanceof Error ? exception.stack : undefined,
      {
        clientId: client.id,
        tenantId: client.handshake?.headers?.['x-tenant-id'],
        userId: client.handshake?.auth?.userId,
      },
    );

    if (env !== 'production') {
      safeMessage = internalMessage;
    }

    client.emit('error', { success: false, message: safeMessage });
  }

  private stringify(exception: unknown): string {
    if (typeof exception === 'string') return exception;
    if (exception instanceof Error) return exception.message;
    try {
      return JSON.stringify(exception);
    } catch {
      return 'Unknown exception';
    }
  }
}
