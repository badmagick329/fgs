import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  applyRefreshedAuthCookies,
  getAdminRouteAuth,
  unauthorizedJson,
} from '@/lib/serveronly/admin-route-auth';
import { getAdminConfig, upsertAdminConfig } from '@/lib/serveronly/auth';

const notificationEmailSchema = z.object({
  notificationEmail: z.email({ error: 'Invalid email address' }),
});

export async function GET() {
  const auth = await getAdminRouteAuth();
  if (!auth.payload) {
    return unauthorizedJson({ clearCookies: auth.needsClear });
  }

  const config = await getAdminConfig();
  const res = NextResponse.json({ ok: true, data: config });
  applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}

export async function POST(req: Request) {
  const auth = await getAdminRouteAuth();
  if (!auth.payload) {
    return unauthorizedJson({ clearCookies: auth.needsClear });
  }

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
