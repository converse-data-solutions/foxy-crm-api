// src/common/guards/csrf.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { csrfUtils } from 'src/shared/utils/csrf.util';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // ✅ Validate the CSRF token
    const isValid = csrfUtils.validateRequest(req);
    if (!isValid) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }
    return true;
  }
}
