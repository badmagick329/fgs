import { adminCredentialsSchema } from '@/types';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { refreshSession } from '@/lib/serveronly/refresh';
import { setAuthCookies, clearAuthCookies } from '@/lib/serveronly/admin-cookies';
import { createAdminUser } from '@/lib/serveronly/auth';

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

  if (!payload) {
    return NextResponse.json(
      { ok: false, message: 'Unauthorized.' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = adminCredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid credentials.' },
      { status: 400 }
    );
  }

  try {
    const { email, password } = parsed.data;
    await createAdminUser(email, password);
    const res = NextResponse.json({ ok: true });
    if (refreshedTokens) {
      setAuthCookies(res, refreshedTokens.accessToken, refreshedTokens.refreshToken);
    }
    return res;
  } catch {
    const res = NextResponse.json(
      { ok: false, message: 'Unable to create admin.' },
      { status: 400 }
    );
    if (refreshedTokens) {
      setAuthCookies(res, refreshedTokens.accessToken, refreshedTokens.refreshToken);
    }
    return res;
  }
}
