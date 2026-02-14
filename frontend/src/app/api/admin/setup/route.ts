import { adminCredentialsSchema } from '@/types';
import { NextResponse } from 'next/server';
import { getServerContainer } from '@/lib/serveronly/container';

export async function POST(req: Request) {
  const { adminAccessService } = getServerContainer();

  const body = await req.json().catch(() => null);
  const parsed = adminCredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid credentials.' },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const setupResult = await adminAccessService.setupInitialAdmin({ email, password });
  if (!setupResult.ok) {
    return NextResponse.json(
      { ok: false, message: setupResult.message },
      { status: setupResult.status }
    );
  }

  const res = NextResponse.json({ ok: true });
  adminAccessService.setAuthCookies(
    res,
    setupResult.tokens.accessToken,
    setupResult.tokens.refreshToken
  );
  return res;
}



