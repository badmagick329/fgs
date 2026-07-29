import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerContainer } from '@/lib/serveronly/container';

const notificationEmailSchema = z.object({
  notificationEmail: z.email({ error: 'Invalid email address' }),
});

const registrationDiscordNotificationsSchema = z.object({
  registrationDiscordNotificationsEnabled: z.boolean(),
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

export async function PATCH(req: Request) {
  const { adminAccessService, adminManagementService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth();
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const body = await req.json().catch(() => null);
  const parsed = registrationDiscordNotificationsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid Discord notification setting.' },
      { status: 400 }
    );
  }

  const config = await adminManagementService.setRegistrationDiscordNotificationsEnabled(
    parsed.data.registrationDiscordNotificationsEnabled,
    Number(auth.payload.sub)
  );
  if (!config) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Save a notification email before enabling Discord notifications.',
      },
      { status: 409 }
    );
  }

  const updatedConfig = await adminManagementService.getAdminConfig();
  const res = NextResponse.json({ ok: true, data: updatedConfig });
  adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}



