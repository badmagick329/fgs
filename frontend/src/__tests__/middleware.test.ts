import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import { ADMIN_ACCESS_KEY, ADMIN_REFRESH_KEY } from '@/lib/consts';

process.env.ADMIN_JWT_SECRET = 'secret';
process.env.INTERNAL_API_ORIGIN = 'http://127.0.0.1:3000';

async function loadMiddlewareModule() {
  return import('@/middleware');
}

describe('middleware', () => {
  beforeEach(() => {
    mock.restore();
  });

  it('recognizes public and protected paths', async () => {
    const { isProtectedPath, isPublicPath } = await loadMiddlewareModule();
    const publicReq = new NextRequest('http://localhost/admin/login');
    const protectedReq = new NextRequest('http://localhost/admin/users');

    expect(isPublicPath(publicReq)).toBeTrue();
    expect(isProtectedPath(protectedReq)).toBeTrue();
  });

  it('attemptRefresh forwards set-cookie headers on success', async () => {
    const { attemptRefresh } = await loadMiddlewareModule();
    const req = new NextRequest('http://localhost/admin', {
      headers: { cookie: `${ADMIN_REFRESH_KEY}=abc` },
    });

    spyOn(global, 'fetch' as never).mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: {
          'set-cookie': `${ADMIN_ACCESS_KEY}=a; Path=/, ${ADMIN_REFRESH_KEY}=b; Path=/`,
        },
      }) as any
    );

    const refreshed = await attemptRefresh(req);

    expect(refreshed).toBeDefined();
    expect(refreshed?.headers.get('set-cookie')).toContain(
      `${ADMIN_ACCESS_KEY}=a`
    );
  });

  it('bypasses middleware for public path', async () => {
    const { middleware } = await loadMiddlewareModule();
    const req = new NextRequest('http://localhost/admin/login');
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
      headers: { cookie: `${ADMIN_ACCESS_KEY}=${token}` },
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
      headers: { cookie: `${ADMIN_REFRESH_KEY}=old` },
    });

    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin/login');
  });
});
