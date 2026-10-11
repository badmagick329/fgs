import {
  CreatedAlumniStoryDraft,
  createAlumniStoryDraftSchema,
} from '@/features/alumni-stories/domain/alumni-story';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { Result, errorsFromZod } from '@/lib/result';
import { getClientIp } from '@/lib/server/client-ip';
import { getServerContainer } from '@/lib/server/container';
import { errorMessageFromErrors } from '@/lib/utils';

/** Turnstile tokens are at most 2048 characters. */
const captchaSchema = z.object({
  captchaToken: z.string().max(2048).catch(''),
});

const CAPTCHA_ERRORS = {
  failed: {
    status: 403,
    message: 'The security check did not pass. Please complete it again.',
  },
  unavailable: {
    status: 503,
    message:
      'We could not run the security check. Please try again in a minute.',
  },
} as const;

/**
 * Starts an alumni story: saves the details and issues an upload token. The
 * Turnstile check guards this step only: the upload token it unlocks caps
 * what the story can upload.
 */
export async function POST(
  req: Request
): Promise<NextResponse<Result<CreatedAlumniStoryDraft>>> {
  const {
    alumniStoryService,
    alumniStoryDraftRateLimiter,
    alumniStoryCaptchaVerifier,
  } = getServerContainer();

  const clientIp = getClientIp(req);
  if (!alumniStoryDraftRateLimiter.allow(clientIp)) {
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

  // After the details pass: a token is single-use, so checking it first
  // would make the alumnus redo the challenge for a typo.
  const { captchaToken } = captchaSchema.parse(body);
  const captcha = await alumniStoryCaptchaVerifier.verify(
    captchaToken,
    clientIp
  );
  if (captcha !== 'passed') {
    const { status, message } = CAPTCHA_ERRORS[captcha];
    return NextResponse.json({ ok: false as const, message }, { status });
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
