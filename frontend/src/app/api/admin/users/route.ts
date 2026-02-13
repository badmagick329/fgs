import { verifyAccessToken } from '@/lib/auth/jwt';
import { clearAuthCookies, setAuthCookies } from '@/lib/serveronly/admin-cookies';
import { getAdminAuthById, listAdminUsers } from '@/lib/serveronly/auth';
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

  const currentAdminId = Number(auth.payload.sub);
  const currentAdmin = await getAdminAuthById(currentAdminId);
  if (!currentAdmin) {
    const res = NextResponse.json(
      { ok: false, message: 'Unauthorized.' },
      { status: 401 }
    );
    if (auth.refreshedTokens) {
      setAuthCookies(
        res,
        auth.refreshedTokens.accessToken,
        auth.refreshedTokens.refreshToken
      );
    }
    return res;
  }

  const admins = await listAdminUsers();
  const res = NextResponse.json({
    ok: true,
    data: {
      currentAdminId,
      currentAdminEmail: currentAdmin.email,
      currentAdminIsSuperAdmin: currentAdmin.is_super_admin,
      admins: admins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        created_at: admin.created_at.toISOString(),
        is_super_admin: admin.is_super_admin,
      })),
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
