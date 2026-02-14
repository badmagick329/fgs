import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { AUTH_COOKIE_KEYS } from '@/lib/consts';

mock.module('server-only', () => ({}));

const cookiesMock = mock(async () => ({
  get: (name: string) =>
    name === AUTH_COOKIE_KEYS.refresh ? { value: 'refresh-cookie' } : undefined,
}));
mock.module('next/headers', () => ({ cookies: cookiesMock }));

const getServerContainer = mock(() => ({}));
mock.module('@/lib/serveronly/container', () => ({ getServerContainer }));

import { POST } from '@/app/api/admin/refresh/route';

describe('/api/admin/refresh', () => {
  beforeEach(() => {
    mock.restore();
    getServerContainer.mockReset();
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === AUTH_COOKIE_KEYS.refresh ? { value: 'refresh-cookie' } : undefined,
    });
  });

  it('returns unauthorized when refresh fails', async () => {
    const unauthorizedJson = mock(() => new Response(null, { status: 401 }));
    getServerContainer.mockReturnValue({
      adminAccessService: {
        unauthorizedJson,
        refreshSession: mock(async () => null),
      },
    });

    const res = await POST();
    expect(res.status).toBe(401);
    expect(unauthorizedJson).toHaveBeenCalled();
  });

  it('returns ok and sets cookies on refresh success', async () => {
    const setAuthCookies = mock(() => {});
    getServerContainer.mockReturnValue({
      adminAccessService: {
        unauthorizedJson: mock(() => new Response(null, { status: 401 })),
        refreshSession: mock(async () => ({ accessToken: 'a', refreshToken: 'r' })),
        setAuthCookies,
      },
    });

    const res = await POST();

    expect(res.status).toBe(200);
    expect(setAuthCookies).toHaveBeenCalled();
  });
});
