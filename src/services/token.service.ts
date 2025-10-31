<<<<<<< HEAD
import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWT_CONFIG, SALT_ROUNDS } from 'src/shared/utils/config.util';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';
import { WsException } from '@nestjs/websockets';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { TenantService } from './tenant.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => TenantService))
    private readonly tenantService: TenantService,
  ) {}
=======
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWT_CONFIG } from 'src/common/constant/config.constants';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}
>>>>>>> 90be837 (update-subscriptions)

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

<<<<<<< HEAD
  async verifyAccessToken(token: string, isSocketValidation?: boolean): Promise<JwtPayload> {
    try {
      const payload: JwtPayload = this.jwtService.verify(token, {
        secret: JWT_CONFIG.ACCESS_SECRET_KEY,
      });
      const tenant = await this.tenantService.getTenant(payload.email);
      const userRepo = await getRepo(User, tenant.schemaName);
      const user = await userRepo.findOne({ where: { email: payload.email } });
      if (isSocketValidation) {
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

  async getRefreshToken(token: string) {
    const payload = this.jwtService.verify(token, { secret: JWT_CONFIG.REFRESH_SECRETE_KEY });
    const tenant = await this.tenantService.getTenant(payload.email);
    const userRepo = await getRepo(User, tenant.schemaName);
    const user = await userRepo.findOne({ where: { email: payload.email } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid token');
    }
    const isValidToken = await bcrypt.compare(token, user.refreshToken);

    if (!isValidToken) {
      throw new UnauthorizedException('Invalid token');
    }
    const tokenPayload = {
      email: user.email,
      id: user.id,
      role: user.role,
    };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);
    const hashedToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    user.refreshToken = hashedToken;
    await userRepo.save(user);
    return { accessToken, refreshToken };
=======
  verifyToken(token: string): JwtPayload {
    const secret = JWT_CONFIG.ACCESS_SECRET_KEY;
    return this.jwtService.verify(token, { secret });
>>>>>>> 90be837 (update-subscriptions)
  }
}
