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
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PoolClient } from 'pg';
import type { HttpRequest, HttpResponse, HttpStack } from 'tus-js-client';

mock.module('server-only', () => ({}));

const { AlumniStoryRepository } =
  await import('@/features/alumni-stories/infrastructure/alumni-story-repository');
const { LocalMediaStore } =
  await import('@/features/alumni-stories/infrastructure/local-media-store');
const { AlumniStoryService } =
  await import('@/features/alumni-stories/application/alumni-story-service');
const { createAlumniStoryUploads } =
  await import('@/features/alumni-stories/infrastructure/tus-upload-server');
const { UPLOAD_CHUNK_BYTES, createMediaUpload } =
  await import('@/features/alumni-stories/presentation/alumni-story-client');

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

const mp4Bytes = (size: number) => {
  const bytes = new Uint8Array(size).fill(7);
  bytes.set([0, 0, 0, 0x18, ...ascii('ftypisom'), 0, 0, 2, 0]);
  bytes.set(ascii('isomiso2'), 16);
  return Buffer.from(bytes);
};

/**
 * tus-js-client's Node HTTP stack stalls under Bun 1.2 on multi-megabyte
 * bodies, so the client talks through fetch here; browsers use XHR.
 */
const fetchHttpStack: HttpStack = {
  getName: () => 'fetch',
  createRequest(method, url): HttpRequest {
    const headers = new Headers();
    const controller = new AbortController();
    let onProgress: (bytesSent: number) => void = () => undefined;
    return {
      getMethod: () => method,
      getURL: () => url,
      setHeader: (name, value) => headers.set(name, value),
      getHeader: (name) => headers.get(name) ?? undefined,
      setProgressHandler: (handler) => (onProgress = handler),
      async send(body?: Uint8Array | null): Promise<HttpResponse> {
        const res = await fetch(url, {
          method,
          headers,
          body: body ? new Uint8Array(body) : undefined,
          signal: controller.signal,
        });
        if (body) onProgress(body.length);
        const text = await res.text();
        return {
          getStatus: () => res.status,
          getHeader: (name) => res.headers.get(name) ?? undefined,
          getBody: () => text,
          getUnderlyingObject: () => res,
        };
      },
      abort: async () => controller.abort(),
      getUnderlyingObject: () => null,
    };
  },
};

const draftInput = {
  fullName: 'Ayesha Khan',
  graduationYear: 2010,
  profession: 'Commercial pilot',
  phone: null,
  email: 'ayesha@example.com',
  storyText: null,
};

/**
 * Runs the page's real upload client against the real tus server over HTTP,
 * so a client option the server refuses (bytes in POST, a missing token
 * header, unknown metadata) fails here rather than on an alumnus's phone.
 */
describe('Alumni story upload client against the tus server', () => {
  const pool = createTestPool();
  let lockClient: PoolClient;
  let mediaRoot: string;
  let stories: InstanceType<typeof AlumniStoryService>;
  let http: ReturnType<typeof Bun.serve>;
  let endpoint: string;
  let freeBytes: number;
  let uploadCreates: number;

  beforeAll(async () => {
    lockClient = (await acquireGlobalTestDbLock(pool)) as PoolClient;
    await ensureSchema(pool);
  });

  beforeEach(async () => {
    await resetTables(pool);
    mediaRoot = await mkdtemp(path.join(tmpdir(), 'fgs-tus-client-'));
    stories = new AlumniStoryService(
      new AlumniStoryRepository(pool),
      new LocalMediaStore(mediaRoot),
      { now: () => new Date(), nowMs: () => Date.now() }
    );
    freeBytes = 100 * 1024 ** 3;
    uploadCreates = 0;
    const { server } = createAlumniStoryUploads({
      stories,
      directory: path.join(mediaRoot, '.incoming'),
      diskSpace: { freeBytes: async () => freeBytes },
      notifier: { sendMessage: async () => ({}) },
      clock: { now: () => new Date(), nowMs: () => Date.now() },
    });
    http = Bun.serve({
      port: 0,
      fetch: (req) => {
        if (req.method === 'POST') uploadCreates++;
        return server.handleWeb(req);
      },
    });
    endpoint = `http://localhost:${http.port}/api/alumni-stories/uploads`;
  });

  afterEach(async () => {
    await http.stop(true);
    await rm(mediaRoot, { recursive: true, force: true });
  });

  afterAll(async () => {
    await releaseGlobalTestDbLock(lockClient);
    await closePool(pool);
  });

  it('uploads a multi-chunk video, then submits and spends the token', async () => {
    const { story, uploadToken } = await stories.createDraft(draftInput);
    const video = mp4Bytes(UPLOAD_CHUNK_BYTES * 2 + 1234);
    const progress: number[] = [];

    const outcome = await createMediaUpload(video, {
      uploadToken,
      kind: 'video',
      filename: 'clip.mp4',
      endpoint,
      httpStack: fetchHttpStack,
      onProgress: (fraction) => progress.push(fraction),
    }).run();

    expect(outcome).toEqual({ outcome: 'done' });
    expect(progress.at(-1)).toBe(1);
    const found = await stories.getWithMedia(story.id);
    expect(found?.media).toMatchObject([
      {
        kind: 'video',
        mime_type: 'video/mp4',
        size_bytes: video.length,
        original_filename: 'clip.mp4',
      },
    ]);

    const submitted = await stories.submitWithUploadToken(uploadToken);
    expect(submitted.ok && submitted.data.status).toBe('pending');

    const afterSubmit = await createMediaUpload(mp4Bytes(100), {
      uploadToken,
      kind: 'video',
      endpoint,
      httpStack: fetchHttpStack,
      onProgress: () => undefined,
    }).run();
    expect(afterSubmit).toMatchObject({ outcome: 'refused', status: 403 });
  });

  it('reports a file the server refuses by its bytes', async () => {
    const { uploadToken } = await stories.createDraft(draftInput);

    const outcome = await createMediaUpload(Buffer.from('%PDF-1.7 nope'), {
      uploadToken,
      kind: 'photo',
      endpoint,
      httpStack: fetchHttpStack,
      onProgress: () => undefined,
    }).run();

    expect(outcome).toMatchObject({ outcome: 'refused', status: 415 });
  });

  it('gives up at once when the server’s disk is nearly full', async () => {
    const { uploadToken } = await stories.createDraft(draftInput);
    freeBytes = 1024 ** 3;

    const outcome = await createMediaUpload(mp4Bytes(100), {
      uploadToken,
      kind: 'video',
      endpoint,
      httpStack: fetchHttpStack,
      onProgress: () => undefined,
    }).run();

    expect(outcome).toMatchObject({ outcome: 'refused', status: 507 });
    expect(uploadCreates).toBe(1);
  });

  it('refuses to submit a story with nothing in it', async () => {
    const { uploadToken } = await stories.createDraft(draftInput);

    const result = await stories.submitWithUploadToken(uploadToken);

    expect(result).toMatchObject({ ok: false, error: 'empty-story' });
  });
});
