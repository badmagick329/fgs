import { reviewAlumniStorySchema } from '@/features/alumni-stories/domain/alumni-story';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerContainer } from '@/lib/server/container';

const idSchema = z.coerce.number().int().positive();

/**
 * Approves or rejects a submitted story as the signed-in admin. Admins can
 * change their mind, so a reviewed story can be reviewed again.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { adminAccessService, alumniStoryService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth();
  if (!authResult.ok) return authResult.response;
  const auth = authResult.auth;

  const respond = (body: object, status = 200) => {
    const res = NextResponse.json(body, { status });
    adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  };

  const id = idSchema.safeParse((await context.params).id);
  if (!id.success) return respond({ ok: false, message: 'Invalid id.' }, 400);

  const body = reviewAlumniStorySchema.safeParse(
    await req.json().catch(() => null)
  );
  if (!body.success) {
    return respond(
      { ok: false, message: 'decision must be approved or rejected.' },
      400
    );
  }

  const result = await alumniStoryService.review(
    id.data,
    body.data.decision,
    Number(auth.payload.sub)
  );
  if (!result.ok) {
    return respond(
      { ok: false, message: result.message },
      result.error === 'not-found' ? 404 : 409
    );
  }
  return respond({ ok: true, data: result.data });
}
