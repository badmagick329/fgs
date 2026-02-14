import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/serveronly/container', () => ({ getServerContainer }));

import { POST } from '@/app/api/admin/password/route';

describe('/api/admin/password', () => {
  beforeEach(() => {
    mock.restore();
    getServerContainer.mockReset();
  });

  it('returns 400 for invalid payload', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: true,
          auth: { payload: { sub: '1', email: 'admin@example.com' }, refreshedTokens: null },
        })),
      },
      adminManagementService: {},
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: 'x' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('clears cookies on successful password change', async () => {
    const clearAuthCookies = mock(() => {});
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: true,
          auth: { payload: { sub: '1', email: 'admin@example.com' }, refreshedTokens: null },
        })),
        applyRefreshedAuthCookies: mock(() => {}),
        clearAuthCookies,
      },
      adminManagementService: {
        changePassword: mock(async () => ({ ok: true })),
      },
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'password123',
        newPassword: 'newpassword123',
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(clearAuthCookies).toHaveBeenCalled();
  });
});
