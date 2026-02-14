import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getServerContainer } from '@/lib/serveronly/container';
import { ADMIN_REFRESH_KEY } from '@/lib/consts';

export async function POST() {
  const { adminAccessService } = getServerContainer();
  const refreshCookie = (await cookies()).get(ADMIN_REFRESH_KEY)?.value;
  await adminAccessService.logout(refreshCookie);

  const res = NextResponse.json({ ok: true });
  adminAccessService.clearAuthCookies(res);
  return res;
}



