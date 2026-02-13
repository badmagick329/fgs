import { Registration, createRegistrationSchema } from '@/types';
import { NextResponse } from 'next/server';
import { createRegistration, getRegistrations } from '@/lib/db';
import { Result, errorsFromZod } from '@/lib/result';
import {
  applyRefreshedAuthCookies,
  requireAdminRouteAuth,
} from '@/lib/serveronly/admin-route-auth';
import { sendDiscordMessage } from '@/lib/serveronly/discord-messenger';
import { errorMessageFromErrors } from '@/lib/utils';

export async function GET() {
  const authResult = await requireAdminRouteAuth({ clearCookies: false });
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const result = await getRegistrations();
  if (!result.ok) {
    console.error('getRegistrations validation error', result.errors);
    await sendDiscordMessage({
      source: 'GET /api/register',
      message: `getRegistrations failed with error: ${result.message}`,
    });

    const res = NextResponse.json(
      {
        ok: false as const,
        message:
          'There was an error parsing the data. Admin has been notified.',
        errors: result.errors,
      },
      { status: 500 }
    );
    applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  }
  const res = NextResponse.json(result, { status: 200 });
  applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}

export async function POST(
  req: Request
): Promise<NextResponse<Result<Registration>>> {
  const body = await req.json().catch(() => {});

  const createdParsed = createRegistrationSchema.safeParse(body);
  if (!createdParsed.success) {
    const errors = errorsFromZod(createdParsed.error);
    return NextResponse.json(
      {
        ok: false as const,
        message: errorMessageFromErrors(errors),
        errors,
      },
      { status: 400 }
    );
  }

  const { firstName, lastName, email } = createdParsed.data;
  const creationResult = await createRegistration({
    firstName,
    lastName,
    email,
  });
  if (!creationResult.ok) {
    sendDiscordMessage({
      source: 'POST /api/register',
      message: `createRegistration failed with error: ${creationResult.message}`,
    });

    return NextResponse.json(
      {
        ok: false as const,
        message: 'The server is currently down. Please try again later.',
      },
      { status: 500 }
    );
  }
  return NextResponse.json(creationResult, { status: 201 });
}
