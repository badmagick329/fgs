import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/serveronly/container', () => ({ getServerContainer }));

import { GET } from '@/app/api/admin/session/route';

describe('/api/admin/session', () => {
  beforeEach(() => {
    mock.restore();
    getServerContainer.mockReset();
  });

  it('returns unauthorized response passthrough', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: false,
          response: new Response(null, { status: 401 }),
        })),
      },
    });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns session data on success', async () => {
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
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.email).toBe('admin@example.com');
    expect(applyRefreshedAuthCookies).toHaveBeenCalled();
  });
});
