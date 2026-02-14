import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { AdminActionError } from '@/types/auth';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/serveronly/container', () => ({ getServerContainer }));

import { DELETE, PATCH } from '@/app/api/admin/users/[id]/route';

describe('/api/admin/users/[id]', () => {
  beforeEach(() => {
    mock.restore();
    getServerContainer.mockReset();
  });

  it('returns 400 for invalid id on PATCH', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: true,
          auth: { payload: { sub: '1', email: 'a@a.com' }, refreshedTokens: null },
        })),
      },
      adminManagementService: {},
    });

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ isSuperAdmin: true }),
    });
    const res = await PATCH(req, { params: { id: 'abc' } });

    expect(res.status).toBe(400);
  });

  it('maps AdminActionError for DELETE', async () => {
    const applyRefreshedAuthCookies = mock(() => {});
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: true,
          auth: { payload: { sub: '1', email: 'a@a.com' }, refreshedTokens: null },
        })),
        applyRefreshedAuthCookies,
      },
      adminManagementService: {
        removeAdminUserWithGuards: mock(async () => {
          throw new AdminActionError('Only super admins can remove admins.', 403);
        }),
      },
    });

    const res = await DELETE(new Request('http://localhost', { method: 'DELETE' }), {
      params: { id: '2' },
    });

    expect(res.status).toBe(403);
    expect(applyRefreshedAuthCookies).toHaveBeenCalled();
  });
});
