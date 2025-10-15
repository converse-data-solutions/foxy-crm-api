import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWT_CONFIG } from 'src/shared/utils/config.util';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';
import { WsException } from '@nestjs/websockets';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { Repository } from 'typeorm';
import { TenantService } from './tenant.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => TenantService))
    private readonly tenantService: TenantService,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: JWT_CONFIG.ACCESS_SECRET_KEY,
      expiresIn: JWT_CONFIG.JWT_ACCESS_EXPIRES_IN,
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: JWT_CONFIG.REFRESH_SECRETE_KEY,
      expiresIn: JWT_CONFIG.JWT_REFRESH_EXPIRES_IN,
    });
  }

  async verifyToken(token: string, isSocketValidation?: boolean): Promise<JwtPayload> {
    try {
      const payload: JwtPayload = this.jwtService.verify(token, {
        secret: JWT_CONFIG.ACCESS_SECRET_KEY,
      });
      const tenant = await this.tenantService.getTenant(payload.email);
      if (isSocketValidation) {
        const userRepo = await getRepo(User, tenant.schemaName);
        const user = await userRepo.findOne({ where: { email: payload.email } });
        if (!user) {
          throw new UnauthorizedException('Invalid token');
        }
      }
      return payload;
    } catch (err) {
      if (isSocketValidation) {
        throw new WsException(`JWT verification failed: ${err.message}`);
      }
      throw new UnauthorizedException(`JWT verification failed`);
    }
  }
}
