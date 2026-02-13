import { verifyAccessToken } from '@/lib/auth/jwt';
import { clearAuthCookies, setAuthCookies } from '@/lib/serveronly/admin-cookies';
import { refreshSession } from '@/lib/serveronly/refresh';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function requireAdmin() {
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
      return { payload: null, refreshedTokens: null, needsClear: true };
    }

    refreshedTokens = await refreshSession(refreshCookie);
    if (!refreshedTokens) {
      return { payload: null, refreshedTokens: null, needsClear: true };
    }

    payload = await verifyAccessToken(refreshedTokens.accessToken);
  }

  return { payload, refreshedTokens, needsClear: false };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.payload) {
    const res = NextResponse.json(
      { ok: false, message: 'Unauthorized.' },
      { status: 401 }
    );
    if (auth.needsClear) {
      clearAuthCookies(res);
    }
    return res;
  }

  const res = NextResponse.json({
    ok: true,
    data: {
      id: auth.payload.sub,
      email: auth.payload.email,
    },
  });

  if (auth.refreshedTokens) {
    setAuthCookies(
      res,
      auth.refreshedTokens.accessToken,
      auth.refreshedTokens.refreshToken
    );
  }
  return res;
}
