import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { jsonRequest, readJson } from '../test-utils';
import {
  applyRefreshedAuthCookies,
  getAdminRouteAuth,
  unauthorizedJson,
} from './mocks/admin-route-auth.mock';
import {
  createAdminUser,
  getAdminAuthById,
  listAdminUsers,
} from './mocks/auth.mock';

const route = await import('../../../src/app/api/admin/users/route');

describe('/api/admin/users', () => {
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

    getAdminAuthById.mockClear();
    getAdminAuthById.mockImplementation(async () => ({
      id: 1,
      email: 'admin@example.com',
      is_super_admin: true,
    }));

    listAdminUsers.mockClear();
    listAdminUsers.mockImplementation(async () => []);

    createAdminUser.mockClear();
    createAdminUser.mockImplementation(async () => ({
      id: 2,
      email: 'new@example.com',
    }));
  });

  it('GET returns unauthorized when auth fails', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: null,
      refreshedTokens: null,
      needsClear: true,
    }));

    const res = await route.GET();
    expect(res.status).toBe(401);
    expect(unauthorizedJson).toHaveBeenCalledTimes(1);
  });

  it('GET returns admin users payload', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: { sub: '1', email: 'admin@example.com' },
      refreshedTokens: { accessToken: 'a1', refreshToken: 'r1' },
      needsClear: false,
    }));
    listAdminUsers.mockImplementation(async () => [
      {
        id: 1,
        email: 'admin@example.com',
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        is_super_admin: true,
      },
    ]);

    const res = await route.GET();
    const body = await readJson<{
      ok: boolean;
      data: { admins: Array<{ id: number }> };
    }>(res);

    expect(res.status).toBe(200);
    expect(body.data.admins.length).toBe(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, {
      accessToken: 'a1',
      refreshToken: 'r1',
    });
  });

  it('GET returns 401 when auth payload exists but actor no longer exists', async () => {
    getAdminAuthById.mockImplementation(async () => null);

    const res = await route.GET();
    const body = await readJson<{ marker: string; clear: boolean }>(res);

    expect(res.status).toBe(401);
    expect(body.marker).toBe('unauthorized');
    expect(body.clear).toBe(true);
    expect(unauthorizedJson).toHaveBeenCalledTimes(1);
    expect(unauthorizedJson).toHaveBeenCalledWith({ clearCookies: true });
  });

  it('POST returns 401 when auth payload missing', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: null,
      refreshedTokens: null,
      needsClear: true,
    }));

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/users', 'POST', {
        email: 'new@example.com',
        password: 'password123',
      })
    );

    expect(res.status).toBe(401);
    expect(unauthorizedJson).toHaveBeenCalledTimes(1);
  });

  it('POST returns 403 when actor is not super admin', async () => {
    getAdminAuthById.mockImplementation(async () => ({
      id: 1,
      email: 'admin@example.com',
      is_super_admin: false,
    }));

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/users', 'POST', {
        email: 'new@example.com',
        password: 'password123',
      })
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(403);
    expect(body.message).toBe('Only super admins can create admins.');
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, null);
    expect(createAdminUser).toHaveBeenCalledTimes(0);
  });

  it('POST returns 400 on invalid credentials body', async () => {
    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/users', 'POST', {
        email: 'bad-email',
      })
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(400);
    expect(body.message).toBe('Invalid credentials.');
    expect(createAdminUser).toHaveBeenCalledTimes(0);
  });

  it('POST returns 400 when createAdminUser throws', async () => {
    createAdminUser.mockImplementation(async () => {
      throw new Error('db down');
    });

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/users', 'POST', {
        email: 'new@example.com',
        password: 'password123',
      })
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(400);
    expect(body.message).toBe('Unable to create admin.');
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, null);
  });

  it('POST creates admin and returns 200', async () => {
    getAdminAuthById.mockImplementation(async () => ({
      id: 1,
      email: 'admin@example.com',
      is_super_admin: true,
    }));

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/users', 'POST', {
        email: 'new@example.com',
        password: 'password123',
      })
    );
    const body = await readJson<{ ok: boolean }>(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(createAdminUser).toHaveBeenCalledTimes(1);
    expect(createAdminUser).toHaveBeenCalledWith(
      'new@example.com',
      'password123'
    );
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, null);
  });
});
