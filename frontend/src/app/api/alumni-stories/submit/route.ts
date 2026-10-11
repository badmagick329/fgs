import { SITE_URL } from '@/app/_site-v2/metadata';
import {
  SubmittedAlumniStory,
  UPLOAD_TOKEN_HEADER,
} from '@/features/alumni-stories/domain/alumni-story';
import { NextResponse } from 'next/server';
import { ROUTES } from '@/lib/consts';
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

  const { alumniStoryService, notifier } = getServerContainer();
  const result = await alumniStoryService.submitWithUploadToken(token);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false as const, message: result.message },
      { status: result.error === 'empty-story' ? 422 : 403 }
    );
  }

  // Not awaited: the alumnus's submission stands even if Discord is down.
  // The message leaves out personal details; admins open the link for them.
  const story = result.data;
  void notifier
    .sendMessage({
      source: 'alumni-story.submitted',
      message: `Alumni story #${story.id} submitted (class of ${story.graduation_year}). Review: ${SITE_URL}${ROUTES.admin.alumniStories}/${story.id}`,
    })
    .catch((error) => {
      console.error('alumni story Discord notification failed', error);
    });

  return NextResponse.json({
    ok: true as const,
    data: { storyId: result.data.id },
  });
}
