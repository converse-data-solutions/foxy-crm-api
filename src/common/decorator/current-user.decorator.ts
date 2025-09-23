import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/database/entity/core-app/user.entity';
import { Request } from 'express';

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request: Request = ctx.switchToHttp().getRequest();
  const user: User = request.user as User;
  return data ? user?.[data] : user;
});
