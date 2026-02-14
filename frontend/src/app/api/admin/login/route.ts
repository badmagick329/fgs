import { adminCredentialsSchema } from '@/types';
import { NextResponse } from 'next/server';
import { getServerContainer } from '@/lib/serveronly/container';

export async function POST(req: Request) {
  const { adminAccessService } = getServerContainer();
  const adminCount = await adminAccessService.countAdmins();
  if (adminCount === 0) {
    return NextResponse.json(
      { ok: false, message: 'No admins exist. Run setup first.' },
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
  const loginResult = await adminAccessService.login({ email, password });
  if (!loginResult.ok) {
    return NextResponse.json(
      { ok: false, message: loginResult.message },
      { status: loginResult.status }
    );
  }

  const res = NextResponse.json({ ok: true });
  adminAccessService.setAuthCookies(
    res,
    loginResult.tokens.accessToken,
    loginResult.tokens.refreshToken
  );
  return res;
}




