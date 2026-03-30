import { NextResponse } from 'next/server';
import { API } from '@/lib/consts';
import { getServerContainer } from '@/lib/serveronly/container';

export async function GET() {
  const { adminAccessService, registrationService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth({
    clearCookies: false,
  });
  if (!authResult.ok) {
    return authResult.response;
  }
  const auth = authResult.auth;

  const result = await registrationService.getEmailWorkerStatus();
  if (!result.ok) {
    await registrationService.notifyDiscord({
      source: `GET ${API.registerStatus}`,
      message: `getEmailWorkerStatus failed with error: ${result.message}`,
    });

    const res = NextResponse.json(
      {
        ok: false as const,
        message: 'There was an error loading email worker status.',
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
