import { POST } from '@/app/api/admin/setup/route';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/server/container', () => ({ getServerContainer }));

const validBody = {
  email: 'admin@example.com',
  password: 'password123',
  setupToken: 'setup-token',
};

describe('/api/admin/setup', () => {
  beforeEach(() => {
    mock.restore();
    getServerContainer.mockReset();
  });

  it('returns 404 without touching setup when no setup token is configured', async () => {
    const setupInitialAdmin = mock(async () => ({ ok: true }));
    getServerContainer.mockReturnValue({
      adminAccessService: {
        isSetupEnabled: () => false,
        setupInitialAdmin,
      },
    });

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(validBody),
      })
    );

    expect(res.status).toBe(404);
    expect(setupInitialAdmin).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid credentials body', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: { isSetupEnabled: () => true },
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'bad' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when the setup token is missing', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: { isSetupEnabled: () => true },
    });

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          email: validBody.email,
          password: validBody.password,
        }),
      })
    );

    expect(res.status).toBe(400);
  });

  it('passes the service status through on a wrong token', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: {
        isSetupEnabled: () => true,
        setupInitialAdmin: mock(async () => ({
          ok: false,
          status: 403,
          message: 'Invalid setup token.',
        })),
      },
    });

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(validBody),
      })
    );

    expect(res.status).toBe(403);
  });

  it('sets auth cookies on setup success', async () => {
    const setAuthCookies = mock(() => {});
    const setupInitialAdmin = mock(async () => ({
      ok: true,
      tokens: { accessToken: 'a', refreshToken: 'r' },
    }));
    getServerContainer.mockReturnValue({
      adminAccessService: {
        isSetupEnabled: () => true,
        setupInitialAdmin,
        setAuthCookies,
      },
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(setupInitialAdmin).toHaveBeenCalledWith(validBody);
    expect(setAuthCookies).toHaveBeenCalled();
  });
});
