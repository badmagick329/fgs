import { SUBMITTED_ALUMNI_STORY_STATUSES } from '@/features/alumni-stories/domain/alumni-story';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerContainer } from '@/lib/server/container';

const statusSchema = z.enum(SUBMITTED_ALUMNI_STORY_STATUSES).default('pending');

export async function GET(req: Request) {
  const { adminAccessService, alumniStoryService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth();
  if (!authResult.ok) return authResult.response;
  const auth = authResult.auth;

  const status = statusSchema.safeParse(
    new URL(req.url).searchParams.get('status') ?? undefined
  );
  if (!status.success) {
    const res = NextResponse.json(
      { ok: false, message: 'Unknown status.' },
      { status: 400 }
    );
    adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  }

  const stories = await alumniStoryService.listByStatus(status.data);
  const res = NextResponse.json({ ok: true, data: stories });
  adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
  return res;
}
