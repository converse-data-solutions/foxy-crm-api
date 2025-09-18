import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { Socket } from 'socket.io';
import { LoggerService } from '../logger/logger.service';
import { WsException } from '@nestjs/websockets';

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
      console.error(exception);
    }
  }

  private handleHttpException(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | null = null;

    console.log(exception);
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse() as any;
      message = errorResponse.message || message;

      if (status === HttpStatus.BAD_REQUEST && Array.isArray(errorResponse.message)) {
        message = 'Validation failed';
        errors = errorResponse.message;
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors && { errors }),
    });
  }

  private handleWsException(exception: unknown, host: ArgumentsHost) {
    const client: Socket = host.switchToWs().getClient<Socket>();
    let message = 'WebSocket error';

    if (exception instanceof WsException) {
      const error = exception.getError();
      if (typeof error === 'string') {
        message = error;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        message = (error as any).message;
      }
    } else if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse() as any;
      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && 'message' in errorResponse) {
        message = errorResponse.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    client.emit('error', { success: false, message });
  }
}
