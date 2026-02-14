import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import { AUTH_COOKIE_KEYS, ENV_KEYS, ROUTES } from '@/lib/consts';

process.env.ADMIN_JWT_SECRET = 'secret';
process.env[ENV_KEYS.internalApiOrigin] = 'http://127.0.0.1:3000';

async function loadMiddlewareModule() {
  return import('@/middleware');
}

describe('middleware', () => {
  beforeEach(() => {
    mock.restore();
  });

  it('recognizes public and protected paths', async () => {
    const { isProtectedPath, isPublicPath } = await loadMiddlewareModule();
    const publicReq = new NextRequest(`http://localhost${ROUTES.admin.login}`);
    const protectedReq = new NextRequest(`http://localhost${ROUTES.admin.users}`);

    expect(isPublicPath(publicReq)).toBeTrue();
    expect(isProtectedPath(protectedReq)).toBeTrue();
  });

  it('attemptRefresh forwards set-cookie headers on success', async () => {
    const { attemptRefresh } = await loadMiddlewareModule();
    const req = new NextRequest('http://localhost/admin', {
      headers: { cookie: `${AUTH_COOKIE_KEYS.refresh}=abc` },
    });

    spyOn(global, 'fetch' as never).mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: {
          'set-cookie': `${AUTH_COOKIE_KEYS.access}=a; Path=/, ${AUTH_COOKIE_KEYS.refresh}=b; Path=/`,
        },
      }) as any
    );

    const refreshed = await attemptRefresh(req);

    expect(refreshed).toBeDefined();
    expect(refreshed?.headers.get('set-cookie')).toContain(
      `${AUTH_COOKIE_KEYS.access}=a`
    );
  });

  it('bypasses middleware for public path', async () => {
    const { middleware } = await loadMiddlewareModule();
    const req = new NextRequest(`http://localhost${ROUTES.admin.login}`);
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it('returns next when access token verifies', async () => {
    const { middleware } = await loadMiddlewareModule();
    const token = await new SignJWT({ sub: '1', email: 'admin@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(new TextEncoder().encode('secret'));

    const req = new NextRequest('http://localhost/admin', {
      headers: { cookie: `${AUTH_COOKIE_KEYS.access}=${token}` },
    });

    const res = await middleware(req);

    expect(res.status).toBe(200);
  });

  it('redirects to login when refresh fails', async () => {
    const { middleware } = await loadMiddlewareModule();
    spyOn(global, 'fetch' as never).mockResolvedValue(
      new Response(null, { status: 401 }) as any
    );

    const req = new NextRequest('http://localhost/admin', {
      headers: { cookie: `${AUTH_COOKIE_KEYS.refresh}=old` },
    });

    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain(ROUTES.admin.login);
  });
});
