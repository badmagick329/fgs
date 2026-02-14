import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { AUTH_COOKIE_KEYS } from '@/lib/consts';

mock.module('server-only', () => ({}));
const cookiesMock = mock(async () => ({
  get: (name: string) =>
    name === AUTH_COOKIE_KEYS.refresh ? { value: 'r' } : undefined,
}));
mock.module('next/headers', () => ({ cookies: cookiesMock }));

const getServerContainer = mock(() => ({}));
mock.module('@/lib/serveronly/container', () => ({ getServerContainer }));

async function loadRoute() {
  return import('@/app/api/admin/logout/route');
}

describe('/api/admin/logout', () => {
  beforeEach(() => {
    mock.restore();
    getServerContainer.mockReset();
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === AUTH_COOKIE_KEYS.refresh ? { value: 'r' } : undefined,
    });
  });

  it('logs out and clears auth cookies', async () => {
    const { POST } = await loadRoute();
    const clearAuthCookies = mock(() => {});
    const logout = mock(async () => {});
    getServerContainer.mockReturnValue({
      adminAccessService: {
        logout,
        clearAuthCookies,
      },
    });

    const res = await POST();

    expect(res.status).toBe(200);
    expect(logout).toHaveBeenCalledWith('r');
    expect(clearAuthCookies).toHaveBeenCalled();
  });
});
