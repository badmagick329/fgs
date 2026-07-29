import { Registration, createRegistrationSchema } from '@/types';
import { NextResponse } from 'next/server';
import { API } from '@/lib/consts';
import { normalizeRegistrationCampus } from '@/lib/registration';
import { Result, errorsFromZod } from '@/lib/result';
import { getServerContainer } from '@/lib/serveronly/container';
import { errorMessageFromErrors } from '@/lib/utils';

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

export async function GET() {
  const { adminAccessService, registrationService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth({
    clearCookies: false,
  });
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const result = await registrationService.getRegistrations();
  if (!result.ok) {
    console.error('getRegistrations validation error', result.errors);
    await registrationService.notifyDiscord({
      source: `GET ${API.register}`,
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
    adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  }

  const res = NextResponse.json(result, { status: 200 });
  adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}

export async function POST(
  req: Request
): Promise<NextResponse<Result<Registration>>> {
  const {
    registrationService,
    registrationAntiSpamService,
    adminManagementService,
  } = getServerContainer();

  const clientIp = getClientIp(req);
  const rateLimitResult = registrationAntiSpamService.checkRateLimit({
    ip: clientIp,
    route: API.register,
  });
  if (!rateLimitResult.ok) {
    return NextResponse.json(
      {
        ok: false as const,
        message: rateLimitResult.message,
      },
      { status: rateLimitResult.status }
    );
  }

  const rawBody = await req.json().catch(() => {});
  const body =
    rawBody != null && typeof rawBody === 'object' && !Array.isArray(rawBody)
      ? {
          ...rawBody,
          campus: normalizeRegistrationCampus(rawBody.campus),
        }
      : rawBody;
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

  const honeypotResult = registrationAntiSpamService.checkHoneypot(
    createdParsed.data.honeypot
  );
  if (!honeypotResult.ok) {
    return NextResponse.json(
      {
        ok: false as const,
        message: honeypotResult.message,
      },
      { status: honeypotResult.status }
    );
  }

  const submitTimeResult = registrationAntiSpamService.checkMinimumSubmitTime(
    createdParsed.data.formStartedAt
  );
  if (!submitTimeResult.ok) {
    return NextResponse.json(
      {
        ok: false as const,
        message: submitTimeResult.message,
      },
      { status: submitTimeResult.status }
    );
  }

  const payloadCooldownResult =
    registrationAntiSpamService.checkPayloadCooldown({
      studentName: createdParsed.data.studentName,
      parentName: createdParsed.data.parentName,
      className: createdParsed.data.className,
      mobileNumber: createdParsed.data.mobileNumber,
      campus: createdParsed.data.campus,
      preferredAppointmentAt: createdParsed.data.preferredAppointmentAt,
    });
  if (!payloadCooldownResult.ok) {
    return NextResponse.json(
      {
        ok: false as const,
        message: payloadCooldownResult.message,
      },
      { status: payloadCooldownResult.status }
    );
  }

  const creationResult = await registrationService.createRegistration({
    studentName: createdParsed.data.studentName,
    parentName: createdParsed.data.parentName,
    className: createdParsed.data.className,
    mobileNumber: createdParsed.data.mobileNumber,
    campus: createdParsed.data.campus,
    preferredAppointmentAt: createdParsed.data.preferredAppointmentAt,
  });

  if (!creationResult.ok) {
    registrationService.notifyDiscord({
      source: `POST ${API.register}`,
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

  registrationAntiSpamService.markPayloadSubmitted({
    studentName: createdParsed.data.studentName,
    parentName: createdParsed.data.parentName,
    className: createdParsed.data.className,
    mobileNumber: createdParsed.data.mobileNumber,
    campus: createdParsed.data.campus,
    preferredAppointmentAt: createdParsed.data.preferredAppointmentAt,
  });

  try {
    if (await adminManagementService.areRegistrationDiscordNotificationsEnabled()) {
      const registration = creationResult.data;
      void registrationService
        .notifyDiscord({
          source: 'registration.created',
          message: `Registration #${registration.id} created. Campus: ${registration.campus}. Preferred appointment: ${registration.preferred_appointment_at.toISOString()}. Email status: ${registration.email_status}.`,
        })
        .catch((error) => {
          console.error('registration Discord notification failed', error);
        });
    }
  } catch (error) {
    console.error('registration Discord notification setting check failed', error);
  }

  return NextResponse.json(creationResult, { status: 201 });
}
