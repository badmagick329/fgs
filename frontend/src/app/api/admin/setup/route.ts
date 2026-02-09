import { adminCredentialsSchema } from '@/types';
import {
  countAdmins,
  createAdminUser,
  createRefreshToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
} from '@/lib/serveronly/auth';
import { signAccessToken } from '@/lib/auth/jwt';
import { NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/serveronly/admin-cookies';

export async function POST(req: Request) {
  const adminCount = await countAdmins();
  if (adminCount > 0) {
    return NextResponse.json(
      { ok: false, message: 'Admin already exists.' },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = adminCredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid credentials.' },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const admin = await createAdminUser(email, password);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  await createRefreshToken(admin.id, tokenHash, refreshTokenExpiresAt());
  const accessToken = await signAccessToken({
    sub: String(admin.id),
    email: admin.email,
  });

  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, accessToken, refreshToken);
  return res;
}
