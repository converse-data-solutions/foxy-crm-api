// csrf.util.ts
import { doubleCsrf } from 'csrf-csrf';
import { Request } from 'express';
import { CSRF_SECRET, Environment } from './config.util';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';

const isProd = Environment.NODE_ENV === 'production';

// Ensure CSRF_SECRET is a proper string
if (!CSRF_SECRET || CSRF_SECRET.length < 32) {
  throw new Error('CSRF_SECRET must be at least 32 characters long');
}

const { generateCsrfToken, doubleCsrfProtection, invalidCsrfTokenError, validateRequest } =
  doubleCsrf({
    getSecret: () => CSRF_SECRET,
    getSessionIdentifier: (req: Request) => {
      const user = req.user as JwtPayload;
      return user?.email ?? req.ip ?? 'unknown';
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
    getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
  });

export const csrfUtils = {
  generateCsrfToken,
  doubleCsrfProtection,
  validateRequest,
};
