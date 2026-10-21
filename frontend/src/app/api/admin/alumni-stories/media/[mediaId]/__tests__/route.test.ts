import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/server/container', () => ({ getServerContainer }));

const { GET } =
  await import('@/app/api/admin/alumni-stories/media/[mediaId]/route');
const { LocalMediaStore } =
  await import('@/features/alumni-stories/infrastructure/local-media-store');

const fileBytes = Uint8Array.from({ length: 1000 }, (_, i) => i % 251);

const media = {
  id: 7,
  story_id: 3,
  kind: 'video' as const,
  variant: 'original' as const,
  storage_key: 'stories/3/clip.mp4',
  mime_type: 'video/mp4',
  size_bytes: fileBytes.length,
  original_filename: 'Ayesha 🎓.mp4',
  created_at: new Date(),
};

const signedIn = {
  requireAdminRouteAuth: mock(async () => ({
    ok: true,
    auth: { payload: { sub: '1' }, refreshedTokens: null },
  })),
  applyRefreshedAuthCookies: mock(() => undefined),
};

const get = (headers: Record<string, string> = {}, query = '', id = '7') =>
  GET(
    new Request(
      `http://localhost/api/admin/alumni-stories/media/${id}${query}`,
      {
        headers,
      }
    ),
    { params: Promise.resolve({ mediaId: id }) }
  );

describe('GET /api/admin/alumni-stories/media/[mediaId]', () => {
  let mediaRoot: string;
  let store: InstanceType<typeof LocalMediaStore>;

  beforeAll(async () => {
    mediaRoot = await mkdtemp(path.join(tmpdir(), 'fgs-media-route-'));
    store = new LocalMediaStore(mediaRoot);
    await store.put(media.storage_key, new Blob([fileBytes]).stream());
  });

  afterAll(async () => {
    await rm(mediaRoot, { recursive: true, force: true });
  });

  beforeEach(() => {
    getServerContainer.mockReturnValue({
      adminAccessService: signedIn,
      alumniStoryService: {
        getSubmittedMedia: async (id: number) =>
          id === media.id ? media : null,
        readMedia: (
          found: typeof media,
          range?: { start: number; end: number }
        ) => store.read(found.storage_key, range),
      },
    });
  });

  it('refuses a request without an admin session', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: async () => ({
          ok: false,
          response: Response.json({ ok: false }, { status: 401 }),
        }),
      },
      alumniStoryService: {},
    });

    expect((await get()).status).toBe(401);
  });

  it('answers a Range request with 206 and exactly those bytes', async () => {
    const res = await get({ range: 'bytes=100-299' });

    expect(res.status).toBe(206);
    expect(res.headers.get('content-range')).toBe('bytes 100-299/1000');
    expect(res.headers.get('content-length')).toBe('200');
    expect(res.headers.get('accept-ranges')).toBe('bytes');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(
      fileBytes.slice(100, 300)
    );
  });

  it('serves the whole file inline, or as a download on request', async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('video/mp4');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(fileBytes);
    expect(res.headers.get('content-disposition')).toStartWith('inline;');

    const download = await get({}, '?download=1');
    expect(download.headers.get('content-disposition')).toBe(
      `attachment; filename="Ayesha __.mp4"; filename*=UTF-8''${encodeURIComponent('Ayesha 🎓.mp4')}`
    );
  });

  it('returns 416 past the end and 404 for unknown media', async () => {
    const past = await get({ range: 'bytes=1000-' });
    expect(past.status).toBe(416);
    expect(past.headers.get('content-range')).toBe('bytes */1000');

    expect((await get({}, '', '99')).status).toBe(404);
    expect((await get({}, '', 'abc')).status).toBe(404);
  });
});
