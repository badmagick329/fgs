import { AdminAlumniStoryDetail } from '@/features/alumni-stories/domain/alumni-story';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerContainer } from '@/lib/server/container';

const idSchema = z.coerce.number().int().positive();

export async function GET(
  _req: Request,
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

  const found = await alumniStoryService.getWithMedia(id.data);
  if (!found) return respond({ ok: false, message: 'Story not found.' }, 404);

  const data: AdminAlumniStoryDetail = {
    story: found.story,
    media: found.media.map(({ storage_key: _key, ...media }) => media),
  };
  return respond({ ok: true, data });
}
