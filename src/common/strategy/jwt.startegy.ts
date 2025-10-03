import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';
import { Request } from 'express';
import { UserService } from 'src/services/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.access_token || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.SECRET_KEY!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const tenantId = req?.headers['x-tenant-id'];
    if (!tenantId) {
      throw new BadRequestException({
        message: 'x-tenant-id header is missing',
      });
    }
    const user = await this.userService.validateUser(
      payload,
      Array.isArray(tenantId) ? tenantId[0] : tenantId,
    );
    if (!user) throw new UnauthorizedException({ message: 'Unauthorized Access' });
    return user; // attached to req.user
  }
}
