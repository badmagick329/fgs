import { adminSetupSchema } from '@/features/admin/domain/admin';
import { NextResponse } from 'next/server';
import { getServerContainer } from '@/lib/server/container';

export async function POST(req: Request) {
  const { adminAccessService } = getServerContainer();
  // Without a configured token the endpoint does not exist, so a fresh
  // deployment cannot be claimed by whoever finds it first.
  if (!adminAccessService.isSetupEnabled()) {
    return NextResponse.json(
      { ok: false, message: 'Not found.' },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = adminSetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid credentials.' },
      { status: 400 }
    );
  }

  const { email, password, setupToken } = parsed.data;
  const setupResult = await adminAccessService.setupInitialAdmin({
    email,
    password,
    setupToken,
  });
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
