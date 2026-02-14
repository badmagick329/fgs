import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/serveronly/auth/admin-cookies';
import { unauthorizedJson } from '@/lib/serveronly/auth/admin-route-auth';
import { refreshSession } from '@/lib/serveronly/auth/auth';

export async function POST() {
  const refreshCookie = (await cookies()).get('admin_refresh')?.value;
  if (!refreshCookie) {
    return unauthorizedJson({ clearCookies: true });
  }

  const refreshed = await refreshSession(refreshCookie);
  if (!refreshed) {
    return unauthorizedJson({ clearCookies: true });
  }

  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, refreshed.accessToken, refreshed.refreshToken);
  return res;
}
