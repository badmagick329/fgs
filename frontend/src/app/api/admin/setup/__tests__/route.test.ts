import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/serveronly/container', () => ({ getServerContainer }));

import { POST } from '@/app/api/admin/setup/route';

describe('/api/admin/setup', () => {
  beforeEach(() => {
    mock.restore();
    getServerContainer.mockReset();
  });

  it('returns 400 on invalid credentials body', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: {},
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'bad' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('sets auth cookies on setup success', async () => {
    const setAuthCookies = mock(() => {});
    getServerContainer.mockReturnValue({
      adminAccessService: {
        setupInitialAdmin: mock(async () => ({
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
