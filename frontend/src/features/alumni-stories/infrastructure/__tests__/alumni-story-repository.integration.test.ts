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
});
