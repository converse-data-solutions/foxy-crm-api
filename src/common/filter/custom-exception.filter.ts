import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    // Handle standard HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
      if (typeof message === 'object' && (message as any).message) {
        message = (message as any).message;
      }
    }

    // Handle TypeORM database errors
    if (exception instanceof QueryFailedError) {
      const err: any = exception;

      // PostgreSQL error codes
      switch (err.code) {
        case '42P01': // undefined_table
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Database table does not exist';
          break;
        case '23505': // unique_violation
          status = HttpStatus.CONFLICT;
          message = 'Duplicate value violates unique constraint';
          break;
        case '23502': // not_null_violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Missing required field';
          break;
        default:
          message = err.message || 'Database error';
      }
    }
    console.log(exception);
    
    response.status(status).json({
      success: false,
      statusCode: status,
      message,
    });
  }
}
