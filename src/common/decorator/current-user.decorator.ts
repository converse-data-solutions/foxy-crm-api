import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/database/entity/core-app/user.entity';

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user: User = request.user;
  return data ? user?.[data] : user;
});
