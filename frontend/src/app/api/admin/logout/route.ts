import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_KEYS } from '@/lib/consts';
import { getServerContainer } from '@/lib/serveronly/container';

export async function POST() {
  const { adminAccessService } = getServerContainer();
  const refreshCookie = (await cookies()).get(AUTH_COOKIE_KEYS.refresh)?.value;
  await adminAccessService.logout(refreshCookie);

  const res = NextResponse.json({ ok: true });
  adminAccessService.clearAuthCookies(res);
  return res;
}



