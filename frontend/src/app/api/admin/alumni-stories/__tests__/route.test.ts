import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/server/container', () => ({ getServerContainer }));

const { GET: list } = await import('@/app/api/admin/alumni-stories/route');
const { GET: detail, PATCH: choose } =
  await import('@/app/api/admin/alumni-stories/[id]/route');
const { POST: reviewRoute } =
  await import('@/app/api/admin/alumni-stories/[id]/review/route');
const { POST: createEditUpload } =
  await import('@/app/api/admin/alumni-stories/edited-video-uploads/[[...id]]/route');

const signedIn = {
  requireAdminRouteAuth: async () => ({
    ok: true,
    auth: { payload: { sub: '1' }, refreshedTokens: null },
  }),
  applyRefreshedAuthCookies: () => undefined,
};

const signedOut = {
  requireAdminRouteAuth: async () => ({
    ok: false,
    response: Response.json({ ok: false }, { status: 401 }),
  }),
};

const listByStatus = mock(async (_status: string) => [{ id: 1 }]);
const getWithMedia = mock(async (id: number) =>
  id === 3
    ? {
        story: { id: 3 },
        media: [{ id: 7, storage_key: 'stories/3/clip.mp4', kind: 'video' }],
      }
    : null
);

const choosePublicVideo = mock(async (id: number, variant: string) =>
  id === 3
    ? { ok: true, data: { id: 3, public_video_variant: variant } }
    : id === 5
      ? {
          ok: false,
          error: 'no-edited-video',
          message: 'Upload an edited video first',
        }
      : { ok: false, error: 'not-found', message: 'Story not found' }
);
const review = mock(async (id: number, decision: string, adminId: number) =>
  id === 3
    ? {
        ok: true,
        data: { id: 3, status: decision, reviewed_by_admin_user_id: adminId },
      }
    : id === 6
      ? {
          ok: false,
          error: 'not-reviewable',
          message: 'Drafts cannot be reviewed',
        }
      : { ok: false, error: 'not-found', message: 'Story not found' }
);
const editUploadServer = { handleWeb: mock(async () => new Response(null)) };

const chooseFor = (id: string, body: unknown) =>
  choose(
    new Request(`http://localhost/api/admin/alumni-stories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );

const reviewFor = (id: string, body: unknown) =>
  reviewRoute(
    new Request(`http://localhost/api/admin/alumni-stories/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );

const listUrl = (query = '') =>
  new Request(`http://localhost/api/admin/alumni-stories${query}`);
const detailOf = (id: string) =>
  detail(new Request(`http://localhost/api/admin/alumni-stories/${id}`), {
    params: Promise.resolve({ id }),
  });

describe('admin alumni story routes', () => {
  beforeEach(() => {
    listByStatus.mockClear();
    choosePublicVideo.mockClear();
    review.mockClear();
    editUploadServer.handleWeb.mockClear();
    getServerContainer.mockReturnValue({
      adminAccessService: signedIn,
      alumniStoryService: {
        listByStatus,
        getWithMedia,
        choosePublicVideo,
        review,
      },
      editedVideoUploads: { server: editUploadServer },
    });
  });

  it('refuses every route without an admin session', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: signedOut,
      alumniStoryService: {
        listByStatus,
        getWithMedia,
        choosePublicVideo,
        review,
      },
      editedVideoUploads: { server: editUploadServer },
    });

    expect((await list(listUrl())).status).toBe(401);
    expect((await detailOf('3')).status).toBe(401);
    expect(
      (await chooseFor('3', { publicVideoVariant: 'edited' })).status
    ).toBe(401);
    expect((await reviewFor('3', { decision: 'approved' })).status).toBe(401);
    const upload = await createEditUpload(
      new Request(
        'http://localhost/api/admin/alumni-stories/edited-video-uploads',
        { method: 'POST' }
      )
    );
    expect(upload.status).toBe(401);
    expect(listByStatus).not.toHaveBeenCalled();
    expect(choosePublicVideo).not.toHaveBeenCalled();
    expect(review).not.toHaveBeenCalled();
    expect(editUploadServer.handleWeb).not.toHaveBeenCalled();
  });

  it('lists pending stories unless another status is asked for', async () => {
    await list(listUrl());
    await list(listUrl('?status=approved'));

    expect(listByStatus.mock.calls).toEqual([['pending'], ['approved']]);
    expect((await list(listUrl('?status=draft'))).status).toBe(400);
  });

  it('returns a story without its media storage keys', async () => {
    const res = await detailOf('3');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      data: { story: { id: 3 }, media: [{ id: 7, kind: 'video' }] },
    });
    expect((await detailOf('4')).status).toBe(404);
    expect((await detailOf('x')).status).toBe(400);
  });

  it('picks the public video, refusing unknown variants and missing edits', async () => {
    const res = await chooseFor('3', { publicVideoVariant: 'edited' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      data: { id: 3, public_video_variant: 'edited' },
    });
    expect(choosePublicVideo.mock.calls).toEqual([[3, 'edited']]);

    expect(
      (await chooseFor('3', { publicVideoVariant: 'display' })).status
    ).toBe(400);
    expect(
      (await chooseFor('x', { publicVideoVariant: 'edited' })).status
    ).toBe(400);
    expect(
      (await chooseFor('5', { publicVideoVariant: 'edited' })).status
    ).toBe(409);
    expect(
      (await chooseFor('4', { publicVideoVariant: 'original' })).status
    ).toBe(404);
  });

  it('records the signed-in admin as the reviewer', async () => {
    const res = await reviewFor('3', { decision: 'rejected' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      data: { id: 3, status: 'rejected', reviewed_by_admin_user_id: 1 },
    });
    expect(review.mock.calls).toEqual([[3, 'rejected', 1]]);

    expect((await reviewFor('3', { decision: 'pending' })).status).toBe(400);
    expect((await reviewFor('x', { decision: 'approved' })).status).toBe(400);
    expect((await reviewFor('6', { decision: 'approved' })).status).toBe(409);
    expect((await reviewFor('4', { decision: 'approved' })).status).toBe(404);
  });
});
