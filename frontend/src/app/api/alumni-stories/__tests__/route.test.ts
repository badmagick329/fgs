import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/server/container', () => ({ getServerContainer }));

const { POST } = await import('@/app/api/alumni-stories/route');
type CaptchaOutcome = import('@/lib/server/i-captcha-verifier').CaptchaOutcome;

const details = {
  fullName: 'Ayesha Khan',
  graduationYear: 2010,
  profession: 'Commercial pilot',
  phone: '03001234567',
};
const validBody = { ...details, captchaToken: 'captcha-token' };

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/alumni-stories', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.7' },
      body: JSON.stringify(body),
    })
  );

describe('POST /api/alumni-stories', () => {
  const createDraft = mock(async () => ({
    story: { id: 12 },
    uploadToken: 'token',
    uploadTokenExpiresAt: new Date('2026-10-12T10:00:00Z'),
  }));
  const allow = mock((_ip: string) => true);
  const verify = mock(
    async (_token: string, _ip: string): Promise<CaptchaOutcome> => 'passed'
  );

  beforeEach(() => {
    createDraft.mockClear();
    allow.mockReset();
    allow.mockReturnValue(true);
    verify.mockReset();
    verify.mockResolvedValue('passed');
    getServerContainer.mockReturnValue({
      alumniStoryService: { createDraft },
      alumniStoryDraftRateLimiter: { allow },
      alumniStoryCaptchaVerifier: { verify },
    });
  });

  it('creates a draft and returns its upload token', async () => {
    const res = await post(validBody);

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      ok: true,
      data: {
        storyId: 12,
        uploadToken: 'token',
        uploadTokenExpiresAt: '2026-10-12T10:00:00.000Z',
      },
    });
    expect(allow).toHaveBeenCalledWith('203.0.113.7');
    expect(verify).toHaveBeenCalledWith('captcha-token', '203.0.113.7');
    // The token is not part of the story.
    expect(createDraft).toHaveBeenCalledWith({
      ...details,
      email: null,
      storyText: null,
    });
  });

  it('refuses a failed or missing security check without creating a draft', async () => {
    verify.mockResolvedValue('failed');

    const failed = await post(validBody);
    const missing = await post(details);

    expect(failed.status).toBe(403);
    expect(missing.status).toBe(403);
    expect(verify).toHaveBeenLastCalledWith('', '203.0.113.7');
    expect(createDraft).not.toHaveBeenCalled();
  });

  it('returns 503 when the security check cannot run', async () => {
    verify.mockResolvedValue('unavailable');

    const res = await post(validBody);

    expect(res.status).toBe(503);
    expect(createDraft).not.toHaveBeenCalled();
  });

  it('returns 400 with field errors for an invalid body', async () => {
    const res = await post({ ...validBody, phone: 'call me' });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.errors[0].field).toBe('phone');
    // A single-use token is not spent on details that will be refused.
    expect(verify).not.toHaveBeenCalled();
    expect(createDraft).not.toHaveBeenCalled();
  });

  it('returns 429 once the network is over its limit', async () => {
    allow.mockReturnValue(false);

    const res = await post(validBody);

    expect(res.status).toBe(429);
    expect(createDraft).not.toHaveBeenCalled();
  });
});
