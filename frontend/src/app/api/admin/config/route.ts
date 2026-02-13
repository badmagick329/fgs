import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  applyRefreshedAuthCookies,
  requireAdminRouteAuth,
} from '@/lib/serveronly/admin-route-auth';
import { getAdminConfig, upsertAdminConfig } from '@/lib/serveronly/auth';

const notificationEmailSchema = z.object({
  notificationEmail: z.email({ error: 'Invalid email address' }),
});

export async function GET() {
  const authResult = await requireAdminRouteAuth();
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const config = await getAdminConfig();
  const res = NextResponse.json({ ok: true, data: config });
  applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}

export async function POST(req: Request) {
  const authResult = await requireAdminRouteAuth();
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

  await upsertAdminConfig(
    parsed.data.notificationEmail,
    Number(auth.payload.sub)
  );
  const config = await getAdminConfig();
  const res = NextResponse.json({ ok: true, data: config });
  applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}
