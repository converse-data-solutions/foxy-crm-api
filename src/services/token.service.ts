import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWT_CONFIG } from 'src/common/constant/config.constants';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

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

  verifyToken(token: string): JwtPayload {
    const secret = JWT_CONFIG.ACCESS_SECRET_KEY;
    return this.jwtService.verify(token, { secret });
  }
}
