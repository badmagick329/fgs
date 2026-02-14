import { NextResponse } from 'next/server';
import { getServerContainer } from '@/lib/serveronly/container';

export async function GET() {
  const { adminAccessService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth();
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

  adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}



