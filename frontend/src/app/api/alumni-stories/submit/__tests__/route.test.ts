import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/server/container', () => ({ getServerContainer }));

const { POST } = await import('@/app/api/alumni-stories/submit/route');

const post = (token?: string) =>
  POST(
    new Request('http://localhost/api/alumni-stories/submit', {
      method: 'POST',
      headers: token ? { 'X-Upload-Token': token } : {},
    })
  );

describe('POST /api/alumni-stories/submit', () => {
  const submitWithUploadToken = mock(
    async (
      _token: string
    ): Promise<
      | { ok: true; data: { id: number; graduation_year: number } }
      | { ok: false; error: string; message: string }
    > => ({ ok: true, data: { id: 12, graduation_year: 2010 } })
  );
  const sendMessage = mock(
    async (_input: { source: string; message: string }) => ({})
  );

  beforeEach(() => {
    submitWithUploadToken.mockClear();
    sendMessage.mockClear();
    getServerContainer.mockReturnValue({
      alumniStoryService: { submitWithUploadToken },
      notifier: { sendMessage },
    });
  });

  it('submits the draft the token belongs to', async () => {
    const res = await post('token');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, data: { storyId: 12 } });
    expect(submitWithUploadToken).toHaveBeenCalledWith('token');
  });

  it('tells the admins on Discord without sending personal details', async () => {
    await post('token');

    expect(sendMessage.mock.calls).toEqual([
      [
        {
          source: 'alumni-story.submitted',
          message:
            'Alumni story #12 submitted (class of 2010). Review: https://farooqigrammar.school/admin/alumni-stories/12',
        },
      ],
    ]);
  });

  it('still accepts the submission when Discord fails', async () => {
    sendMessage.mockRejectedValueOnce(new Error('down'));

    expect((await post('token')).status).toBe(200);
  });

  it('refuses a request without a token', async () => {
    const res = await post();

    expect(res.status).toBe(403);
    expect(submitWithUploadToken).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('refuses a dead token and an empty story with different statuses', async () => {
    submitWithUploadToken.mockResolvedValueOnce({
      ok: false,
      error: 'not-draft',
      message: 'expired',
    });
    expect((await post('old')).status).toBe(403);

    submitWithUploadToken.mockResolvedValueOnce({
      ok: false,
      error: 'empty-story',
      message: 'Add your story',
    });
    const empty = await post('token');
    expect(empty.status).toBe(422);
    expect((await empty.json()).message).toBe('Add your story');
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
