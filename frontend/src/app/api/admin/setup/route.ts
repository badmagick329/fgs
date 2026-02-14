import { adminCredentialsSchema } from '@/types';
import { NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/serveronly/auth/admin-cookies';
import { issueAdminSession } from '@/lib/serveronly/auth/admin-session';
import { createAdminUser } from '@/lib/serveronly/db';
import { countAdmins } from '@/lib/serveronly/db';

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
  const admin = await createAdminUser(email, password, true);
  const { accessToken, refreshToken } = await issueAdminSession(admin);

  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, accessToken, refreshToken);
  return res;
}
