import { POST } from '@/app/api/admin/login/route';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));

const getServerContainer = mock(() => ({}));
mock.module('@/lib/server/container', () => ({
  getServerContainer,
}));

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
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(setAuthCookies).toHaveBeenCalled();
  });

  it('passes the client IP to login and answers a lockout with 429 and Retry-After', async () => {
    const login = mock(async () => ({
      ok: false,
      status: 429,
      message: 'Too many failed sign-in attempts. Try again later.',
      retryAfterSeconds: 600,
    }));
    getServerContainer.mockReturnValue({
      adminAccessService: { countAdmins: mock(async () => 1), login },
    });

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'x-forwarded-for': '203.0.113.7' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'password123',
        }),
      })
    );

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('600');
    expect(login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'password123',
      clientIp: '203.0.113.7',
    });
  });
});
