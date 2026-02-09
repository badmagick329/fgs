import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/serveronly/admin-cookies';
import {
  getRefreshTokenByHash,
  hashRefreshToken,
  revokeRefreshToken,
} from '@/lib/serveronly/auth';

export async function POST() {
  const refreshCookie = (await cookies()).get('admin_refresh')?.value;
  if (refreshCookie) {
    const tokenHash = hashRefreshToken(refreshCookie);
    const tokenRow = await getRefreshTokenByHash(tokenHash);
    if (tokenRow && !tokenRow.revoked_at) {
      await revokeRefreshToken(tokenRow.id);
    }
  }

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
