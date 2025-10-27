// src/shared/utils/csrf.util.ts
import { doubleCsrf } from 'csrf-csrf';
import { Request } from 'express';
import { CSRF_SECRET } from './config.util';

export const csrfUtils = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  getSessionIdentifier: (req: Request) => req.ip!, // Or use req.user.id after login
  cookieName: 'x-csrf-secret',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'prod',
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});
