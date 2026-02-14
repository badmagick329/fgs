import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getServerContainer } from '@/lib/serveronly/container';

export async function POST() {
  const { adminAccessService } = getServerContainer();
  const refreshCookie = (await cookies()).get('admin_refresh')?.value;
  if (!refreshCookie) {
    return adminAccessService.unauthorizedJson({ clearCookies: true });
  }

  const refreshed = await adminAccessService.refreshSession(refreshCookie);
  if (!refreshed) {
    return adminAccessService.unauthorizedJson({ clearCookies: true });
  }

  const res = NextResponse.json({ ok: true });
  adminAccessService.setAuthCookies(
    res,
    refreshed.accessToken,
    refreshed.refreshToken
  );
  return res;
}



