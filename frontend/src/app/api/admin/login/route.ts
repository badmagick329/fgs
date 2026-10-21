import { adminCredentialsSchema } from '@/features/admin/domain/admin';
import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/server/client-ip';
import { getServerContainer } from '@/lib/server/container';

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
  const loginResult = await adminAccessService.login({
    email,
    password,
    clientIp: getClientIp(req),
  });
  if (!loginResult.ok) {
    return NextResponse.json(
      { ok: false, message: loginResult.message },
      {
        status: loginResult.status,
        headers:
          loginResult.status === 429
            ? { 'Retry-After': String(loginResult.retryAfterSeconds) }
            : undefined,
      }
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
