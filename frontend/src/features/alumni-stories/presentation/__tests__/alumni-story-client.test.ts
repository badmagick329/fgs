import {
  createAlumniStoryDraft,
  uploadOutcomeFromError,
} from '@/features/alumni-stories/presentation/alumni-story-client';
import { afterEach, describe, expect, it, spyOn } from 'bun:test';

const tusError = (status: number | null) =>
  Object.assign(new Error('tus: failed'), {
    originalResponse: status === null ? null : { getStatus: () => status },
  });

const details = {
  fullName: 'Ayesha Khan',
  graduationYear: 2010,
  profession: 'Commercial pilot',
  phone: '03001234567',
  email: null,
  storyText: null,
};

describe('alumni story client', () => {
  let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it('treats lost connections and server errors as resumable', () => {
    expect(uploadOutcomeFromError(tusError(null))).toEqual({
      outcome: 'interrupted',
    });
    expect(uploadOutcomeFromError(tusError(502))).toEqual({
      outcome: 'interrupted',
    });
  });

  it('refuses for good on the statuses the upload server uses', () => {
    for (const status of [403, 413, 415, 422, 507]) {
      const outcome = uploadOutcomeFromError(tusError(status));
      expect(outcome).toMatchObject({ outcome: 'refused', status });
    }
    expect(uploadOutcomeFromError(tusError(413))).toMatchObject({
      message: expect.stringContaining('300 MB'),
    });
  });

  it('returns the server’s field errors for refused details', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json(
        {
          ok: false,
          message: 'Enter a valid phone number',
          errors: [{ field: 'phone', message: 'Enter a valid phone number' }],
        },
        { status: 400 }
      )
    );

    const result = await createAlumniStoryDraft(details, 'captcha-token');

    expect(result).toMatchObject({
      ok: false,
      errors: [{ field: 'phone' }],
    });
    const [, init] = fetchSpy.mock.calls[0];
    // Null optional fields are left out: the draft schema accepts a string or
    // nothing.
    const body = JSON.parse(String(init?.body));
    expect(body).not.toHaveProperty('storyText');
    expect(body).not.toHaveProperty('email');
    expect(body.phone).toBe('03001234567');
    expect(body.captchaToken).toBe('captcha-token');
  });

  it('reports an unreachable server instead of throwing', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('Failed to fetch')
    );

    const result = await createAlumniStoryDraft(details, 'captcha-token');

    expect(result).toMatchObject({ ok: false });
  });
});
