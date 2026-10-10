/**
 * Byte storage for uploaded media, addressed by opaque keys such as
 * `stories/12/3f2a….mp4`. The local-disk adapter is the first; an object
 * storage adapter can replace it without touching callers.
 */
export interface IMediaStore {
  /** Writes the whole stream under `key`; nothing is visible under it until the write completes. */
  put(
    key: string,
    body: ReadableStream<Uint8Array>
  ): Promise<{ sizeBytes: number }>;
  /** Size of the object, or null when it does not exist. */
  stat(key: string): Promise<{ sizeBytes: number } | null>;
  /** Streams the object, or the inclusive byte range when given. */
  read(
    key: string,
    range?: { start: number; end: number }
  ): Promise<ReadableStream<Uint8Array>>;
  /** Removes the object; a missing key is not an error. */
  delete(key: string): Promise<void>;
}
