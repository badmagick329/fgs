import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { jsonRequest, readJson } from '../test-utils';
import { setAuthCookies } from './mocks/admin-cookies.mock';
import {
  countAdmins,
  getAdminByEmail,
  verifyPassword,
} from './mocks/auth.mock';
const issueAdminSession = mock(
  async (_admin: { id: number; email: string }) => ({
    accessToken: 'a1',
    refreshToken: 'r1',
  })
);
mock.module('@/lib/serveronly/admin-session', () => ({ issueAdminSession }));

const route = await import('../../../src/app/api/admin/login/route');

describe('POST /api/admin/login', () => {
  beforeEach(() => {
    setAuthCookies.mockClear();

    countAdmins.mockClear();
    countAdmins.mockImplementation(async () => 1);

    getAdminByEmail.mockClear();
    getAdminByEmail.mockImplementation(async () => ({
      id: 1,
      email: 'admin@example.com',
      password_hash: 'hash',
    }));

    verifyPassword.mockClear();
    verifyPassword.mockImplementation(async () => true);

    issueAdminSession.mockClear();
    issueAdminSession.mockImplementation(async () => ({
      accessToken: 'a1',
      refreshToken: 'r1',
    }));
  });

  it('returns 400 when setup has not run', async () => {
    countAdmins.mockImplementation(async () => 0);

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/login', 'POST', {
        email: 'admin@example.com',
        password: 'password123',
      })
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(400);
    expect(body.message).toBe('No admins exist. Run setup first.');
  });

  it('returns 400 for invalid credentials body', async () => {
    countAdmins.mockImplementation(async () => 1);

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/login', 'POST', {
        email: 'bad-email',
      })
    );

    expect(res.status).toBe(400);
    expect(setAuthCookies).toHaveBeenCalledTimes(0);
  });

  it('returns 401 when admin is not found', async () => {
    getAdminByEmail.mockImplementation(async () => null);

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/login', 'POST', {
        email: 'admin@example.com',
        password: 'password123',
      })
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(401);
    expect(body.message).toBe('Invalid email or password.');
    expect(setAuthCookies).toHaveBeenCalledTimes(0);
  });

  it('returns 401 when password verification fails', async () => {
    verifyPassword.mockImplementation(async () => false);

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/login', 'POST', {
        email: 'admin@example.com',
        password: 'wrong-password',
      })
    );
    const body = await readJson<{ message: string }>(res);

    expect(res.status).toBe(401);
    expect(body.message).toBe('Invalid email or password.');
    expect(setAuthCookies).toHaveBeenCalledTimes(0);
  });

  it('returns 200 and sets cookies for valid credentials', async () => {
    countAdmins.mockImplementation(async () => 1);
    getAdminByEmail.mockImplementation(async () => ({
      id: 1,
      email: 'admin@example.com',
      password_hash: 'hash',
    }));
    verifyPassword.mockImplementation(async () => true);
    issueAdminSession.mockImplementation(async () => ({
      accessToken: 'a1',
      refreshToken: 'r1',
    }));

    const res = await route.POST(
      jsonRequest('http://localhost/api/admin/login', 'POST', {
        email: 'admin@example.com',
        password: 'password123',
      })
    );
    const body = await readJson<{ ok: boolean }>(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(issueAdminSession).toHaveBeenCalledTimes(1);
    expect(issueAdminSession).toHaveBeenCalledWith({
      id: 1,
      email: 'admin@example.com',
      password_hash: 'hash',
    });
    expect(setAuthCookies).toHaveBeenCalledTimes(1);
    expect(setAuthCookies).toHaveBeenCalledWith(res, 'a1', 'r1');
  });
});
