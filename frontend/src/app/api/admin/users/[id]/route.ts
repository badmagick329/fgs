import { verifyAccessToken } from '@/lib/auth/jwt';
import { clearAuthCookies, setAuthCookies } from '@/lib/serveronly/admin-cookies';
import { AdminActionError, removeAdminUserWithGuards } from '@/lib/serveronly/auth';
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

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
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

  const { id } = await Promise.resolve(context.params);
  const targetAdminId = Number(id);
  if (!Number.isInteger(targetAdminId) || targetAdminId <= 0) {
    return NextResponse.json(
      { ok: false, message: 'Invalid admin id.' },
      { status: 400 }
    );
  }

  try {
    await removeAdminUserWithGuards({
      actingAdminId: Number(auth.payload.sub),
      targetAdminId,
    });

    const res = NextResponse.json({ ok: true });
    if (auth.refreshedTokens) {
      setAuthCookies(
        res,
        auth.refreshedTokens.accessToken,
        auth.refreshedTokens.refreshToken
      );
    }
    return res;
  } catch (error) {
    const message =
      error instanceof AdminActionError
        ? error.message
        : 'Failed to remove admin.';
    const status = error instanceof AdminActionError ? error.status : 500;
    const res = NextResponse.json({ ok: false, message }, { status });
    if (auth.refreshedTokens) {
      setAuthCookies(
        res,
        auth.refreshedTokens.accessToken,
        auth.refreshedTokens.refreshToken
      );
    }
    return res;
  }
}
