import { adminCredentialsSchema } from '@/types';
import { NextResponse } from 'next/server';
import {
  applyRefreshedAuthCookies,
  requireAdminRouteAuth,
  unauthorizedJson,
} from '@/lib/serveronly/auth/admin-route-auth';
import { listAdminUsers } from '@/lib/serveronly/db';
import { createAdminUser } from '@/lib/serveronly/db';
import { getAdminAuthById } from '@/lib/serveronly/db';

export async function GET() {
  const authResult = await requireAdminRouteAuth();
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const currentAdminId = Number(auth.payload.sub);
  const currentAdmin = await getAdminAuthById(currentAdminId);
  if (!currentAdmin) {
    return unauthorizedJson({ clearCookies: true });
  }

  const admins = await listAdminUsers();
  const res = NextResponse.json({
    ok: true,
    data: {
      currentAdminId,
      currentAdminEmail: currentAdmin.email,
      currentAdminIsSuperAdmin: currentAdmin.is_super_admin,
      admins: admins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        created_at: admin.created_at.toISOString(),
        is_super_admin: admin.is_super_admin,
      })),
    },
  });

  applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}

export async function POST(req: Request) {
  const authResult = await requireAdminRouteAuth();
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const actingAdminId = Number(auth.payload.sub);
  const actingAdmin = await getAdminAuthById(actingAdminId);
  if (!actingAdmin?.is_super_admin) {
    const res = NextResponse.json(
      { ok: false, message: 'Only super admins can create admins.' },
      { status: 403 }
    );
    applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  }

  const body = await req.json().catch(() => null);
  const parsed = adminCredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid credentials.' },
      { status: 400 }
    );
  }

  try {
    const { email, password } = parsed.data;
    await createAdminUser(email, password);
    const res = NextResponse.json({ ok: true });
    applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  } catch {
    const res = NextResponse.json(
      { ok: false, message: 'Unable to create admin.' },
      { status: 400 }
    );
    applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  }
}
