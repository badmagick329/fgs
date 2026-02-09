import { adminPasswordChangeSchema } from '@/types';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import {
  clearAuthCookies,
  setAuthCookies,
} from '@/lib/serveronly/admin-cookies';
import {
  getAdminById,
  revokeAllRefreshTokensForUser,
  updateAdminPassword,
  verifyPassword,
} from '@/lib/serveronly/auth';
import { refreshSession } from '@/lib/serveronly/refresh';

export async function POST(req: Request) {
  const accessToken = (await cookies()).get('admin_access')?.value;
  let refreshedTokens: { accessToken: string; refreshToken: string } | null =
    null;
  let payload: { sub: string; email: string } | null = null;

  if (accessToken) {
    try {
      payload = await verifyAccessToken(accessToken);
    } catch {
      // fall through to refresh
    }
  }

  if (!payload) {
    const refreshCookie = (await cookies()).get('admin_refresh')?.value;
    if (!refreshCookie) {
      const res = NextResponse.json(
        { ok: false, message: 'Unauthorized.' },
        { status: 401 }
      );
      clearAuthCookies(res);
      return res;
    }
    refreshedTokens = await refreshSession(refreshCookie);
    if (!refreshedTokens) {
      const res = NextResponse.json(
        { ok: false, message: 'Unauthorized.' },
        { status: 401 }
      );
      clearAuthCookies(res);
      return res;
    }
    payload = await verifyAccessToken(refreshedTokens.accessToken);
  }

  const body = await req.json().catch(() => null);
  const parsed = adminPasswordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid password change request.' },
      { status: 400 }
    );
  }

  const adminId = Number(payload.sub);
  const admin = await getAdminById(adminId);
  if (!admin) {
    const res = NextResponse.json(
      { ok: false, message: 'Unauthorized.' },
      { status: 401 }
    );
    if (refreshedTokens) {
      setAuthCookies(
        res,
        refreshedTokens.accessToken,
        refreshedTokens.refreshToken
      );
    }
    return res;
  }

  const { currentPassword, newPassword } = parsed.data;
  const isValid = await verifyPassword(currentPassword, admin.password_hash);
  if (!isValid) {
    const res = NextResponse.json(
      { ok: false, message: 'Current password is incorrect.' },
      { status: 400 }
    );
    if (refreshedTokens) {
      setAuthCookies(
        res,
        refreshedTokens.accessToken,
        refreshedTokens.refreshToken
      );
    }
    return res;
  }

  await updateAdminPassword(adminId, newPassword);
  await revokeAllRefreshTokensForUser(adminId);

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
