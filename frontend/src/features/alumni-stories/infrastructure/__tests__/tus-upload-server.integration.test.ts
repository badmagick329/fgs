import { UPLOAD_TOKEN_HEADER } from '@/features/alumni-stories/domain/alumni-story';
import {
  acquireGlobalTestDbLock,
  closePool,
  createTestPool,
  ensureSchema,
  releaseGlobalTestDbLock,
  resetTables,
} from '@/test/db-test-utils';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from 'bun:test';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PoolClient } from 'pg';

mock.module('server-only', () => ({}));

const { AlumniStoryRepository } =
  await import('@/features/alumni-stories/infrastructure/alumni-story-repository');
const { LocalMediaStore } =
  await import('@/features/alumni-stories/infrastructure/local-media-store');
const { AlumniStoryService } =
  await import('@/features/alumni-stories/application/alumni-story-service');
const { createAlumniStoryUploadEndpoints } =
  await import('@/features/alumni-stories/infrastructure/tus-upload-server');

class FakeClock {
  constructor(public ms: number) {}
  now() {
    return new Date(this.ms);
  }
  nowMs() {
    return this.ms;
  }
}

const GB = 1024 ** 3;
const ORIGIN = 'http://localhost';
const UPLOADS_URL = `${ORIGIN}/api/alumni-stories/uploads`;
const DAY_MS = 24 * 60 * 60 * 1000;

const draftInput = {
  fullName: 'Ayesha Khan',
  graduationYear: 2010,
  profession: 'Commercial pilot',
  phone: null,
  email: 'ayesha@example.com',
  storyText: null,
};

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

/** Bytes that start like a real MP4 (an `ftyp` box) followed by filler. */
const mp4Bytes = (size: number) => {
  const bytes = new Uint8Array(size).fill(7);
  bytes.set([0, 0, 0, 0x18, ...ascii('ftypisom'), 0, 0, 2, 0]);
  bytes.set(ascii('isomiso2'), 16);
  return bytes;
};

const jpegBytes = (size: number) => {
  const bytes = new Uint8Array(size).fill(7);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  return bytes;
};

const tusMetadata = (pairs: Record<string, string>) =>
  Object.entries(pairs)
    .map(([key, value]) => `${key} ${Buffer.from(value).toString('base64')}`)
    .join(',');

