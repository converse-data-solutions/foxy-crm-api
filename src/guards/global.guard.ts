import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './role.guard';
import { CsrfGuard } from './csrf.guard';
import { Reflector } from '@nestjs/core';
import { SKIP_CSRF_KEY } from 'src/common/decorators/skip-csrf.decorator';

@Injectable()
export class GlobalAuthGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly rolesGuard: RolesGuard,
    private readonly csrfGuard: CsrfGuard,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Run JwtAuthGuard first
    const jwtResult = await this.jwtAuthGuard.canActivate(context);
    if (!jwtResult) return false;

    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest();
    const method = req.method;
    if (!skipCsrf && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrfResult = await this.csrfGuard.canActivate(context);
      if (!csrfResult) return false;
    }
    // Then check RolesGuard
    return this.rolesGuard.canActivate(context);
  }
}
