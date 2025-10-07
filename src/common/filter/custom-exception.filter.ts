import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';
    let errors: string[] | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse() as any | unknown;

      if (status === HttpStatus.BAD_REQUEST && Array.isArray(errorResponse.message)) {
        message = 'Validation failed';
        errors = errorResponse.message;
      } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
        status = HttpStatus.TOO_MANY_REQUESTS;
        message = 'Too many requests. Please try again later.';
      } else {
        message = errorResponse.message || message;
      }
    }
    this.logger.logError(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${
        JSON.stringify(message) || message
      }`,
      { requestId: request.headers['x-tenant-id']?.toString() || undefined },
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors && { errors }),
    });
  }
}
