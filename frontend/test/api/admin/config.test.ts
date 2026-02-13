import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { jsonRequest, readJson } from '../test-utils';
import {
  applyRefreshedAuthCookies,
  getAdminRouteAuth,
  unauthorizedJson,
} from './mocks/admin-route-auth.mock';
import { getAdminConfig, upsertAdminConfig } from './mocks/auth.mock';

const route = await import('../../../src/app/api/admin/config/route');

describe('/api/admin/config', () => {
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

    getAdminConfig.mockClear();
    getAdminConfig.mockImplementation(async () => null);

    upsertAdminConfig.mockClear();
    upsertAdminConfig.mockImplementation(
      async (_email: string, _adminId: number) => undefined
    );
  });

  it('GET returns 401 when unauthorized', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: null,
      refreshedTokens: null,
      needsClear: true,
    }));

    const res = await route.GET();
    expect(res.status).toBe(401);
    expect(unauthorizedJson).toHaveBeenCalledTimes(1);
    expect(unauthorizedJson).toHaveBeenCalledWith({ clearCookies: true });
  });

  it('GET returns config when authorized', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: { sub: '1', email: 'admin@example.com' },
      refreshedTokens: { accessToken: 'a1', refreshToken: 'r1' },
      needsClear: false,
    }));
    getAdminConfig.mockImplementation(async () => ({
      id: 1,
      notification_email: 'notify@example.com',
    }));

    const res = await route.GET();
    const body = await readJson<{ ok: boolean; data: { id: number } }>(res);

    expect(res.status).toBe(200);
    expect(body.data.id).toBe(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, {
      accessToken: 'a1',
      refreshToken: 'r1',
    });
  });

  it('POST validates email body', async () => {
    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/config', 'POST', {
        notificationEmail: 'not-an-email',
      })
    );
    expect(res.status).toBe(400);
    expect(upsertAdminConfig).toHaveBeenCalledTimes(0);
  });

  it('POST returns 401 when unauthorized', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: null,
      refreshedTokens: null,
      needsClear: true,
    }));

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/config', 'POST', {
        notificationEmail: 'alerts@example.com',
      })
    );

    expect(res.status).toBe(401);
    expect(unauthorizedJson).toHaveBeenCalledTimes(1);
    expect(unauthorizedJson).toHaveBeenCalledWith({ clearCookies: true });
    expect(upsertAdminConfig).toHaveBeenCalledTimes(0);
  });

  it('POST updates config', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: { sub: '7', email: 'admin@example.com' },
      refreshedTokens: null,
      needsClear: false,
    }));

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/config', 'POST', {
        notificationEmail: 'alerts@example.com',
      })
    );
    const body = await readJson<{ ok: boolean }>(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(upsertAdminConfig).toHaveBeenCalledTimes(1);
    expect(upsertAdminConfig).toHaveBeenCalledWith('alerts@example.com', 7);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, null);
  });
});
