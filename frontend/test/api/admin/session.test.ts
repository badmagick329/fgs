import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { readJson } from '../test-utils';
import {
  applyRefreshedAuthCookies,
  getAdminRouteAuth,
  unauthorizedJson,
} from './mocks/admin-route-auth.mock';

const route = await import('../../../src/app/api/admin/session/route');

describe('GET /api/admin/session', () => {
  beforeEach(() => {
    getAdminRouteAuth.mockClear();
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: { sub: '1', email: 'admin@example.com' },
      refreshedTokens: null,
      needsClear: false,
    }));

    unauthorizedJson.mockClear();
    applyRefreshedAuthCookies.mockClear();
  });

  it('returns unauthorized when auth payload missing', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: null,
      refreshedTokens: null,
      needsClear: true,
    }));

    const res = await route.GET();
    const body = await readJson<{ marker: string; clear: boolean }>(res);

    expect(res.status).toBe(401);
    expect(body.marker).toBe('unauthorized');
    expect(body.clear).toBe(true);
    expect(unauthorizedJson).toHaveBeenCalledTimes(1);
    expect(unauthorizedJson).toHaveBeenCalledWith({ clearCookies: true });
  });

  it('returns session payload when authorized', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: { sub: '3', email: 'admin@example.com' },
      refreshedTokens: { accessToken: 'a1', refreshToken: 'r1' },
      needsClear: false,
    }));

    const res = await route.GET();
    const body = await readJson<{
      ok: boolean;
      data: { id: string; email: string };
    }>(res);

    expect(res.status).toBe(200);
    expect(body.data.id).toBe('3');
    expect(body.data.email).toBe('admin@example.com');
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, {
      accessToken: 'a1',
      refreshToken: 'r1',
    });
  });
});
