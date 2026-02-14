import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerContainer } from '@/lib/serveronly/container';

const notificationEmailSchema = z.object({
  notificationEmail: z.email({ error: 'Invalid email address' }),
});

export async function GET() {
  const { adminAccessService, adminManagementService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth();
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const config = await adminManagementService.getAdminConfig();
  const res = NextResponse.json({ ok: true, data: config });
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
  const parsed = notificationEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid email address.' },
      { status: 400 }
    );
  }

  await adminManagementService.upsertAdminConfig(
    parsed.data.notificationEmail,
    Number(auth.payload.sub)
  );
  const config = await adminManagementService.getAdminConfig();
  const res = NextResponse.json({ ok: true, data: config });
  adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}



