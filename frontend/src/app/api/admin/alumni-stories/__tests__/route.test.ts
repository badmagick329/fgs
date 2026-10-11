import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/server/container', () => ({ getServerContainer }));

const { GET: list } = await import('@/app/api/admin/alumni-stories/route');
const { GET: detail } =
  await import('@/app/api/admin/alumni-stories/[id]/route');

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

const listUrl = (query = '') =>
  new Request(`http://localhost/api/admin/alumni-stories${query}`);
const detailOf = (id: string) =>
  detail(new Request(`http://localhost/api/admin/alumni-stories/${id}`), {
    params: Promise.resolve({ id }),
  });

describe('admin alumni story routes', () => {
  beforeEach(() => {
    listByStatus.mockClear();
    getServerContainer.mockReturnValue({
      adminAccessService: signedIn,
      alumniStoryService: { listByStatus, getWithMedia },
    });
  });

  it('refuses both routes without an admin session', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: signedOut,
      alumniStoryService: { listByStatus, getWithMedia },
    });

    expect((await list(listUrl())).status).toBe(401);
    expect((await detailOf('3')).status).toBe(401);
    expect(listByStatus).not.toHaveBeenCalled();
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
});
