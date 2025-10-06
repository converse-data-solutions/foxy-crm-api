import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { LoggerService } from 'src/common/logger/logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const requestId = uuidv4();
    const req = context.switchToHttp().getRequest();
    req.requestId = requestId;

    const { method, url } = req;

    // Log incoming request
    this.logger.logSuccess(`Incoming Request: ${method} ${url}`, { requestId });

    return next.handle().pipe(
      tap(() => {
        // Log successful response (only message)
        this.logger.logSuccess(`Request completed: ${method} ${url}`, { requestId });
      }),
      catchError((error) => {
        // Log error message
        this.logger.logError(`Request failed: ${method} ${url} - ${error.message}`, { requestId });
        throw error;
      }),
    );
  }
}
