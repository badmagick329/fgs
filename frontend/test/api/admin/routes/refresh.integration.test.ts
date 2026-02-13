import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { NextResponse } from 'next/server';
import { readJson } from '../../test-utils';

type CookieValue = { value: string };
const cookieJar: Record<string, string | undefined> = {
  admin_refresh: undefined,
};
const cookieGet = mock((name: string) =>
  cookieJar[name] === undefined ? undefined : ({ value: cookieJar[name] } as CookieValue)
);
const cookiesMock = mock(async () => ({ get: cookieGet }));
const refreshSession = mock(
  async (_token: string) =>
    null as null | { accessToken: string; refreshToken: string }
);

mock.module('next/headers', () => ({ cookies: cookiesMock }));
mock.module('@/lib/serveronly/refresh', () => ({ refreshSession }));
mock.module('@/lib/serveronly/admin-cookies', () => ({
  setAuthCookies: (res: NextResponse, accessToken: string, refreshToken: string) => {
    res.cookies.set('admin_access', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 900,
    });
    res.cookies.set('admin_refresh', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 24 * 60 * 60,
    });
  },
  clearAuthCookies: (res: NextResponse) => {
    res.cookies.set('admin_access', '', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });
    res.cookies.set('admin_refresh', '', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });
  },
}));
mock.module('@/lib/serveronly/admin-route-auth', () => ({
  unauthorizedJson: (opts?: { clearCookies?: boolean }) => {
    const res = NextResponse.json(
      { ok: false as const, message: 'Unauthorized.' },
      { status: 401 }
    );
    if (opts?.clearCookies) {
      res.cookies.set('admin_access', '', {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });
      res.cookies.set('admin_refresh', '', {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });
    }
    return res;
  },
}));

const route = await import('../../../../src/app/api/admin/refresh/route');

describe('POST /api/admin/refresh integration', () => {
  beforeEach(() => {
    cookieJar.admin_refresh = undefined;
    cookieGet.mockClear();
    cookiesMock.mockClear();
    refreshSession.mockClear();
    refreshSession.mockImplementation(async () => null);
  });

  it('returns 401 and clears cookies when refresh cookie missing', async () => {
    const res = await route.POST();
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(401);
    expect(body.message).toBe('Unauthorized.');
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('admin_access=');
    expect(setCookie).toContain('admin_refresh=');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('returns 401 and clears cookies when refresh session fails', async () => {
    cookieJar.admin_refresh = 'r1';
    refreshSession.mockImplementation(async () => null);

    const res = await route.POST();

    expect(res.status).toBe(401);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(refreshSession).toHaveBeenCalledWith('r1');
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('admin_access=');
    expect(setCookie).toContain('admin_refresh=');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('returns 200 and sets auth cookies when refresh succeeds', async () => {
    cookieJar.admin_refresh = 'r1';
    refreshSession.mockImplementation(async () => ({
      accessToken: 'a2',
      refreshToken: 'r2',
    }));

    const res = await route.POST();
    const body = await readJson<{ ok: boolean }>(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('admin_access=a2');
    expect(setCookie).toContain('admin_refresh=r2');
    expect(setCookie).not.toContain('Max-Age=0');
  });
});
