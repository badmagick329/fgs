import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/server/container', () => ({ getServerContainer }));

const { POST } = await import('@/app/api/alumni-stories/route');

const validBody = {
  fullName: 'Ayesha Khan',
  graduationYear: 2010,
  profession: 'Commercial pilot',
  contact: '03001234567',
};

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

  beforeEach(() => {
    createDraft.mockClear();
    allow.mockReset();
    allow.mockReturnValue(true);
    getServerContainer.mockReturnValue({
      alumniStoryService: { createDraft },
      alumniStoryDraftRateLimiter: { allow },
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
    expect(createDraft).toHaveBeenCalledWith({ ...validBody, storyText: null });
  });

  it('returns 400 with field errors for an invalid body', async () => {
    const res = await post({ ...validBody, contact: 'call me' });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.errors[0].field).toBe('contact');
    expect(createDraft).not.toHaveBeenCalled();
  });

  it('returns 429 once the network is over its limit', async () => {
    allow.mockReturnValue(false);

    const res = await post(validBody);

    expect(res.status).toBe(429);
    expect(createDraft).not.toHaveBeenCalled();
  });
});
