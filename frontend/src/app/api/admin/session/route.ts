import {
  applyRefreshedAuthCookies,
  requireAdminRouteAuth,
} from '@/lib/serveronly/admin-route-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const authResult = await requireAdminRouteAuth();
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const res = NextResponse.json({
    ok: true,
    data: {
      id: auth.payload.sub,
      email: auth.payload.email,
    },
  });

  applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}
