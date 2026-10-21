/** An upload on disk: the length the client declared and what has arrived. */
export type StagedUpload = {
  uploadId: string;
  sizeBytes: number;
  receivedBytes: number;
};

/**
 * Where resumable uploads collect their bytes before they become story media.
 * Staged files are temporary: each is moved into the media store or removed.
 */
export interface IUploadStaging {
  /** Every upload currently staged, finished or not. */
  list(): Promise<StagedUpload[]>;
  /** Up to `length` bytes from the start of a staged upload. */
  readHead(uploadId: string, length: number): Promise<Uint8Array>;
  /** Streams the whole staged upload. */
  open(uploadId: string): ReadableStream<Uint8Array>;
  /** Removes a staged upload; a missing one is not an error. */
  remove(uploadId: string): Promise<void>;
  /** Removes unfinished uploads past their expiry and returns how many went. */
  removeExpired(): Promise<number>;
}
