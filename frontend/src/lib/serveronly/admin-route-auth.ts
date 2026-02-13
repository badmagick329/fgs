import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import 'server-only';
import { AccessTokenPayload, verifyAccessToken } from '@/lib/auth/jwt';
import { clearAuthCookies, setAuthCookies } from '@/lib/serveronly/admin-cookies';
import { refreshSession } from '@/lib/serveronly/refresh';

export type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
};

export type RouteAuthResult = {
  payload: AccessTokenPayload | null;
  refreshedTokens: RefreshedTokens | null;
  needsClear: boolean;
};

export type AuthorizedRouteAuth = RouteAuthResult & {
  payload: AccessTokenPayload;
};

type RouteAuthFailure = {
  ok: false;
  response: NextResponse;
};

type RouteAuthSuccess = {
  ok: true;
  auth: AuthorizedRouteAuth;
};

export type RequireAdminRouteAuthResult = RouteAuthFailure | RouteAuthSuccess;

export async function getAdminRouteAuth(): Promise<RouteAuthResult> {
  const accessToken = (await cookies()).get('admin_access')?.value;
  let refreshedTokens: RefreshedTokens | null = null;
  let payload: AccessTokenPayload | null = null;

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

    try {
      payload = await verifyAccessToken(refreshedTokens.accessToken);
    } catch {
      return { payload: null, refreshedTokens: null, needsClear: true };
    }
  }

  return { payload, refreshedTokens, needsClear: false };
}

export function unauthorizedJson(opts?: { clearCookies?: boolean }) {
  const res = NextResponse.json(
    { ok: false as const, message: 'Unauthorized.' },
    { status: 401 }
  );
  if (opts?.clearCookies) {
    clearAuthCookies(res);
  }
  return res;
}

export async function requireAdminRouteAuth(opts?: {
  clearCookies?: 'auto' | boolean;
}): Promise<RequireAdminRouteAuthResult> {
  const auth = await getAdminRouteAuth();
  if (!auth.payload) {
    const clearCookies =
      opts?.clearCookies === 'auto' || opts?.clearCookies === undefined
        ? auth.needsClear
        : opts.clearCookies;
    return {
      ok: false,
      response: unauthorizedJson({ clearCookies }),
    };
  }

  return {
    ok: true,
    auth: auth as AuthorizedRouteAuth,
  };
}

export function applyRefreshedAuthCookies(
  res: NextResponse,
  refreshedTokens: RefreshedTokens | null
) {
  if (!refreshedTokens) {
    return;
  }
  setAuthCookies(res, refreshedTokens.accessToken, refreshedTokens.refreshToken);
}
