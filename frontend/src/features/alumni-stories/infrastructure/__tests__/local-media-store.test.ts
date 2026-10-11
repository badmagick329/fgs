import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

mock.module('server-only', () => ({}));

const { LocalMediaStore } =
  await import('@/features/alumni-stories/infrastructure/local-media-store');

const streamOf = (...chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

const failingStream = () =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('partial'));
      controller.error(new Error('connection dropped'));
    },
  });

const textOf = (stream: ReadableStream<Uint8Array>) =>
  new Response(stream).text();

describe('LocalMediaStore', () => {
  let root: string;
  let store: InstanceType<typeof LocalMediaStore>;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'fgs-media-'));
    store = new LocalMediaStore(root);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('writes a stream and reports its size', async () => {
    const result = await store.put(
      'stories/1/a.mp4',
      streamOf('hello ', 'world')
    );

    expect(result.sizeBytes).toBe(11);
    expect(await store.stat('stories/1/a.mp4')).toEqual({ sizeBytes: 11 });
    expect(await textOf(await store.read('stories/1/a.mp4'))).toBe(
      'hello world'
    );
  });

  it('reads an inclusive byte range', async () => {
    await store.put('stories/1/a.mp4', streamOf('0123456789'));

    const range = await store.read('stories/1/a.mp4', { start: 2, end: 5 });

    expect(await textOf(range)).toBe('2345');
  });

  it('leaves nothing behind when the upload stream fails', async () => {
    await expect(store.put('stories/1/a.mp4', failingStream())).rejects.toThrow(
      'connection dropped'
    );

    expect(await store.stat('stories/1/a.mp4')).toBeNull();
    expect(await readdir(path.join(root, 'stories', '1'))).toEqual([]);
  });

  it('deletes objects and tolerates missing keys', async () => {
    await store.put('stories/1/a.mp4', streamOf('x'));

    await store.delete('stories/1/a.mp4');
    await store.delete('stories/1/a.mp4');

    expect(await store.stat('stories/1/a.mp4')).toBeNull();
  });

  it('deletes everything under a prefix and leaves siblings', async () => {
    await store.put('stories/1/a.mp4', streamOf('x'));
    await store.put('stories/1/b.jpg', streamOf('y'));
    await store.put('stories/2/c.jpg', streamOf('z'));

    await store.deletePrefix('stories/1');
    await store.deletePrefix('stories/1');

    expect(await store.stat('stories/1/a.mp4')).toBeNull();
    expect(await readdir(path.join(root, 'stories'))).toEqual(['2']);
  });

  it('rejects reads of missing keys', async () => {
    await expect(store.read('stories/1/missing.mp4')).rejects.toThrow();
  });

  it('refuses keys that could escape the media root', async () => {
    for (const key of ['../etc/passwd', 'stories/../../x', '/abs', 'A/b']) {
      await expect(store.stat(key)).rejects.toThrow('Invalid media key');
    }
  });
});
