import {
  applyRefreshedAuthCookies,
  getAdminRouteAuth,
  unauthorizedJson,
} from '@/lib/serveronly/admin-route-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await getAdminRouteAuth();
  if (!auth.payload) {
    return unauthorizedJson({ clearCookies: auth.needsClear });
  }

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
