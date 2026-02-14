import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));

const getServerContainer = mock(() => ({}));
mock.module('@/lib/serveronly/container', () => ({
  getServerContainer,
}));

import { POST } from '@/app/api/admin/login/route';

describe('/api/admin/login', () => {
  beforeEach(() => {
    mock.restore();
    getServerContainer.mockReset();
  });

  it('returns 400 when no admins exist', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: { countAdmins: mock(async () => 0) },
    });

    const res = await POST(new Request('http://localhost', { method: 'POST' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBeFalse();
  });

  it('sets auth cookies on success', async () => {
    const setAuthCookies = mock(() => {});
    getServerContainer.mockReturnValue({
      adminAccessService: {
        countAdmins: mock(async () => 1),
        login: mock(async () => ({
          ok: true,
          tokens: { accessToken: 'a', refreshToken: 'r' },
        })),
        setAuthCookies,
      },
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(setAuthCookies).toHaveBeenCalled();
  });
});
