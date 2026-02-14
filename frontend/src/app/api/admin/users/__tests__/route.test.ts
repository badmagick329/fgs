import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/serveronly/container', () => ({ getServerContainer }));

import { GET, POST } from '@/app/api/admin/users/route';

describe('/api/admin/users', () => {
  beforeEach(() => {
    mock.restore();
    getServerContainer.mockReset();
  });

  it('passes through unauthorized from requireAdminRouteAuth', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: false,
          response: new Response(null, { status: 401 }),
        })),
      },
      adminManagementService: {},
    });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET returns list and applies refreshed cookies', async () => {
    const applyRefreshedAuthCookies = mock(() => {});
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: true,
          auth: {
            payload: { sub: '1', email: 'admin@example.com' },
            refreshedTokens: { accessToken: 'a', refreshToken: 'r' },
          },
        })),
        applyRefreshedAuthCookies,
      },
      adminManagementService: {
        listAdminsView: mock(async () => ({
          ok: true,
          data: {
            currentAdminId: 1,
            currentAdminEmail: 'admin@example.com',
            currentAdminIsSuperAdmin: true,
            admins: [],
          },
        })),
      },
    });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(applyRefreshedAuthCookies).toHaveBeenCalled();
  });

  it('POST maps create failure response', async () => {
    const applyRefreshedAuthCookies = mock(() => {});
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: true,
          auth: {
            payload: { sub: '1', email: 'admin@example.com' },
            refreshedTokens: null,
          },
        })),
        applyRefreshedAuthCookies,
      },
      adminManagementService: {
        createAdminWithGuard: mock(async () => ({
          ok: false,
          status: 403,
          message: 'Only super admins can create admins.',
        })),
      },
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(applyRefreshedAuthCookies).toHaveBeenCalled();
  });
});
