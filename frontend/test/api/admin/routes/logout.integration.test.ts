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

const hashRefreshToken = mock((token: string) => `hash:${token}`);
const getRefreshTokenByHash = mock(
  async (_hash: string) =>
    null as null | {
      id: number;
      revoked_at: Date | null;
    }
);
const revokeRefreshToken = mock(async (_id: number) => undefined);

mock.module('next/headers', () => ({ cookies: cookiesMock }));
mock.module('@/lib/serveronly/admin-cookies', () => ({
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
mock.module('@/lib/serveronly/auth', () => ({
  hashRefreshToken,
  getRefreshTokenByHash,
  revokeRefreshToken,
}));

const route = await import('../../../../src/app/api/admin/logout/route');

describe('POST /api/admin/logout integration', () => {
  beforeEach(() => {
    cookieJar.admin_refresh = undefined;
    cookieGet.mockClear();
    cookiesMock.mockClear();
    hashRefreshToken.mockClear();
    getRefreshTokenByHash.mockClear();
    revokeRefreshToken.mockClear();
    hashRefreshToken.mockImplementation((token: string) => `hash:${token}`);
    getRefreshTokenByHash.mockImplementation(async () => null);
    revokeRefreshToken.mockImplementation(async () => undefined);
  });

  it('always clears auth cookies', async () => {
    const res = await route.POST();
    const body = await readJson<{ ok: boolean }>(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('admin_access=');
    expect(setCookie).toContain('admin_refresh=');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('revokes active refresh token and clears cookies', async () => {
    cookieJar.admin_refresh = 'r1';
    getRefreshTokenByHash.mockImplementation(async () => ({
      id: 44,
      revoked_at: null,
    }));

    const res = await route.POST();

    expect(res.status).toBe(200);
    expect(hashRefreshToken).toHaveBeenCalledTimes(1);
    expect(hashRefreshToken).toHaveBeenCalledWith('r1');
    expect(getRefreshTokenByHash).toHaveBeenCalledTimes(1);
    expect(getRefreshTokenByHash).toHaveBeenCalledWith('hash:r1');
    expect(revokeRefreshToken).toHaveBeenCalledTimes(1);
    expect(revokeRefreshToken).toHaveBeenCalledWith(44);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('admin_access=');
    expect(setCookie).toContain('admin_refresh=');
    expect(setCookie).toContain('Max-Age=0');
  });
});
