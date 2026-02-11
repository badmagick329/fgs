import type { NextResponse } from 'next/server';
import { accessTokenTtlSeconds } from '@/lib/auth/jwt';
import { refreshTokenTtlDays } from '@/lib/serveronly/auth';

const isSecure = () => process.env.NODE_ENV === 'production';

export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  res.cookies.set('admin_access', accessToken, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'strict',
    path: '/',
    maxAge: accessTokenTtlSeconds,
  });

  res.cookies.set('admin_refresh', refreshToken, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'strict',
    path: '/',
    maxAge: refreshTokenTtlDays * 24 * 60 * 60,
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set('admin_access', '', {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  res.cookies.set('admin_refresh', '', {
    httpOnly: true,
    secure: isSecure(),
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}
