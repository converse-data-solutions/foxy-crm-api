import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';
import { Request } from 'express';
import { UserService } from 'src/services/user.service';
import { JWT_CONFIG } from '../../shared/utils/config.util';
import { validate, version } from 'uuid';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.access_token || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: JWT_CONFIG.ACCESS_SECRET_KEY!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const tenantHeaders = req?.headers['x-tenant-id'];
    const tenantId = Array.isArray(tenantHeaders) ? tenantHeaders[0] : tenantHeaders;
    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header is missing');
    }

    if (!validate(tenantId) || version(tenantId) !== 4) {
      throw new BadRequestException('Invalid tenant-id.');
    }
    const user = await this.userService.validateUser(
      payload,
      Array.isArray(tenantId) ? tenantId[0] : tenantId,
    );
    if (!user) throw new UnauthorizedException('Unauthorized Access invalid token');
    return user; // attached to req.user
  }
}
