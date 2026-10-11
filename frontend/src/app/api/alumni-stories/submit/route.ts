import {
  SubmittedAlumniStory,
  UPLOAD_TOKEN_HEADER,
} from '@/features/alumni-stories/domain/alumni-story';
import { NextResponse } from 'next/server';
import { Result } from '@/lib/result';
import { getServerContainer } from '@/lib/server/container';

/** Hands a finished draft to the admins, once its uploads are done. */
export async function POST(
  req: Request
): Promise<NextResponse<Result<SubmittedAlumniStory>>> {
  const token = req.headers.get(UPLOAD_TOKEN_HEADER);
  if (!token) {
    return NextResponse.json(
      { ok: false as const, message: 'Upload token is missing' },
      { status: 403 }
    );
  }

  const result =
    await getServerContainer().alumniStoryService.submitWithUploadToken(token);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false as const, message: result.message },
      { status: result.error === 'empty-story' ? 422 : 403 }
    );
  }
  return NextResponse.json({
    ok: true as const,
    data: { storyId: result.data.id },
  });
}
