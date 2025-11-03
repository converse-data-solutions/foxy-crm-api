import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { LoggerService } from '../logger/logger.service';

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

  private handleHttpException(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProd = process.env.NODE_ENV === 'production';

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
      exception instanceof Error ? exception.stack : undefined,
    );

    const safeMessage = isProd
      ? status >= 500
        ? 'Internal server error. Please contact support.'
        : 'Invalid request. Please check your input.'
      : internalMessage;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: safeMessage,
      ...(errors && { errors }),
    });
  }

  private handleWsException(exception: unknown, host: ArgumentsHost) {
    const client: Socket = host.switchToWs().getClient<Socket>();
    const isProd = process.env.NODE_ENV === 'production';

    let internalMessage = 'Unknown WebSocket error';
    let safeMessage = 'WebSocket error. Please try again later.';

    if (exception instanceof WsException) {
      const error = exception.getError();
      if (typeof error === 'string') internalMessage = error;
      else if (error && typeof error === 'object' && 'message' in error)
        internalMessage = (error as any).message;
    } else if (exception instanceof Error) {
      internalMessage = exception.message;
    }

    this.logger.error(
      `WebSocket Exception [client ${client.id}] - ${internalMessage}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    if (!isProd) {
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
