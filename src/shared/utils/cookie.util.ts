import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { CookiePayload } from 'src/common/dtos/cookie-payload.dto';
import { Environment } from './config.util';

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
}

const isProd = Environment.NODE_ENV === 'production';
export function setCookie(payload: CookiePayload, res: Response) {
  const defaultOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 24,
    path: '/',
    sameSite: isProd ? 'strict' : 'lax',
  };
  let cookieName = 'access_token';
  if (payload.accessToken) {
    res.cookie(cookieName, payload.accessToken, defaultOptions);
  }
  cookieName = 'refresh_token';
  if (payload.refreshToken) {
    res.cookie(cookieName, payload.refreshToken, defaultOptions);
  }
  res.status(HttpStatus.OK);
}
