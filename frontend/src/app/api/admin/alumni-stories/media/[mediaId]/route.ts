import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseByteRange } from '@/lib/server/byte-range';
import { getServerContainer } from '@/lib/server/container';

const idSchema = z.coerce.number().int().positive();

/** Quoted ASCII fallback plus the RFC 5987 form, for emoji and Urdu names. */
function contentDisposition(type: 'inline' | 'attachment', filename: string) {
  const ascii = filename.replace(/[^\x20-\x7e]|["\\]/g, '_');
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/**
 * Serves an uploaded original to signed-in admins. Range support lets the
 * browser's video player seek without fetching the whole file first;
 * `?download=1` saves the file under the alumnus's original name.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ mediaId: string }> }
) {
  const { adminAccessService, alumniStoryService } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth();
  if (!authResult.ok) return authResult.response;
  const auth = authResult.auth;

  const respond = (res: NextResponse) => {
    adminAccessService.applyRefreshedAuthCookies(res, auth.refreshedTokens);
    return res;
  };
  const notFound = () =>
    respond(
      NextResponse.json(
        { ok: false, message: 'Media not found.' },
        { status: 404 }
      )
    );

  const id = idSchema.safeParse((await context.params).mediaId);
  if (!id.success) return notFound();
  const media = await alumniStoryService.getMedia(id.data);
  if (!media) return notFound();

  const size = media.size_bytes;
  const range = parseByteRange(req.headers.get('range'), size);
  if (range === 'unsatisfiable') {
    return respond(
      new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${size}` },
      })
    );
  }

  const body = await alumniStoryService
    .readMedia(media, range ?? undefined)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
  if (!body) return notFound();

  const download = new URL(req.url).searchParams.get('download') === '1';
  const filename =
    media.original_filename ?? `alumni-story-${media.story_id}-${media.id}`;
  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, no-store',
    'Content-Disposition': contentDisposition(
      download ? 'attachment' : 'inline',
      filename
    ),
    'Content-Length': String(range ? range.end - range.start + 1 : size),
    'Content-Type': media.mime_type,
    'X-Content-Type-Options': 'nosniff',
  });
  if (range) {
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
  }
  return respond(
    new NextResponse(body, { status: range ? 206 : 200, headers })
  );
}
