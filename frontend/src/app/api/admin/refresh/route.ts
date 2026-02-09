import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  clearAuthCookies,
  setAuthCookies,
} from '@/lib/serveronly/admin-cookies';
import { refreshSession } from '@/lib/serveronly/refresh';

export async function POST() {
  const refreshCookie = (await cookies()).get('admin_refresh')?.value;
  if (!refreshCookie) {
    const res = NextResponse.json(
      { ok: false, message: 'Unauthorized.' },
      { status: 401 }
    );
    clearAuthCookies(res);
    return res;
  }

  const refreshed = await refreshSession(refreshCookie);
  if (!refreshed) {
    const res = NextResponse.json(
      { ok: false, message: 'Unauthorized.' },
      { status: 401 }
    );
    clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, refreshed.accessToken, refreshed.refreshToken);
  return res;
}
