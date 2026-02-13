import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { jsonRequest, readJson } from '../test-utils';
import { clearAuthCookies } from './mocks/admin-cookies.mock';
import {
  applyRefreshedAuthCookies,
  getAdminRouteAuth,
  unauthorizedJson,
} from './mocks/admin-route-auth.mock';
import {
  getAdminById,
  revokeAllRefreshTokensForUser,
  updateAdminPassword,
  verifyPassword,
} from './mocks/auth.mock';

const route = await import('../../../src/app/api/admin/password/route');

describe('POST /api/admin/password', () => {
  beforeEach(() => {
    getAdminRouteAuth.mockClear();
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: { sub: '1', email: 'admin@example.com' },
      refreshedTokens: null,
      needsClear: false,
    }));

    unauthorizedJson.mockClear();

    applyRefreshedAuthCookies.mockClear();
    applyRefreshedAuthCookies.mockImplementation(() => {});

    getAdminById.mockClear();
    getAdminById.mockImplementation(async () => ({
      id: 1,
      email: 'admin@example.com',
      password_hash: 'hash',
    }));

    verifyPassword.mockClear();
    verifyPassword.mockImplementation(async () => true);

    updateAdminPassword.mockClear();
    updateAdminPassword.mockImplementation(async () => undefined);

    revokeAllRefreshTokensForUser.mockClear();
    revokeAllRefreshTokensForUser.mockImplementation(async () => undefined);

    clearAuthCookies.mockClear();
  });

  it('returns unauthorized through shared helper', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: null,
      refreshedTokens: null,
      needsClear: true,
    }));

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/password', 'POST', {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
      })
    );
    const body = await readJson<{ clear: boolean }>(res);

    expect(res.status).toBe(401);
    expect(body.clear).toBe(true);
    expect(unauthorizedJson).toHaveBeenCalledTimes(1);
    expect(unauthorizedJson).toHaveBeenCalledWith({ clearCookies: true });
    expect(updateAdminPassword).toHaveBeenCalledTimes(0);
    expect(revokeAllRefreshTokensForUser).toHaveBeenCalledTimes(0);
  });

  it('returns 401 when admin record is missing and applies refreshed cookies', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: { sub: '1', email: 'admin@example.com' },
      refreshedTokens: { accessToken: 'a1', refreshToken: 'r1' },
      needsClear: false,
    }));
    getAdminById.mockImplementation(async () => null);

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/password', 'POST', {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
      })
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(401);
    expect(body.message).toBe('Unauthorized.');
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, {
      accessToken: 'a1',
      refreshToken: 'r1',
    });
    expect(updateAdminPassword).toHaveBeenCalledTimes(0);
    expect(revokeAllRefreshTokensForUser).toHaveBeenCalledTimes(0);
  });

  it('returns 400 when current password is incorrect and applies refreshed cookies', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: { sub: '1', email: 'admin@example.com' },
      refreshedTokens: { accessToken: 'a1', refreshToken: 'r1' },
      needsClear: false,
    }));
    verifyPassword.mockImplementation(async () => false);

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/password', 'POST', {
        currentPassword: 'wrong-password',
        newPassword: 'newpassword123',
      })
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(400);
    expect(body.message).toBe('Current password is incorrect.');
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, {
      accessToken: 'a1',
      refreshToken: 'r1',
    });
    expect(updateAdminPassword).toHaveBeenCalledTimes(0);
    expect(revokeAllRefreshTokensForUser).toHaveBeenCalledTimes(0);
  });

  it('returns 400 for invalid request body', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: { sub: '1', email: 'admin@example.com' },
      refreshedTokens: null,
      needsClear: false,
    }));

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/password', 'POST', {
        currentPassword: 'short',
      })
    );
    expect(res.status).toBe(400);
    expect(updateAdminPassword).toHaveBeenCalledTimes(0);
    expect(revokeAllRefreshTokensForUser).toHaveBeenCalledTimes(0);
  });

  it('updates password and clears auth cookies', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: { sub: '1', email: 'admin@example.com' },
      refreshedTokens: null,
      needsClear: false,
    }));
    verifyPassword.mockImplementation(async () => true);

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/password', 'POST', {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
      })
    );
    const body = await readJson<{ ok: boolean }>(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(updateAdminPassword).toHaveBeenCalledTimes(1);
    expect(revokeAllRefreshTokensForUser).toHaveBeenCalledTimes(1);
    expect(clearAuthCookies).toHaveBeenCalledTimes(1);
  });
});
