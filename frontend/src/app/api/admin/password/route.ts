import { adminPasswordChangeSchema } from '@/types';
import { NextResponse } from 'next/server';
import { getServerContainer } from '@/lib/serveronly/container';

export async function POST(req: Request) {
  const { adminAccessService, adminManagementService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth({
    clearCookies: true,
  });
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const body = await req.json().catch(() => null);
  const parsed = adminPasswordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid password change request.' },
      { status: 400 }
    );
  }

  const adminId = Number(auth.payload.sub);
  const passwordChangeResult = await adminManagementService.changePassword({
    adminId,
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
  });
  if (!passwordChangeResult.ok) {
    const res = NextResponse.json(
      { ok: false, message: passwordChangeResult.message },
      { status: passwordChangeResult.status }
    );
    adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  adminAccessService.clearAuthCookies(res);
  return res;
}



