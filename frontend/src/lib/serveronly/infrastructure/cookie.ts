import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import 'server-only';
import { AUTH_COOKIE_KEYS, AUTH_TTL } from '@/lib/consts';
import { ICookie } from '@/lib/serveronly/domain/interfaces';

export class Cookie implements ICookie {
  constructor(private readonly isProduction: boolean) {}

  async get(name: string): Promise<string | undefined> {
    return (await cookies()).get(name)?.value;
  }

  setAuthCookies(
    res: NextResponse,
    accessToken: string,
    refreshToken: string
  ): void {
    res.cookies.set(AUTH_COOKIE_KEYS.access, accessToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: AUTH_TTL.accessSeconds,
    });

    res.cookies.set(AUTH_COOKIE_KEYS.refresh, refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: AUTH_TTL.refreshDays * 24 * 60 * 60,
    });
  }

  clearAuthCookies(res: NextResponse): void {
    res.cookies.set(AUTH_COOKIE_KEYS.access, '', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    res.cookies.set(AUTH_COOKIE_KEYS.refresh, '', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });
  }
}

