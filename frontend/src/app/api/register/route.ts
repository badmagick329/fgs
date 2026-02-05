import { Registration, createRegistrationSchema } from '@/types';
import { NextResponse } from 'next/server';
import { createRegistration, getRegistrations } from '@/lib/db';
import { Result, errorsFromZod } from '@/lib/result';
import { sendDiscordMessage } from '@/lib/serveronly/discord-messenger';
import { errorMessageFromErrors } from '@/lib/utils';

export async function GET(): Promise<NextResponse<Result<Registration[]>>> {
  const result = await getRegistrations();
  if (!result.ok) {
    console.error('getRegistrations validation error', result.errors);
    await sendDiscordMessage({
      source: 'GET /api/register',
      message: `getRegistrations failed with error: ${result.message}`,
    });

    return NextResponse.json(
      {
        ok: false,
        message:
          'There was an error parsing the data. Admin has been notified.',
        errors: result.errors,
      },
      { status: 500 }
    );
  }
  return NextResponse.json(result, { status: 200 });
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
        ok: false,
        message: errorMessageFromErrors(errors),
        errors,
      },
      { status: 400 }
    );
  }

  const { firstName, lastName, email } = createdParsed.data;
  // TODO: temp tester. remove later
  const testName = discordTestName();
  if (testName && firstName === testName) {
    sendDiscordMessage({
      source: 'POST /api/register',
      message: `Received registration with name: ${firstName} ${lastName}. This is a test message triggered by TEST_DISCORD_STRING env variable.`,
    });
    return NextResponse.json(
      {
        ok: false,
        message: 'sent test error',
      },
      { status: 400 }
    );
  }

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
        ok: false,
        message: 'The server is currently down. Please try again later.',
      },
      { status: 500 }
    );
  }
  return NextResponse.json(creationResult, { status: 201 });
}

const discordTestName = () => process.env.TEST_DISCORD_STRING;
