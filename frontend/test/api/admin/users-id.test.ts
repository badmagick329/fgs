import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { jsonRequest, readJson } from '../test-utils';
import {
  applyRefreshedAuthCookies,
  getAdminRouteAuth,
  unauthorizedJson,
} from './mocks/admin-route-auth.mock';
import {
  TestAdminActionError,
  removeAdminUserWithGuards,
  updateAdminSuperStatusWithGuards,
} from './mocks/auth.mock';

const route = await import('../../../src/app/api/admin/users/[id]/route');

describe('/api/admin/users/[id]', () => {
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

    removeAdminUserWithGuards.mockClear();
    removeAdminUserWithGuards.mockImplementation(async (_args: unknown) => undefined);

    updateAdminSuperStatusWithGuards.mockClear();
    updateAdminSuperStatusWithGuards.mockImplementation(async (_args: unknown) => ({
      id: 1,
      is_super_admin: true,
    }));
  });

  it('DELETE returns 401 when unauthorized', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: null,
      refreshedTokens: null,
      needsClear: true,
    }));

    const res = await route.DELETE(
      jsonRequest('http://localhost/api/admin/users/2', 'DELETE'),
      { params: { id: '2' } }
    );
    const body = await readJson<{ marker: string }>(res);

    expect(res.status).toBe(401);
    expect(body.marker).toBe('unauthorized');
    expect(unauthorizedJson).toHaveBeenCalledTimes(1);
  });

  it('PATCH returns 401 when unauthorized', async () => {
    getAdminRouteAuth.mockImplementation(async () => ({
      payload: null,
      refreshedTokens: null,
      needsClear: true,
    }));

    const res = await route.PATCH(
      jsonRequest('http://localhost/api/admin/users/2', 'PATCH', {
        isSuperAdmin: true,
      }),
      { params: { id: '2' } }
    );
    const body = await readJson<{ marker: string }>(res);

    expect(res.status).toBe(401);
    expect(body.marker).toBe('unauthorized');
    expect(unauthorizedJson).toHaveBeenCalledTimes(1);
  });

  it('PATCH returns 400 for invalid id', async () => {
    const res = await route.PATCH(
      jsonRequest('http://localhost/api/admin/users/abc', 'PATCH', {
        isSuperAdmin: true,
      }),
      { params: { id: 'abc' } }
    );
    expect(res.status).toBe(400);
  });

  it('DELETE returns 400 for invalid id', async () => {
    const res = await route.DELETE(
      jsonRequest('http://localhost/api/admin/users/abc', 'DELETE'),
      { params: { id: 'abc' } }
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(400);
    expect(body.message).toBe('Invalid admin id.');
  });

  it('PATCH returns 400 for invalid body schema', async () => {
    const res = await route.PATCH(
      jsonRequest('http://localhost/api/admin/users/2', 'PATCH', {
        isSuperAdmin: 'yes',
      }),
      { params: { id: '2' } }
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(400);
    expect(body.message).toBe('Invalid request body.');
  });

  it('DELETE returns 200 on successful removal', async () => {
    const res = await route.DELETE(
      jsonRequest('http://localhost/api/admin/users/2', 'DELETE'),
      { params: { id: '2' } }
    );
    const body = await readJson<{ ok: boolean }>(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(removeAdminUserWithGuards).toHaveBeenCalledTimes(1);
    expect(removeAdminUserWithGuards).toHaveBeenCalledWith({
      actingAdminId: 1,
      targetAdminId: 2,
    });
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, null);
  });

  it('PATCH returns 200 on successful role update', async () => {
    const res = await route.PATCH(
      jsonRequest('http://localhost/api/admin/users/2', 'PATCH', {
        isSuperAdmin: false,
      }),
      { params: { id: '2' } }
    );
    const body = await readJson<{
      ok: boolean;
      data: { id: number; is_super_admin: boolean };
    }>(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(updateAdminSuperStatusWithGuards).toHaveBeenCalledTimes(1);
    expect(updateAdminSuperStatusWithGuards).toHaveBeenCalledWith({
      actingAdminId: 1,
      targetAdminId: 2,
      isSuperAdmin: false,
    });
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, null);
  });

  it('DELETE maps unknown error to status 500 and fallback message', async () => {
    removeAdminUserWithGuards.mockImplementation(async () => {
      throw new Error('boom');
    });

    const res = await route.DELETE(
      jsonRequest('http://localhost/api/admin/users/2', 'DELETE'),
      { params: { id: '2' } }
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(500);
    expect(body.message).toBe('Failed to remove admin.');
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, null);
  });

  it('PATCH maps AdminActionError to status/message', async () => {
    updateAdminSuperStatusWithGuards.mockImplementation(async () => {
      throw new TestAdminActionError(
        'Only super admins can change admin roles.',
        403
      );
    });

    const res = await route.PATCH(
      jsonRequest('http://localhost/api/admin/users/2', 'PATCH', {
        isSuperAdmin: false,
      }),
      { params: { id: '2' } }
    );
    const body = await readJson<{ ok: boolean; message: string }>(res);

    expect(res.status).toBe(403);
    expect(body.message).toContain('Only super admins');
    expect(updateAdminSuperStatusWithGuards).toHaveBeenCalledTimes(1);
    expect(updateAdminSuperStatusWithGuards).toHaveBeenCalledWith({
      actingAdminId: 1,
      targetAdminId: 2,
      isSuperAdmin: false,
    });
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, null);
  });

  it('PATCH maps unknown error to status 500 and fallback message', async () => {
    updateAdminSuperStatusWithGuards.mockImplementation(async () => {
      throw new Error('boom');
    });

    const res = await route.PATCH(
      jsonRequest('http://localhost/api/admin/users/2', 'PATCH', {
        isSuperAdmin: false,
      }),
      { params: { id: '2' } }
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(500);
    expect(body.message).toBe('Failed to update admin role.');
    expect(updateAdminSuperStatusWithGuards).toHaveBeenCalledTimes(1);
    expect(updateAdminSuperStatusWithGuards).toHaveBeenCalledWith({
      actingAdminId: 1,
      targetAdminId: 2,
      isSuperAdmin: false,
    });
    expect(applyRefreshedAuthCookies).toHaveBeenCalledTimes(1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalledWith(res, null);
  });
});
