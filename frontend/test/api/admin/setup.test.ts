import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { jsonRequest, readJson } from '../test-utils';
import { setAuthCookies } from './mocks/admin-cookies.mock';
import { countAdmins, createAdminUser } from './mocks/auth.mock';
const issueAdminSession = mock(
  async (_admin: { id: number; email: string }) => ({
    accessToken: 'a1',
    refreshToken: 'r1',
  })
);
mock.module('@/lib/serveronly/admin-session', () => ({ issueAdminSession }));

const route = await import('../../../src/app/api/admin/setup/route');

describe('POST /api/admin/setup', () => {
  beforeEach(() => {
    setAuthCookies.mockClear();

    countAdmins.mockClear();
    countAdmins.mockImplementation(async () => 1);

    createAdminUser.mockClear();
    createAdminUser.mockImplementation(async () => ({
      id: 1,
      email: 'admin@example.com',
    }));

    issueAdminSession.mockClear();
    issueAdminSession.mockImplementation(async () => ({
      accessToken: 'a1',
      refreshToken: 'r1',
    }));
  });

  it('returns 400 when admin already exists', async () => {
    countAdmins.mockImplementation(async () => 1);

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/setup', 'POST', {
        email: 'admin@example.com',
        password: 'password123',
      })
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(400);
    expect(body.message).toBe('Admin already exists.');
    expect(createAdminUser).toHaveBeenCalledTimes(0);
    expect(setAuthCookies).toHaveBeenCalledTimes(0);
  });

  it('returns 400 for invalid credentials body', async () => {
    countAdmins.mockImplementation(async () => 0);

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/setup', 'POST', {
        email: 'bad-email',
      })
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(400);
    expect(body.message).toBe('Invalid credentials.');
    expect(createAdminUser).toHaveBeenCalledTimes(0);
    expect(issueAdminSession).toHaveBeenCalledTimes(0);
    expect(setAuthCookies).toHaveBeenCalledTimes(0);
  });

  it('returns 200 and sets cookies on successful setup', async () => {
    countAdmins.mockImplementation(async () => 0);

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/setup', 'POST', {
        email: 'admin@example.com',
        password: 'password123',
      })
    );
    const body = await readJson<{ ok: boolean }>(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(createAdminUser).toHaveBeenCalledTimes(1);
    expect(createAdminUser).toHaveBeenCalledWith(
      'admin@example.com',
      'password123',
      true
    );
    expect(issueAdminSession).toHaveBeenCalledTimes(1);
    expect(issueAdminSession).toHaveBeenCalledWith({
      id: 1,
      email: 'admin@example.com',
    });
    expect(setAuthCookies).toHaveBeenCalledTimes(1);
    expect(setAuthCookies).toHaveBeenCalledWith(res, 'a1', 'r1');
  });
});
