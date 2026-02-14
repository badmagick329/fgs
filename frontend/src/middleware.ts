import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from '@/lib/middleware/access-token';
import {
  API,
  AUTH_COOKIE_KEYS,
  ENV_DEFAULTS,
  ENV_KEYS,
  MIDDLEWARE_PATHS,
  ROUTES,
} from '@/lib/consts';

const tokenVerifier = new AccessToken(process.env.ADMIN_JWT_SECRET ?? '');

export const isProtectedPath = (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  if (pathname === ROUTES.registrations) return true;
  if (pathname === ROUTES.admin.root) return true;
  if (MIDDLEWARE_PATHS.protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) return true;
  return false;
};

export const isPublicPath = (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  if (MIDDLEWARE_PATHS.publicPrefixes.some((prefix) => pathname.startsWith(prefix))) return true;
  return false;
};

export const copySetCookieHeaders = (from: Response, to: NextResponse) => {
  const header = from.headers.get('set-cookie');
  if (!header) return;
  const cookies = header.split(/,(?=[^;]+=[^;]+)/);
  cookies.forEach((cookie) => {
    to.headers.append('set-cookie', cookie);
  });
};

const redirectToLogin = (req: NextRequest) => {
  const url = req.nextUrl.clone();
  url.pathname = ROUTES.admin.login;
  return NextResponse.redirect(url);
};

function getInternalApiOrigin() {
  const configured = process.env[ENV_KEYS.internalApiOrigin]?.trim();
  if (configured) return configured;
  const port = process.env[ENV_KEYS.port] ?? ENV_DEFAULTS.port;
  return `http://127.0.0.1:${port}`;
}

export async function attemptRefresh(req: NextRequest) {
  const refreshUrl = new URL(API.admin.refresh, getInternalApiOrigin());
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

  const accessToken = req.cookies.get(AUTH_COOKIE_KEYS.access)?.value;
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
