import { AdminAccessService } from '@/features/admin/application/admin-access-service';
import { LoginThrottle } from '@/features/admin/infrastructure/login-throttle';
import {
  createAdminRepositoryMock,
  createCookieMock,
  createPasswordHasherMock,
} from '@/test/mock-factories';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { NextResponse } from 'next/server';

describe('AdminAccessService', () => {
  beforeEach(() => {
    mock.restore();
  });

  function makeService(overrides?: {
    repo?: any;
    hasher?: any;
    cookie?: any;
    auth?: any;
    issuer?: any;
    throttle?: any;
    setupToken?: any;
  }) {
    const repo = overrides?.repo ?? createAdminRepositoryMock();
    const hasher = overrides?.hasher ?? createPasswordHasherMock();
    const cookie = overrides?.cookie ?? createCookieMock();
    const auth =
      overrides?.auth ??
      ({
        getRouteAuth: mock(async () => ({
          payload: null,
          refreshedTokens: null,
          needsClear: true,
        })),
      } as any);
    const issuer =
      overrides?.issuer ??
      ({
        issueAdminSession: mock(async () => ({
          accessToken: 'a',
          refreshToken: 'r',
        })),
        refreshSession: mock(async () => null),
        revokeRefreshTokenFromRawToken: mock(async () => {}),
      } as any);
    const throttle =
      overrides?.throttle ??
      new LoginThrottle({ now: () => new Date(), nowMs: () => Date.now() });
    const setupToken = overrides?.setupToken ?? {
      isEnabled: () => true,
      matches: (candidate: string) => candidate === 'setup-token',
    };

    return {
      service: new AdminAccessService(
        repo,
        hasher,
        cookie,
        auth,
        issuer,
        throttle,
        setupToken
      ),
      repo,
      hasher,
      cookie,
      auth,
      issuer,
      throttle,
    };
  }

  const existingAdmin = {
    id: 1,
    email: 'x@x.com',
    password_hash: 'real-hash',
  };

  it('login fails for missing admin', async () => {
    const { service } = makeService();
    const result = await service.login({
      email: 'x@x.com',
      password: 'password',
      clientIp: '203.0.113.1',
    });
    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.status).toBe(401);
  });

  it('login runs bcrypt against a dummy hash for unknown emails', async () => {
    const hasher = createPasswordHasherMock({
      hashPassword: mock(async () => 'dummy-hash'),
      verifyPassword: mock(async () => true),
    });
    const { service } = makeService({ hasher });

    const result = await service.login({
      email: 'nobody@x.com',
      password: 'password',
      clientIp: '203.0.113.1',
    });
    await service.login({
      email: 'nobody2@x.com',
      password: 'password',
      clientIp: '203.0.113.1',
    });

    // Even a "matching" dummy compare must not log anyone in.
    expect(result.ok).toBeFalse();
    expect(hasher.verifyPassword).toHaveBeenCalledWith(
      'password',
      'dummy-hash'
    );
    expect(hasher.verifyPassword).toHaveBeenCalledTimes(2);
    // The dummy is built once and reused.
    expect(hasher.hashPassword).toHaveBeenCalledTimes(1);
  });

  it('login succeeds for valid credentials', async () => {
    const repo = createAdminRepositoryMock({
      getAdminByEmail: mock(async () => existingAdmin),
    });
    const hasher = createPasswordHasherMock({
      verifyPassword: mock(async () => true),
    });
    const { service } = makeService({ repo, hasher });
    const result = await service.login({
      email: 'x@x.com',
      password: 'password',
      clientIp: '203.0.113.1',
    });
    expect(result.ok).toBeTrue();
    expect(hasher.verifyPassword).toHaveBeenCalledWith('password', 'real-hash');
  });

  it('login locks an email out after five failures, before checking bcrypt', async () => {
    const repo = createAdminRepositoryMock({
      getAdminByEmail: mock(async () => existingAdmin),
    });
    const hasher = createPasswordHasherMock({
      verifyPassword: mock(async () => false),
    });
    const { service } = makeService({ repo, hasher });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await service.login({
        email: 'X@x.com',
        password: 'wrong-password',
        clientIp: `203.0.113.${attempt}`,
      });
      expect(result.ok).toBeFalse();
      if (!result.ok) expect(result.status).toBe(401);
    }

    // Different case and a new IP: the email key is normalised.
    hasher.verifyPassword = mock(async () => true);
    const locked = await service.login({
      email: ' x@X.com ',
      password: 'right-password',
      clientIp: '198.51.100.9',
    });

    expect(locked.ok).toBeFalse();
    if (!locked.ok && locked.status === 429) {
      expect(locked.retryAfterSeconds).toBeGreaterThan(0);
    } else {
      throw new Error('expected a 429');
    }
    expect(hasher.verifyPassword).not.toHaveBeenCalled();
  });

  it('a successful login clears the email failure count', async () => {
    const repo = createAdminRepositoryMock({
      getAdminByEmail: mock(async () => existingAdmin),
    });
    let passwordIsRight = false;
    const hasher = createPasswordHasherMock({
      verifyPassword: mock(async () => passwordIsRight),
    });
    const { service } = makeService({ repo, hasher });
    const attempt = () =>
      service.login({
        email: 'x@x.com',
        password: 'password',
        clientIp: '203.0.113.1',
      });

    for (let i = 0; i < 4; i += 1) await attempt();
    passwordIsRight = true;
    expect((await attempt()).ok).toBeTrue();
    passwordIsRight = false;
    for (let i = 0; i < 4; i += 1) await attempt();

    const fifthFailureSinceSuccess = await attempt();
    expect(fifthFailureSinceSuccess.ok).toBeFalse();
    if (!fifthFailureSinceSuccess.ok) {
      expect(fifthFailureSinceSuccess.status).toBe(401);
    }
  });

  it('setup rejects a wrong setup token before touching the database', async () => {
    const repo = createAdminRepositoryMock();
    const { service } = makeService({ repo });
    const result = await service.setupInitialAdmin({
      email: 'x@x.com',
      password: 'password',
      setupToken: 'guess',
    });
    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.status).toBe(403);
    expect(repo.createFirstAdminUser).not.toHaveBeenCalled();
  });

  it('setup blocks when admin exists', async () => {
    const repo = createAdminRepositoryMock({
      countAdmins: mock(async () => 1),
    });
    const { service } = makeService({ repo });
    const result = await service.setupInitialAdmin({
      email: 'x@x.com',
      password: 'password',
      setupToken: 'setup-token',
    });
    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.status).toBe(400);
  });

  it('setup fails when a concurrent setup created the first admin', async () => {
    const repo = createAdminRepositoryMock({
      countAdmins: mock(async () => 0),
      createFirstAdminUser: mock(async () => null),
    });
    const { service, issuer } = makeService({ repo });
    const result = await service.setupInitialAdmin({
      email: 'x@x.com',
      password: 'password',
      setupToken: 'setup-token',
    });
    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.status).toBe(400);
    expect(issuer.issueAdminSession).not.toHaveBeenCalled();
  });

  it('setup creates the first admin and issues a session', async () => {
    const { service, repo, issuer } = makeService();
    const result = await service.setupInitialAdmin({
      email: 'x@x.com',
      password: 'password',
      setupToken: 'setup-token',
    });
    expect(result.ok).toBeTrue();
    expect(repo.createFirstAdminUser).toHaveBeenCalledWith(
      'x@x.com',
      'hashed-password'
    );
    expect(issuer.issueAdminSession).toHaveBeenCalled();
  });

  it('requireAdminRouteAuth returns unauthorized response', async () => {
    const cookie = createCookieMock();
    const auth = {
      getRouteAuth: mock(async () => ({
        payload: null,
        refreshedTokens: null,
        needsClear: true,
      })),
    };
    const { service } = makeService({ cookie, auth });

    const result = await service.requireAdminRouteAuth();

    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.response.status).toBe(401);
    expect(cookie.clearAuthCookies).toHaveBeenCalled();
  });

  it('applyRefreshedAuthCookies sets cookies when refreshed tokens exist', () => {
    const cookie = createCookieMock();
    const { service } = makeService({ cookie });
    const res = NextResponse.json({ ok: true });

    service.applyRefreshedAuthCookies(res, {
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    expect(cookie.setAuthCookies).toHaveBeenCalledWith(
      res,
      'access',
      'refresh'
    );
  });
});
