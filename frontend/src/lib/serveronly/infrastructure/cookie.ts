import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import 'server-only';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  ADMIN_ACCESS_KEY,
  ADMIN_REFRESH_KEY,
  REFRESH_TOKEN_TTL_DAYS,
} from '@/lib/consts';
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
    res.cookies.set(ADMIN_ACCESS_KEY, accessToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
    });

    res.cookies.set(ADMIN_REFRESH_KEY, refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
    });
  }

  clearAuthCookies(res: NextResponse): void {
    res.cookies.set(ADMIN_ACCESS_KEY, '', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    res.cookies.set(ADMIN_REFRESH_KEY, '', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });
  }
}

