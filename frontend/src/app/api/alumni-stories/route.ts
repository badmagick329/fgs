import { createAlumniStoryDraftSchema } from '@/features/alumni-stories/domain/alumni-story';
import { NextResponse } from 'next/server';
import { Result, errorsFromZod } from '@/lib/result';
import { getClientIp } from '@/lib/server/client-ip';
import { getServerContainer } from '@/lib/server/container';
import { errorMessageFromErrors } from '@/lib/utils';

export type CreatedAlumniStoryDraft = {
  storyId: number;
  uploadToken: string;
  uploadTokenExpiresAt: string;
};

/** Starts an alumni story: saves the details and issues an upload token. */
export async function POST(
  req: Request
): Promise<NextResponse<Result<CreatedAlumniStoryDraft>>> {
  const { alumniStoryService, alumniStoryDraftRateLimiter } =
    getServerContainer();

  if (!alumniStoryDraftRateLimiter.allow(getClientIp(req))) {
    return NextResponse.json(
      {
        ok: false as const,
        message:
          'Too many attempts from this network. Please try again in a few minutes.',
      },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createAlumniStoryDraftSchema.safeParse(body);
  if (!parsed.success) {
    const errors = errorsFromZod(parsed.error);
    return NextResponse.json(
      { ok: false as const, message: errorMessageFromErrors(errors), errors },
      { status: 400 }
    );
  }

  const { story, uploadToken, uploadTokenExpiresAt } =
    await alumniStoryService.createDraft(parsed.data);
  return NextResponse.json(
    {
      ok: true as const,
      data: {
        storyId: story.id,
        uploadToken,
        uploadTokenExpiresAt: uploadTokenExpiresAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
