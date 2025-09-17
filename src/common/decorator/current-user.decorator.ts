import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from 'src/dto/jwt-payload.dto';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    return data ? user?.[data] : user;
  },
);
