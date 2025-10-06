import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './role.guard';

@Injectable()
export class GlobalAuthGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly rolesGuard: RolesGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Run JwtAuthGuard first
    const jwtResult = await this.jwtAuthGuard.canActivate(context);
    if (!jwtResult) return false;

    // Then check RolesGuard
    return this.rolesGuard.canActivate(context);
  }
}
