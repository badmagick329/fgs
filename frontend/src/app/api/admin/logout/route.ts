import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getServerContainer } from '@/lib/serveronly/container';

export async function POST() {
  const { adminAccessService } = getServerContainer();
  const refreshCookie = (await cookies()).get('admin_refresh')?.value;
  await adminAccessService.logout(refreshCookie);

  const res = NextResponse.json({ ok: true });
  adminAccessService.clearAuthCookies(res);
  return res;
}



