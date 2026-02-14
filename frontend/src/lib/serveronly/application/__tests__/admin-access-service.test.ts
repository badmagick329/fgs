import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { NextResponse } from 'next/server';
import { AdminAccessService } from '@/lib/serveronly/application/admin-access-service';
import {
  createAdminRepositoryMock,
  createCookieMock,
  createPasswordHasherMock,
} from '@/test/mock-factories';

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
  }) {
    const repo = overrides?.repo ?? createAdminRepositoryMock();
    const hasher = overrides?.hasher ?? createPasswordHasherMock();
    const cookie = overrides?.cookie ?? createCookieMock();
    const auth =
      overrides?.auth ?? ({ getRouteAuth: mock(async () => ({ payload: null, refreshedTokens: null, needsClear: true })) } as any);
    const issuer =
      overrides?.issuer ??
      ({
        issueAdminSession: mock(async () => ({ accessToken: 'a', refreshToken: 'r' })),
        refreshSession: mock(async () => null),
        revokeRefreshTokenFromRawToken: mock(async () => {}),
      } as any);

    return {
      service: new AdminAccessService(repo, hasher, cookie, auth, issuer),
      repo,
      hasher,
      cookie,
      auth,
      issuer,
    };
  }

  it('login fails for missing admin', async () => {
    const { service } = makeService();
    const result = await service.login({ email: 'x@x.com', password: 'password' });
    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.status).toBe(401);
  });

  it('login succeeds for valid credentials', async () => {
    const repo = createAdminRepositoryMock({
      getAdminByEmail: mock(async () => ({ id: 1, email: 'x@x.com', password_hash: 'hash' })),
    });
    const hasher = createPasswordHasherMock({ verifyPassword: mock(async () => true) });
    const { service } = makeService({ repo, hasher });
    const result = await service.login({ email: 'x@x.com', password: 'password' });
    expect(result.ok).toBeTrue();
  });

  it('setup blocks when admin exists', async () => {
    const repo = createAdminRepositoryMock({ countAdmins: mock(async () => 1) });
    const { service } = makeService({ repo });
    const result = await service.setupInitialAdmin({ email: 'x@x.com', password: 'password' });
    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.status).toBe(400);
  });

  it('requireAdminRouteAuth returns unauthorized response', async () => {
    const cookie = createCookieMock();
    const auth = { getRouteAuth: mock(async () => ({ payload: null, refreshedTokens: null, needsClear: true })) };
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

    expect(cookie.setAuthCookies).toHaveBeenCalledWith(res, 'access', 'refresh');
  });
});
