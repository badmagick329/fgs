import type { NextResponse } from 'next/server';
import 'server-only';
import {
  ADMIN_ACCESS_KEY,
  ADMIN_REFRESH_KEY,
  REFRESH_TOKEN_TTL_DAYS,
} from '@/lib/consts';
import { ACCESS_TOKEN_TTL_SECONDS } from '@/lib/consts';

const isSecure = () => process.env.NODE_ENV === 'production';

export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  res.cookies.set(ADMIN_ACCESS_KEY, accessToken, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'strict',
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });

  res.cookies.set(ADMIN_REFRESH_KEY, refreshToken, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ADMIN_ACCESS_KEY, '', {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  res.cookies.set(ADMIN_REFRESH_KEY, '', {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}