describe('Alumni story tus uploads integration', () => {
  const pool = createTestPool();
  const clock = new FakeClock(Date.parse('2026-10-11T10:00:00Z'));
  let lockClient: PoolClient;
  let mediaRoot: string;
  let incoming: string;
  let stories: InstanceType<typeof AlumniStoryService>;
  let mediaStore: InstanceType<typeof LocalMediaStore>;
  let uploads: ReturnType<
    typeof createAlumniStoryUploadEndpoints
  >['alumniStoryUploads'];
  let freeBytes: number;
  let alerts: { source: string; message: string }[];

  /** Endpoints over this test's folders; a second call models a restart. */
  const buildUploads = () =>
    createAlumniStoryUploadEndpoints({
      stories,
      directories: {
        alumniMedia: incoming,
        editedVideos: path.join(mediaRoot, '.incoming-edited'),
      },
      diskSpace: { freeBytes: async () => freeBytes },
      notifier: {
        sendMessage: async (input) => {
          alerts.push(input);
          return {};
        },
      },
      clock,
    }).alumniStoryUploads;

  const tus = (
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: BodyInit
  ) =>
    uploads.server.handleWeb(
      new Request(url, {
        method,
        headers: { 'Tus-Resumable': '1.0.0', ...headers },
        body,
        // Required by the fetch spec for streaming request bodies.
        duplex: 'half',
      } as RequestInit)
    );

  const create = (
    token: string | null,
    upload: { kind: string; length: number; filename?: string },
    extraMetadata: Record<string, string> = {}
  ) =>
    tus('POST', UPLOADS_URL, {
      ...(token ? { [UPLOAD_TOKEN_HEADER]: token } : {}),
      'Upload-Length': String(upload.length),
      'Upload-Metadata': tusMetadata({
        kind: upload.kind,
        ...(upload.filename ? { filename: upload.filename } : {}),
        ...extraMetadata,
      }),
    });

  const createOk = async (
    token: string,
    upload: { kind: string; length: number; filename?: string }
  ) => {
    const res = await create(token, upload);
    expect(res.status).toBe(201);
    return new URL(res.headers.get('location')!, ORIGIN).toString();
  };

  const patch = (url: string, token: string, offset: number, body: BodyInit) =>
    tus(
      'PATCH',
      url,
      {
        [UPLOAD_TOKEN_HEADER]: token,
        'Upload-Offset': String(offset),
        'Content-Type': 'application/offset+octet-stream',
      },
      body
    );

  const head = (url: string, token: string) =>
    tus('HEAD', url, { [UPLOAD_TOKEN_HEADER]: token });

  const stagedFiles = async () =>
    existsSync(incoming) ? await readdir(incoming) : [];

  beforeAll(async () => {
    lockClient = (await acquireGlobalTestDbLock(pool)) as PoolClient;
    await ensureSchema(pool);
  });

  beforeEach(async () => {
    await resetTables(pool);
    mediaRoot = await mkdtemp(path.join(tmpdir(), 'fgs-tus-'));
    incoming = path.join(mediaRoot, '.incoming');
    mediaStore = new LocalMediaStore(mediaRoot);
    stories = new AlumniStoryService(
      new AlumniStoryRepository(pool),
      mediaStore,
      clock
    );
    freeBytes = 100 * GB;
    alerts = [];
    uploads = buildUploads();
  });

  afterEach(async () => {
    await rm(mediaRoot, { recursive: true, force: true });
  });

  afterAll(async () => {
    await releaseGlobalTestDbLock(lockClient);
    await closePool(pool);
  });

  it('resumes an upload interrupted halfway and records it as media', async () => {
    const { story, uploadToken } = await stories.createDraft(draftInput);
    const video = mp4Bytes(64 * 1024);
    const url = await createOk(uploadToken, {
      kind: 'video',
      length: video.length,
      filename: 'clip.mp4',
    });

    // Only the first half arrives before the connection is lost. A body that
    // errors mid-stream would model the drop more closely, but tus reads it
    // through Readable.fromWeb, which under Bun 1.2 never reports the error
    // and hangs; Node, which runs production, keeps the received bytes.
    const interrupted = await patch(
      url,
      uploadToken,
      0,
      video.slice(0, video.length / 2)
    );
    expect(interrupted.status).toBe(204);
    expect(await stories.countOriginalMedia(story.id, 'video')).toBe(0);

    const status = await head(url, uploadToken);
    expect(status.status).toBe(200);
    const offset = Number(status.headers.get('upload-offset'));
    expect(offset).toBe(video.length / 2);

    const resumed = await patch(url, uploadToken, offset, video.slice(offset));
    expect(resumed.status).toBe(204);

    const found = await stories.getWithMedia(story.id);
    expect(found?.media).toHaveLength(1);
    expect(found?.media[0]).toMatchObject({
      kind: 'video',
      variant: 'original',
      mime_type: 'video/mp4',
      size_bytes: video.length,
      original_filename: 'clip.mp4',
    });
    const stored = await mediaStore.read(found!.media[0].storage_key);
    expect(new Uint8Array(await new Response(stored).arrayBuffer())).toEqual(
      video
    );
    expect(await stagedFiles()).toEqual([]);
  });

  it('refuses uploads without a live token for the draft', async () => {
    const owner = await stories.createDraft(draftInput);
    const other = await stories.createDraft(draftInput);

    expect((await create(null, { kind: 'photo', length: 10 })).status).toBe(
      403
    );
    expect(
      (await create('not-a-token', { kind: 'photo', length: 10 })).status
    ).toBe(403);

    const url = await createOk(owner.uploadToken, {
      kind: 'photo',
      length: 10,
    });
    expect((await head(url, other.uploadToken)).status).toBe(403);
    expect((await patch(url, other.uploadToken, 0, jpegBytes(10))).status).toBe(
      403
    );

    clock.ms += DAY_MS + 1;
    try {
      expect(
        (await patch(url, owner.uploadToken, 0, jpegBytes(10))).status
      ).toBe(403);
    } finally {
      clock.ms -= DAY_MS + 1;
    }
  });

  it('files an upload under the token’s draft, whatever the client claims', async () => {
    const owner = await stories.createDraft(draftInput);
    const victim = await stories.createDraft(draftInput);

    const res = await create(
      owner.uploadToken,
      { kind: 'photo', length: 10 },
      { storyId: String(victim.story.id) }
    );
    const url = new URL(res.headers.get('location')!, ORIGIN).toString();
    expect((await patch(url, owner.uploadToken, 0, jpegBytes(10))).status).toBe(
      204
    );

    expect(await stories.countOriginalMedia(owner.story.id, 'photo')).toBe(1);
    expect(await stories.countOriginalMedia(victim.story.id, 'photo')).toBe(0);
  });

  it('refuses files larger than their kind allows', async () => {
    const { uploadToken } = await stories.createDraft(draftInput);

    const photo = await create(uploadToken, {
      kind: 'photo',
      length: 15 * 1024 * 1024 + 1,
    });
    expect(photo.status).toBe(413);

    const video = await create(uploadToken, {
      kind: 'video',
      length: 300 * 1024 * 1024 + 1,
    });
    expect(video.status).toBe(413);
    expect(await stagedFiles()).toEqual([]);
  });

  it('refuses a finished file whose bytes are not its declared kind', async () => {
    const { story, uploadToken } = await stories.createDraft(draftInput);

    const pdf = new TextEncoder().encode('%PDF-1.7 not a photo at all');
    const pdfUrl = await createOk(uploadToken, {
      kind: 'photo',
      length: pdf.length,
    });
    const pdfRes = await patch(pdfUrl, uploadToken, 0, pdf);
    expect(pdfRes.status).toBe(415);

    const video = mp4Bytes(100);
    const videoAsPhotoUrl = await createOk(uploadToken, {
      kind: 'photo',
      length: video.length,
    });
    expect((await patch(videoAsPhotoUrl, uploadToken, 0, video)).status).toBe(
      415
    );

    expect(await stories.countOriginalMedia(story.id, 'photo')).toBe(0);
    expect(await stagedFiles()).toEqual([]);
    expect(existsSync(path.join(mediaRoot, 'stories'))).toBe(false);
  });

  it('replaces an unfinished upload and stops at the media limit', async () => {
    const { uploadToken } = await stories.createDraft(draftInput);

    const abandoned = await createOk(uploadToken, {
      kind: 'video',
      length: 100,
    });
    const replacement = await createOk(uploadToken, {
      kind: 'video',
      length: 100,
    });
    expect((await head(abandoned, uploadToken)).status).toBe(404);

    expect(
      (await patch(replacement, uploadToken, 0, mp4Bytes(100))).status
    ).toBe(204);
    expect(
      (await create(uploadToken, { kind: 'video', length: 100 })).status
    ).toBe(422);
  });

  it('refuses uploads that would cut into the free-space floor, alerting hourly', async () => {
    const first = await stories.createDraft(draftInput);
    const { uploadToken } = await stories.createDraft(draftInput);
    const video = 300 * 1024 * 1024;

    // Room for a photo but not for the video.
    freeBytes = 20 * GB + video - 1;
    expect(
      (await create(uploadToken, { kind: 'video', length: video })).status
    ).toBe(507);
    expect(
      (await create(uploadToken, { kind: 'photo', length: 10 })).status
    ).toBe(201);
    expect(alerts).toHaveLength(1);

    // The first photo still owes its 10 bytes, leaving no room for another.
    freeBytes = 20 * GB + 10;
    expect(
      (await create(first.uploadToken, { kind: 'photo', length: 10 })).status
    ).toBe(507);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ source: 'alumni-story.disk-low' });

    clock.ms += 60 * 60 * 1000;
    try {
      expect(
        (await create(uploadToken, { kind: 'photo', length: 10 })).status
      ).toBe(507);
      expect(alerts).toHaveLength(2);
    } finally {
      clock.ms -= 60 * 60 * 1000;
    }
  });

  it('admits only as many simultaneous uploads as the disk has room for', async () => {
    const drafts = await Promise.all(
      [1, 2, 3].map(() => stories.createDraft(draftInput))
    );
    const video = 300 * 1024 * 1024;
    freeBytes = 20 * GB + 2 * video + 1;

    const statuses = await Promise.all(
      drafts.map((draft) =>
        create(draft.uploadToken, { kind: 'video', length: video }).then(
          (res) => res.status
        )
      )
    );

    expect(statuses.sort()).toEqual([201, 201, 507]);
  });

  it('frees the room of a finished or terminated upload', async () => {
    const drafts = await Promise.all(
      [1, 2, 3].map(() => stories.createDraft(draftInput))
    );
    const [a, b, c] = drafts.map((draft) => draft.uploadToken);
    freeBytes = 20 * GB + 10;

    const first = await createOk(a, { kind: 'photo', length: 10 });
    expect((await create(b, { kind: 'photo', length: 10 })).status).toBe(507);

    expect((await patch(first, a, 0, jpegBytes(10))).status).toBe(204);
    const second = await createOk(b, { kind: 'photo', length: 10 });
    expect((await create(c, { kind: 'photo', length: 10 })).status).toBe(507);

    expect(
      (await tus('DELETE', second, { [UPLOAD_TOKEN_HEADER]: b })).status
    ).toBe(204);
    expect((await create(c, { kind: 'photo', length: 10 })).status).toBe(201);
  });

  it('counts uploads left half-done by a restart against the floor', async () => {
    const before = await stories.createDraft(draftInput);
    const after = await stories.createDraft(draftInput);
    const video = mp4Bytes(64 * 1024);
    const url = await createOk(before.uploadToken, {
      kind: 'video',
      length: video.length,
    });
    expect(
      (await patch(url, before.uploadToken, 0, video.slice(0, 1024))).status
    ).toBe(204);

    uploads = buildUploads();
    const owed = video.length - 1024;

    freeBytes = 20 * GB + owed + 9;
    expect(
      (await create(after.uploadToken, { kind: 'photo', length: 10 })).status
    ).toBe(507);
    freeBytes = 20 * GB + owed + 10;
    expect(
      (await create(after.uploadToken, { kind: 'photo', length: 10 })).status
    ).toBe(201);
  });

  it('sweeps expired drafts with their files and keeps submitted stories', async () => {
    const expired = await stories.createDraft(draftInput);
    const photoUrl = await createOk(expired.uploadToken, {
      kind: 'photo',
      length: 10,
    });
    await patch(photoUrl, expired.uploadToken, 0, jpegBytes(10));
    const submitted = await stories.createDraft({
      ...draftInput,
      storyText: 'Study physics.',
    });
    await stories.submit(submitted.story.id);
    const storyDir = path.join(mediaRoot, 'stories', String(expired.story.id));
    expect(await readdir(storyDir)).toHaveLength(1);

    expect((await uploads.uploads.sweep()).drafts).toBe(0);

    clock.ms += DAY_MS + 1;
    try {
      expect((await uploads.uploads.sweep()).drafts).toBe(1);
    } finally {
      clock.ms -= DAY_MS + 1;
    }

    expect(await stories.getWithMedia(expired.story.id)).toBeNull();
    expect(existsSync(storyDir)).toBe(false);
    expect((await stories.getWithMedia(submitted.story.id))?.story.status).toBe(
      'pending'
    );
  });
});
