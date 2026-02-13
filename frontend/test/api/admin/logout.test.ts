import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { readJson } from '../test-utils';
import { clearAuthCookies } from './mocks/admin-cookies.mock';
import {
  getRefreshTokenByHash,
  hashRefreshToken,
  revokeRefreshToken,
} from './mocks/auth.mock';

const cookieGet = mock((name: string) => undefined as { value: string } | undefined);
const cookiesMock = mock(async () => ({ get: cookieGet }));

mock.module('next/headers', () => ({ cookies: cookiesMock }));

const route = await import('../../../src/app/api/admin/logout/route');

describe('POST /api/admin/logout', () => {
  beforeEach(() => {
    cookieGet.mockClear();
    cookieGet.mockImplementation(() => undefined);

    cookiesMock.mockClear();
    cookiesMock.mockImplementation(async () => ({ get: cookieGet }));

    clearAuthCookies.mockClear();

    hashRefreshToken.mockClear();
    hashRefreshToken.mockImplementation((token: string) => `hash:${token}`);

    getRefreshTokenByHash.mockClear();
    getRefreshTokenByHash.mockImplementation(async () => null);

    revokeRefreshToken.mockClear();
    revokeRefreshToken.mockImplementation(async (_id: number) => undefined);
  });

  it('always returns ok and clears cookies', async () => {
    const res = await route.POST();
    const body = await readJson<{ ok: boolean }>(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(cookieGet).toHaveBeenCalledTimes(1);
    expect(cookieGet).toHaveBeenCalledWith('admin_refresh');
    expect(clearAuthCookies).toHaveBeenCalledTimes(1);
  });

  it('revokes refresh token when present and active', async () => {
    cookieGet.mockImplementation(() => ({ value: 'r1' }));
    getRefreshTokenByHash.mockImplementation(async () => ({
      id: 44,
      revoked_at: null,
    }));

    const res = await route.POST();

    expect(res.status).toBe(200);
    expect(cookieGet).toHaveBeenCalledTimes(1);
    expect(cookieGet).toHaveBeenCalledWith('admin_refresh');
    expect(hashRefreshToken).toHaveBeenCalledTimes(1);
    expect(hashRefreshToken).toHaveBeenCalledWith('r1');
    expect(revokeRefreshToken).toHaveBeenCalledTimes(1);
    expect(revokeRefreshToken).toHaveBeenCalledWith(44);
  });

  it('does not revoke refresh token when already revoked', async () => {
    cookieGet.mockImplementation(() => ({ value: 'r1' }));
    getRefreshTokenByHash.mockImplementation(async () => ({
      id: 44,
      revoked_at: new Date('2024-01-01T00:00:00.000Z'),
    }));

    const res = await route.POST();

    expect(res.status).toBe(200);
    expect(cookieGet).toHaveBeenCalledTimes(1);
    expect(cookieGet).toHaveBeenCalledWith('admin_refresh');
    expect(revokeRefreshToken).toHaveBeenCalledTimes(0);
  });
});
