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

const clock = {
  now: () => new Date('2026-10-11T10:00:00Z'),
  nowMs: () => Date.parse('2026-10-11T10:00:00Z'),
};

const GB = 1024 ** 3;
const ORIGIN = 'http://localhost';
const UPLOADS_URL = `${ORIGIN}/api/admin/alumni-stories/edited-video-uploads`;
const ALUMNI_UPLOADS_URL = `${ORIGIN}/api/alumni-stories/uploads`;

const draftInput = {
  fullName: 'Ayesha Khan',
  graduationYear: 2010,
  profession: 'Commercial pilot',
  phone: null,
  email: 'ayesha@example.com',
  storyText: 'Flying taught me patience.',
};

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

const mp4Bytes = (size: number) => {
  const bytes = new Uint8Array(size).fill(7);
  bytes.set([0, 0, 0, 0x18, ...ascii('ftypisom'), 0, 0, 2, 0]);
  bytes.set(ascii('isomiso2'), 16);
  return bytes;
};

const tusMetadata = (pairs: Record<string, string>) =>
  Object.entries(pairs)
    .map(([key, value]) => `${key} ${Buffer.from(value).toString('base64')}`)
    .join(',');

describe('Edited video tus uploads integration', () => {
  const pool = createTestPool();
  let lockClient: PoolClient;
  let mediaRoot: string;
  let incoming: string;
  let stories: InstanceType<typeof AlumniStoryService>;
  let mediaStore: InstanceType<typeof LocalMediaStore>;
  let endpoints: ReturnType<typeof createAlumniStoryUploadEndpoints>;
  let freeBytes: number;

  const tus = (
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: BodyInit,
    server = endpoints.editedVideoUploads.server
  ) =>
    server.handleWeb(
      new Request(url, {
        method,
        headers: { 'Tus-Resumable': '1.0.0', ...headers },
        body,
        duplex: 'half',
      } as RequestInit)
    );

  const createEdit = (storyId: number, length: number) =>
    tus('POST', UPLOADS_URL, {
      'Upload-Length': String(length),
      'Upload-Metadata': tusMetadata({
        storyId: String(storyId),
        filename: 'edit.mp4',
      }),
    });

  /** Uploads `bytes` in one PATCH and returns the creation and PATCH statuses. */
  const upload = async (storyId: number, bytes: Uint8Array<ArrayBuffer>) => {
    const created = await createEdit(storyId, bytes.length);
    if (created.status !== 201) return { created: created.status };
    const url = new URL(created.headers.get('location')!, ORIGIN).toString();
    const patched = await tus(
      'PATCH',
      url,
      {
        'Upload-Offset': '0',
        'Content-Type': 'application/offset+octet-stream',
      },
      bytes
    );
    return { created: created.status, patched: patched.status };
  };

  const submittedStory = async () => {
    const { story } = await stories.createDraft(draftInput);
    await stories.submit(story.id);
    return story;
  };

  const stagedFiles = async () =>
    existsSync(incoming) ? await readdir(incoming) : [];

  beforeAll(async () => {
    lockClient = (await acquireGlobalTestDbLock(pool)) as PoolClient;
    await ensureSchema(pool);
  });

  beforeEach(async () => {
    await resetTables(pool);
    mediaRoot = await mkdtemp(path.join(tmpdir(), 'fgs-edited-'));
    incoming = path.join(mediaRoot, '.incoming-edited');
    mediaStore = new LocalMediaStore(mediaRoot);
    stories = new AlumniStoryService(
      new AlumniStoryRepository(pool),
      mediaStore,
      clock
    );
    freeBytes = 100 * GB;
    endpoints = createAlumniStoryUploadEndpoints({
      stories,
      directories: {
        alumniMedia: path.join(mediaRoot, '.incoming'),
        editedVideos: incoming,
      },
      diskSpace: { freeBytes: async () => freeBytes },
      notifier: { sendMessage: async () => ({}) },
      clock,
    });
  });

  afterEach(async () => {
    await rm(mediaRoot, { recursive: true, force: true });
  });

  afterAll(async () => {
    await releaseGlobalTestDbLock(lockClient);
    await closePool(pool);
  });

  it('stores an uploaded edit without changing the public video', async () => {
    const story = await submittedStory();
    const video = mp4Bytes(32 * 1024);

    expect(await upload(story.id, video)).toEqual({
      created: 201,
      patched: 204,
    });

    const found = await stories.getWithMedia(story.id);
    expect(found?.story.public_video_variant).toBe('original');
    expect(found?.media).toHaveLength(1);
    expect(found?.media[0]).toMatchObject({
      kind: 'video',
      variant: 'edited',
      mime_type: 'video/mp4',
      size_bytes: video.length,
      original_filename: 'edit.mp4',
    });
    const stored = await mediaStore.read(found!.media[0].storage_key);
    expect(new Uint8Array(await new Response(stored).arrayBuffer())).toEqual(
      video
    );
    expect(await stagedFiles()).toEqual([]);
  });

  it('refuses edits for drafts and unknown stories before any bytes arrive', async () => {
    const { story: draft } = await stories.createDraft(draftInput);

    expect(await upload(draft.id, mp4Bytes(1024))).toEqual({ created: 403 });
    expect(await upload(999, mp4Bytes(1024))).toEqual({ created: 404 });
    expect(await stagedFiles()).toEqual([]);
  });

  it('refuses a file that is not a video and keeps nothing', async () => {
    const story = await submittedStory();
    const jpeg = new Uint8Array(1024).fill(7);
    jpeg.set([0xff, 0xd8, 0xff, 0xe0]);

    expect(await upload(story.id, jpeg)).toEqual({
      created: 201,
      patched: 415,
    });
    expect((await stories.getWithMedia(story.id))?.media).toEqual([]);
    expect(await stagedFiles()).toEqual([]);
  });

  it('shares the free-space floor with alumnus uploads', async () => {
    const story = await submittedStory();
    const draft = await stories.createDraft(draftInput);
    freeBytes = 20 * GB + 1024;

    expect((await createEdit(story.id, 1024)).status).toBe(201);
    expect((await createEdit(story.id, 1)).status).toBe(507);
    const alumnus = await tus(
      'POST',
      ALUMNI_UPLOADS_URL,
      {
        [UPLOAD_TOKEN_HEADER]: draft.uploadToken,
        'Upload-Length': '1',
        'Upload-Metadata': tusMetadata({ kind: 'photo' }),
      },
      undefined,
      endpoints.alumniStoryUploads.server
    );
    expect(alumnus.status).toBe(507);
  });

  it('frees the room of a terminated edit', async () => {
    const story = await submittedStory();
    freeBytes = 20 * GB + 1024;

    const created = await createEdit(story.id, 1024);
    expect((await createEdit(story.id, 1024)).status).toBe(507);
    const url = new URL(created.headers.get('location')!, ORIGIN).toString();
    expect((await tus('DELETE', url, {})).status).toBe(204);
    expect((await createEdit(story.id, 1024)).status).toBe(201);
  });
});
