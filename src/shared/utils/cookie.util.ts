import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { CookiePayload } from 'src/common/dtos/cookie-payload.dto';

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
}

export function setCookie(payload: CookiePayload, res: Response) {
  const defaultOptions: CookieOptions = {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
  };
  let cookieName = 'access_token';
  if (payload.accessToken) {
    res.cookie(cookieName, payload.accessToken, defaultOptions);
  }
  if (payload.tenantAccessToken) {
    cookieName = 'tenant_access_token';
    res.cookie(cookieName, payload.tenantAccessToken, defaultOptions);
  }
  res.status(HttpStatus.OK);
}
