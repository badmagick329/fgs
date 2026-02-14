import { adminCredentialsSchema } from '@/types';
import { NextResponse } from 'next/server';
import { getServerContainer } from '@/lib/serveronly/container';

export async function GET() {
  const { adminAccessService, adminManagementService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth();
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const listResult = await adminManagementService.listAdminsView({
    currentAdminId: Number(auth.payload.sub),
  });
  if (!listResult.ok) {
    return adminAccessService.unauthorizedJson({ clearCookies: true });
  }

  const res = NextResponse.json({ ok: true, data: listResult.data });
  adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}

export async function POST(req: Request) {
  const { adminAccessService, adminManagementService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth();
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const body = await req.json().catch(() => null);
  const parsed = adminCredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid credentials.' },
      { status: 400 }
    );
  }

  const createResult = await adminManagementService.createAdminWithGuard({
    actingAdminId: Number(auth.payload.sub),
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (!createResult.ok) {
    const res = NextResponse.json(
      { ok: false, message: createResult.message },
      { status: createResult.status }
    );
    adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}



