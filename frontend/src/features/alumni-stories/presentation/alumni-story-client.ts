import {
  CreateAlumniStoryDraft,
  MEDIA_LIMITS,
  MediaKind,
  UPLOAD_TOKEN_HEADER,
  createdAlumniStoryDraftSchema,
  submittedAlumniStorySchema,
} from '@/features/alumni-stories/domain/alumni-story';
import { type HttpStack, Upload } from 'tus-js-client';
import { z } from 'zod';
import { API } from '@/lib/consts';
import { Result, resultSchema } from '@/lib/result';

const UNAVAILABLE_MESSAGE =
  'Unable to send right now. Please check your connection and try again.';

async function postForResult<T extends z.ZodTypeAny>(
  url: string,
  init: RequestInit,
  data: T
): Promise<Result<z.output<T>>> {
  const response = await fetch(url, { method: 'POST', ...init }).catch(
    () => null
  );
  const json: unknown = await response?.json().catch(() => null);
  const parsed = resultSchema(data).safeParse(json);
  if (!parsed.success) return { ok: false, message: UNAVAILABLE_MESSAGE };
  return parsed.data as Result<z.output<T>>;
}

/** Saves the alumnus's details as a draft and returns its upload token. */
export function createAlumniStoryDraft(details: CreateAlumniStoryDraft) {
  return postForResult(
    API.alumniStories,
    {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...details,
        storyText: details.storyText ?? undefined,
      }),
    },
    createdAlumniStoryDraftSchema
  );
}

/** Hands the draft to the school. Call once every upload has finished. */
export function submitAlumniStory(uploadToken: string) {
  return postForResult(
    API.alumniStorySubmit,
    { headers: { [UPLOAD_TOKEN_HEADER]: uploadToken } },
    submittedAlumniStorySchema
  );
}

/**
 * Small enough that one PATCH finishes well inside a proxy's read timeout on
 * slow mobile data, and that a drop loses little progress.
 */
export const UPLOAD_CHUNK_BYTES = 4 * 1024 * 1024;

/** Rides out short drops; a longer outage ends as `interrupted`. */
export const UPLOAD_RETRY_DELAYS_MS = [0, 1000, 3000, 5000, 10000, 20000];

export type MediaUploadOutcome =
  | { outcome: 'done' }
  | { outcome: 'interrupted' }
  | { outcome: 'refused'; status: number; message: string }
  | { outcome: 'removed' };

const megabytes = (bytes: number) => `${bytes / 1024 / 1024} MB`;

/** Turns a tus failure into what the alumnus can do about it. */
export function uploadOutcomeFromError(
  error: Error & { originalResponse?: { getStatus(): number } | null }
): MediaUploadOutcome {
  const status = error.originalResponse?.getStatus() ?? 0;
  if (status < 400 || status >= 500) return { outcome: 'interrupted' };

  const message = (() => {
    switch (status) {
      case 403:
        return 'This upload link has expired or your story was already sent.';
      case 413:
        return `This file is too large. A video can be up to ${megabytes(MEDIA_LIMITS.video.maxBytes)} and a photo up to ${megabytes(MEDIA_LIMITS.photo.maxBytes)}.`;
      case 415:
        return 'This file is not a video or photo we can accept. Try an MP4 or MOV video, or a JPEG, PNG, WEBP or HEIC photo.';
      case 422:
        return `A story can have ${MEDIA_LIMITS.video.maxCount} video and up to ${MEDIA_LIMITS.photo.maxCount} photos.`;
      default:
        return 'This file could not be uploaded.';
    }
  })();
  return { outcome: 'refused', status, message };
}

export type MediaUpload = {
  /** Uploads, or resumes from where the server says the last attempt got to. */
  run(): Promise<MediaUploadOutcome>;
  /** Stops the upload and deletes what the server holds of it. */
  remove(): Promise<void>;
};

export function createMediaUpload(
  file: File | Blob | Buffer,
  options: {
    uploadToken: string;
    kind: MediaKind;
    filename?: string;
    onProgress: (fraction: number) => void;
    /** Tests point these at a local server. */
    endpoint?: string;
    httpStack?: HttpStack;
  }
): MediaUpload {
  let settle: ((outcome: MediaUploadOutcome) => void) | null = null;
  const finish = (outcome: MediaUploadOutcome) => {
    settle?.(outcome);
    settle = null;
  };

  const upload = new Upload(file, {
    endpoint: options.endpoint ?? API.alumniStoryUploads,
    ...(options.httpStack ? { httpStack: options.httpStack } : {}),
    headers: { [UPLOAD_TOKEN_HEADER]: options.uploadToken },
    metadata: {
      kind: options.kind,
      ...(options.filename ? { filename: options.filename } : {}),
    },
    chunkSize: UPLOAD_CHUNK_BYTES,
    retryDelays: UPLOAD_RETRY_DELAYS_MS,
    // The token lives only in page memory, so an upload URL stored for
    // resuming after a reload could never be authorised again.
    storeFingerprintForResuming: false,
    onProgress: (sent, total) => options.onProgress(total ? sent / total : 0),
    onSuccess: () => finish({ outcome: 'done' }),
    onError: (error) => finish(uploadOutcomeFromError(error)),
  });

  return {
    run() {
      return new Promise((resolve) => {
        settle = resolve;
        upload.start();
      });
    },
    async remove() {
      finish({ outcome: 'removed' });
      // Nothing to delete when the upload never started or already finished.
      await upload.abort(true).catch(() => undefined);
    },
  };
}
