import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { readJson } from '../test-utils';
import { setAuthCookies } from './mocks/admin-cookies.mock';
import { unauthorizedJson } from './mocks/admin-route-auth.mock';

const cookieGet = mock((name: string) => undefined as { value: string } | undefined);
const cookiesMock = mock(async () => ({ get: cookieGet }));
const refreshSession = mock(
  async (_token: string) =>
    null as null | { accessToken: string; refreshToken: string }
);

mock.module('next/headers', () => ({ cookies: cookiesMock }));
mock.module('@/lib/serveronly/refresh', () => ({ refreshSession }));

const route = await import('../../../src/app/api/admin/refresh/route');

describe('POST /api/admin/refresh', () => {
  beforeEach(() => {
    cookieGet.mockClear();
    cookieGet.mockImplementation(() => undefined);

    cookiesMock.mockClear();
    cookiesMock.mockImplementation(async () => ({ get: cookieGet }));

    refreshSession.mockClear();
    refreshSession.mockImplementation(async () => null);

    setAuthCookies.mockClear();
    unauthorizedJson.mockClear();
  });

  it('returns 401 when refresh cookie is missing', async () => {
    const res = await route.POST();
    const body = await readJson<{ ok: boolean; marker: string; clear: boolean }>(res);

    expect(res.status).toBe(401);
    expect(body.marker).toBe('unauthorized');
    expect(body.clear).toBe(true);
    expect(cookieGet).toHaveBeenCalledTimes(1);
    expect(cookieGet).toHaveBeenCalledWith('admin_refresh');
    expect(unauthorizedJson).toHaveBeenCalledTimes(1);
    expect(unauthorizedJson).toHaveBeenCalledWith({ clearCookies: true });
    expect(setAuthCookies).toHaveBeenCalledTimes(0);
  });

  it('returns 401 when refresh session fails', async () => {
    cookieGet.mockImplementation(() => ({ value: 'r1' }));
    refreshSession.mockImplementation(async () => null);

    const res = await route.POST();
    const body = await readJson<{ marker: string }>(res);

    expect(res.status).toBe(401);
    expect(body.marker).toBe('unauthorized');
    expect(cookieGet).toHaveBeenCalledTimes(1);
    expect(cookieGet).toHaveBeenCalledWith('admin_refresh');
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(refreshSession).toHaveBeenCalledWith('r1');
    expect(unauthorizedJson).toHaveBeenCalledTimes(1);
    expect(unauthorizedJson).toHaveBeenCalledWith({ clearCookies: true });
    expect(setAuthCookies).toHaveBeenCalledTimes(0);
  });

  it('sets cookies when refresh succeeds', async () => {
    cookieGet.mockImplementation(() => ({ value: 'r1' }));
    refreshSession.mockImplementation(async () => ({
      accessToken: 'a1',
      refreshToken: 'r2',
    }));

    const res = await route.POST();
    const body = await readJson<{ ok: boolean }>(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(cookieGet).toHaveBeenCalledTimes(1);
    expect(cookieGet).toHaveBeenCalledWith('admin_refresh');
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(refreshSession).toHaveBeenCalledWith('r1');
    expect(setAuthCookies).toHaveBeenCalledTimes(1);
    expect(setAuthCookies).toHaveBeenCalledWith(res, 'a1', 'r2');
  });
});
