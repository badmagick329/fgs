import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from '@/lib/middleware/access-token';

const tokenVerifier = new AccessToken(process.env.ADMIN_JWT_SECRET ?? '');

const isProtectedPath = (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  if (pathname === '/registrations') return true;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return true;
  return false;
};

const isPublicPath = (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin/login')) return true;
  if (pathname.startsWith('/admin/setup')) return true;
  return false;
};

const copySetCookieHeaders = (from: Response, to: NextResponse) => {
  const header = from.headers.get('set-cookie');
  if (!header) return;
  const cookies = header.split(/,(?=[^;]+=[^;]+)/);
  cookies.forEach((cookie) => {
    to.headers.append('set-cookie', cookie);
  });
};

const redirectToLogin = (req: NextRequest) => {
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  return NextResponse.redirect(url);
};

function getInternalApiOrigin() {
  const configured = process.env.INTERNAL_API_ORIGIN?.trim();
  if (configured) return configured;
  const port = process.env.PORT ?? '3000';
  return `http://127.0.0.1:${port}`;
}

async function attemptRefresh(req: NextRequest) {
  const refreshUrl = new URL('/api/admin/refresh', getInternalApiOrigin());
  const refreshResponse = await fetch(refreshUrl, {
    method: 'POST',
    headers: {
      cookie: req.headers.get('cookie') ?? '',
    },
  });

  if (!refreshResponse.ok) {
    return null;
  }

  const next = NextResponse.next();
  copySetCookieHeaders(refreshResponse, next);
  return next;
}

export async function middleware(req: NextRequest) {
  if (isPublicPath(req)) {
    return NextResponse.next();
  }

  if (!isProtectedPath(req)) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get('admin_access')?.value;
  if (accessToken) {
    try {
      await tokenVerifier.verify(accessToken);
      return NextResponse.next();
    } catch {
      // fall through to refresh
    }
  }

  const refreshed = await attemptRefresh(req);
  if (refreshed) {
    return refreshed;
  }

  return redirectToLogin(req);
}

export const config = {
  matcher: ['/registrations', '/admin/:path*'],
};
