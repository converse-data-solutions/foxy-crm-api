import { doubleCsrf } from 'csrf-csrf';
import { Request } from 'express';
import { CSRF_SECRET, Environment } from './config.util';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';

const isProd = Environment.NODE_ENV === 'production';
export const csrfUtils = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  getSessionIdentifier: (req: Request) => {
    const user = req.user as JwtPayload | undefined;
    return user?.id ?? req.ip ?? 'unknown';
  },
  cookieName: 'x-csrf-secret',
  cookieOptions: {
    httpOnly: true,
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});
