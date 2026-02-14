import { adminPasswordChangeSchema } from '@/types';
import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/serveronly/auth/admin-cookies';
import {
  applyRefreshedAuthCookies,
  requireAdminRouteAuth,
} from '@/lib/serveronly/auth/admin-route-auth';
import { verifyPassword } from '@/lib/serveronly/auth/common';
import { revokeAllRefreshTokensForUser } from '@/lib/serveronly/db';
import { updateAdminPassword } from '@/lib/serveronly/db';
import { getAdminById } from '@/lib/serveronly/db';

export async function POST(req: Request) {
  const authResult = await requireAdminRouteAuth({ clearCookies: true });
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
  const admin = await getAdminById(adminId);
  if (!admin) {
    const res = NextResponse.json(
      { ok: false, message: 'Unauthorized.' },
      { status: 401 }
    );
    applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  }

  const { currentPassword, newPassword } = parsed.data;
  const isValid = await verifyPassword(currentPassword, admin.password_hash);
  if (!isValid) {
    const res = NextResponse.json(
      { ok: false, message: 'Current password is incorrect.' },
      { status: 400 }
    );
    applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  }

  await updateAdminPassword(adminId, newPassword);
  await revokeAllRefreshTokensForUser(adminId);

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
