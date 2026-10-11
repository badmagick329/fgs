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

class FakeClock {
  constructor(public ms: number) {}
  now() {
    return new Date(this.ms);
  }
  nowMs() {
    return this.ms;
  }
}

const draftInput = {
  fullName: 'Ayesha Khan',
  graduationYear: 2010,
  profession: 'Commercial pilot',
  contact: 'ayesha@example.com',
  storyText: null,
};

const bytes = (size: number) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(size).fill(7));
      controller.close();
    },
  });

const photo = (sizeBytes = 10) => ({
  kind: 'photo' as const,
  mimeType: 'image/jpeg',
  sizeBytes,
  originalFilename: 'me.jpg',
  body: bytes(sizeBytes),
});

describe('Alumni stories (repository + service) integration', () => {
  const pool = createTestPool();
  const clock = new FakeClock(Date.parse('2026-10-11T10:00:00Z'));
  let lockClient: PoolClient;
  let mediaRoot: string;
  let repository: InstanceType<typeof AlumniStoryRepository>;
  let mediaStore: InstanceType<typeof LocalMediaStore>;
  let service: InstanceType<typeof AlumniStoryService>;

  beforeAll(async () => {
    lockClient = (await acquireGlobalTestDbLock(pool)) as PoolClient;
    await ensureSchema(pool);
    repository = new AlumniStoryRepository(pool);
  });

  beforeEach(async () => {
    await resetTables(pool);
    mediaRoot = await mkdtemp(path.join(tmpdir(), 'fgs-alumni-'));
    mediaStore = new LocalMediaStore(mediaRoot);
    service = new AlumniStoryService(repository, mediaStore, clock);
  });

  afterEach(async () => {
    await rm(mediaRoot, { recursive: true, force: true });
  });

  afterAll(async () => {
    await releaseGlobalTestDbLock(lockClient);
    await closePool(pool);
  });

  it('applies the migration twice without error', async () => {
    await ensureSchema(pool);
  });

  it('finds a draft by its upload token until the token expires', async () => {
    const { story, uploadToken } = await service.createDraft(draftInput);

    expect(story.status).toBe('draft');
    expect((await service.findDraftByUploadToken(uploadToken))?.id).toBe(
      story.id
    );
    expect(await service.findDraftByUploadToken('wrong-token')).toBeNull();

    clock.ms += 24 * 60 * 60 * 1000 + 1;
    expect(await service.findDraftByUploadToken(uploadToken)).toBeNull();
    clock.ms -= 24 * 60 * 60 * 1000 + 1;
  });

  it('stores original media and refuses a fourth photo', async () => {
    const { story } = await service.createDraft(draftInput);

    for (let i = 0; i < 3; i++) {
      const added = await service.addOriginalMedia(story.id, photo());
      expect(added.ok).toBe(true);
      if (added.ok) {
        expect(await mediaStore.stat(added.data.storage_key)).toEqual({
          sizeBytes: 10,
        });
      }
    }

    const fourth = await service.addOriginalMedia(story.id, photo());
    expect(fourth).toMatchObject({ ok: false, error: 'limit-reached' });
  });

  it('keeps the photo limit when uploads finish at the same time', async () => {
    const { story } = await service.createDraft(draftInput);

    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        repository.addMedia(
          story.id,
          {
            kind: 'photo',
            variant: 'original',
            storageKey: `stories/${story.id}/${crypto.randomUUID()}.jpg`,
            mimeType: 'image/jpeg',
            sizeBytes: 10,
            originalFilename: null,
          },
          3
        )
      )
    );

    expect(results.filter((r) => r.ok)).toHaveLength(3);
    expect(await repository.countOriginalMedia(story.id, 'photo')).toBe(3);
  });

  it('removes the stored file when the received size does not match', async () => {
    const { story } = await service.createDraft(draftInput);

    const result = await service.addOriginalMedia(story.id, {
      ...photo(10),
      body: bytes(4),
    });

    expect(result).toMatchObject({ ok: false, error: 'invalid-media' });
    expect(await repository.countOriginalMedia(story.id)).toBe(0);
    expect(
      await readdir(path.join(mediaRoot, 'stories', String(story.id)))
    ).toEqual([]);
  });

  it('refuses to submit an empty story, then submits once media exists', async () => {
    const { story, uploadToken } = await service.createDraft(draftInput);

    expect(await service.submit(story.id)).toMatchObject({
      ok: false,
      error: 'empty-story',
    });

    await service.addOriginalMedia(story.id, photo());
    const submitted = await service.submit(story.id);

    expect(submitted).toMatchObject({ ok: true, data: { status: 'pending' } });
    // The token is retired on submit, so it cannot add media afterwards.
    expect(await service.findDraftByUploadToken(uploadToken)).toBeNull();
    expect(await service.addOriginalMedia(story.id, photo())).toMatchObject({
      ok: false,
      error: 'not-draft',
    });
  });

  it('refuses media for a submitted text-only story', async () => {
    const { story } = await service.createDraft({
      ...draftInput,
      storyText: 'Study physics.',
    });
    await service.submit(story.id);

    expect(await service.addOriginalMedia(story.id, photo())).toMatchObject({
      ok: false,
      error: 'not-draft',
    });
  });

  it('lists stories by status with media counts, newest first', async () => {
    const first = await service.createDraft({ ...draftInput, storyText: 'A' });
    clock.ms += 1000;
    const second = await service.createDraft({ ...draftInput, storyText: 'B' });
    await service.addOriginalMedia(second.story.id, photo());
    await service.submit(first.story.id);
    await service.submit(second.story.id);
    await service.createDraft(draftInput);

    const pending = await service.listByStatus('pending');

    expect(pending.map((s) => s.id)).toEqual([second.story.id, first.story.id]);
    expect(pending[0]).toMatchObject({ photo_count: 1, video_count: 0 });
    // Contact is listed for admins, but the token hash never leaves the repo.
    expect(pending[0]).not.toHaveProperty('upload_token_hash');
  });

  it('records the reviewer and lets admins change their decision', async () => {
    const { story } = await service.createDraft({
      ...draftInput,
      storyText: 'A',
    });

    expect(await service.review(story.id, 'approved', 1)).toMatchObject({
      ok: false,
      error: 'not-reviewable',
    });

    await service.submit(story.id);
    const approved = await service.review(story.id, 'approved', 1);
    expect(approved).toMatchObject({
      ok: true,
      data: { status: 'approved', reviewed_by_admin_user_id: 1 },
    });

    const rejected = await service.review(story.id, 'rejected', 2);
    expect(rejected).toMatchObject({
      ok: true,
      data: { status: 'rejected', reviewed_by_admin_user_id: 2 },
    });
    expect(await service.review(999, 'approved', 1)).toMatchObject({
      ok: false,
      error: 'not-found',
    });
  });

  it('returns a story with its media, videos first', async () => {
    const { story } = await service.createDraft(draftInput);
    await service.addOriginalMedia(story.id, photo());
    await service.addOriginalMedia(story.id, {
      kind: 'video',
      mimeType: 'video/mp4',
      sizeBytes: 20,
      originalFilename: 'clip.mp4',
      body: bytes(20),
    });

    const found = await service.getWithMedia(story.id);

    expect(found?.media.map((m) => m.kind)).toEqual(['video', 'photo']);
    expect(found?.media[0].size_bytes).toBe(20);
  });

  it('finds one media file by id and streams its bytes', async () => {
    const { story } = await service.createDraft(draftInput);
    const added = await service.addOriginalMedia(story.id, photo(12));
    if (!added.ok) throw new Error(added.message);

    const media = await service.getMedia(added.data.id);
    expect(media).toMatchObject({ story_id: story.id, size_bytes: 12 });
    const body = await service.readMedia(media!, { start: 2, end: 5 });
    expect((await new Response(body).arrayBuffer()).byteLength).toBe(4);
    expect(await service.getMedia(added.data.id + 1000)).toBeNull();
  });

  const video = (sizeBytes: number, originalFilename = 'clip.mp4') => ({
    mimeType: 'video/mp4',
    sizeBytes,
    originalFilename,
    body: bytes(sizeBytes),
  });

  const submittedWithVideo = async () => {
    const { story } = await service.createDraft(draftInput);
    const original = await service.addOriginalMedia(story.id, {
      kind: 'video',
      ...video(20),
    });
    if (!original.ok) throw new Error(original.message);
    await service.submit(story.id);
    return { story, original: original.data };
  };

  it('replaces the edited video, keeping the original and dropping the old edit', async () => {
    const { story, original } = await submittedWithVideo();

    const first = await service.replaceEditedVideo(
      story.id,
      video(30, 'edit-1.mp4')
    );
    if (!first.ok) throw new Error(first.message);
    const second = await service.replaceEditedVideo(
      story.id,
      video(40, 'edit-2.mp4')
    );
    if (!second.ok) throw new Error(second.message);

    const found = await service.getWithMedia(story.id);
    expect(found?.media.map((m) => [m.variant, m.original_filename])).toEqual([
      ['original', 'clip.mp4'],
      ['edited', 'edit-2.mp4'],
    ]);
    expect(await mediaStore.stat(first.data.storage_key)).toBeNull();
    expect(await mediaStore.stat(second.data.storage_key)).toEqual({
      sizeBytes: 40,
    });
    expect(await mediaStore.stat(original.storage_key)).toEqual({
      sizeBytes: 20,
    });
  });

  it('refuses an edited video for a draft or a missing story and keeps no file', async () => {
    const { story } = await service.createDraft(draftInput);

    expect(await service.replaceEditedVideo(story.id, video(30))).toMatchObject(
      { ok: false, error: 'not-submitted' }
    );
    expect(await service.replaceEditedVideo(999, video(30))).toMatchObject({
      ok: false,
      error: 'not-found',
    });
    expect(await readdir(mediaRoot, { recursive: true })).not.toContainEqual(
      expect.stringMatching(/\.mp4$/)
    );
  });

  it('shows the original until an admin picks an uploaded edit', async () => {
    const { story } = await submittedWithVideo();
    const found = await service.getWithMedia(story.id);
    expect(found?.story.public_video_variant).toBe('original');

    expect(await service.choosePublicVideo(story.id, 'edited')).toMatchObject({
      ok: false,
      error: 'no-edited-video',
    });

    await service.replaceEditedVideo(story.id, video(30));
    expect(
      (await service.getWithMedia(story.id))?.story.public_video_variant
    ).toBe('original');

    expect(await service.choosePublicVideo(story.id, 'edited')).toMatchObject({
      ok: true,
      data: { public_video_variant: 'edited' },
    });
    expect(await service.choosePublicVideo(story.id, 'original')).toMatchObject(
      { ok: true, data: { public_video_variant: 'original' } }
    );
  });

  it('refuses a public video choice for a draft or a missing story', async () => {
    const { story } = await service.createDraft(draftInput);

    expect(await service.choosePublicVideo(story.id, 'original')).toMatchObject(
      { ok: false, error: 'not-submitted' }
    );
    expect(await service.choosePublicVideo(999, 'original')).toMatchObject({
      ok: false,
      error: 'not-found',
    });
  });

  it('allows one edited video per story in the schema', async () => {
    const { story } = await submittedWithVideo();
    // ON CONFLICT names the partial index, so a missing index fails the
    // insert outright. A raised unique violation is avoided on purpose: under
    // Bun 1.2 it makes `bun test` exit 127 once a later test file runs.
    const insertEdit = async (key: string) => {
      const res = await pool.query(
        `INSERT INTO alumni_story_media
           (story_id, kind, variant, storage_key, mime_type, size_bytes)
         VALUES ($1, 'video', 'edited', $2, 'video/mp4', 1)
         ON CONFLICT (story_id) WHERE kind = 'video' AND variant = 'edited'
         DO NOTHING`,
        [story.id, key]
      );
      return res.rowCount;
    };

    expect(await insertEdit('a.mp4')).toBe(1);
    expect(await insertEdit('b.mp4')).toBe(0);
  });
});
