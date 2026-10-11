import {
  AlumniStoryReviewDecision,
  AlumniStoryStatus,
  MEDIA_LIMITS,
  PublicVideoVariant,
  adminAlumniStoryDetailSchema,
  alumniStorySchema,
  alumniStorySummarySchema,
} from '@/features/alumni-stories/domain/alumni-story';
import {
  UPLOAD_CHUNK_BYTES,
  UPLOAD_RETRY_DELAYS_MS,
} from '@/features/alumni-stories/presentation/alumni-story-client';
import { type HttpStack, Upload } from 'tus-js-client';
import { z } from 'zod';
import { requestJson } from '@/lib/client/request-json';
import { API } from '@/lib/consts';

const okSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ ok: z.literal(true), data });

const errorMessage = (status: number, message?: string) =>
  status === 401
    ? 'Authentication required.'
    : (message ?? 'Failed to load alumni stories.');

export async function getAdminAlumniStories(status: AlumniStoryStatus) {
  const url = `${API.admin.alumniStories}?status=${encodeURIComponent(status)}`;
  const result = await requestJson(url, {
    schema: okSchema(z.array(alumniStorySummarySchema)),
    errorMessage,
  });
  return result.data;
}

export async function getAdminAlumniStory(id: number) {
  const result = await requestJson(API.admin.alumniStoryById(id), {
    schema: okSchema(adminAlumniStoryDetailSchema),
    errorMessage,
  });
  return result.data;
}

export async function chooseAdminPublicVideo(
  storyId: number,
  publicVideoVariant: PublicVideoVariant
) {
  const result = await requestJson(API.admin.alumniStoryById(storyId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicVideoVariant }),
    schema: okSchema(alumniStorySchema),
    errorMessage: (status, message) =>
      status === 401
        ? 'Authentication required.'
        : (message ?? 'Failed to change the public video.'),
  });
  return result.data;
}

export async function reviewAdminAlumniStory(
  storyId: number,
  decision: AlumniStoryReviewDecision
) {
  const result = await requestJson(API.admin.alumniStoryReview(storyId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision }),
    schema: okSchema(alumniStorySchema),
    errorMessage: (status, message) =>
      status === 401
        ? 'Authentication required.'
        : (message ?? 'Failed to save the review.'),
  });
  return result.data;
}

export type EditedVideoUploadOutcome =
  | { outcome: 'done' }
  | { outcome: 'failed'; message: string };

const editedVideoUploadMessage = (status: number) => {
  switch (status) {
    case 401:
      return 'Your session ended. Sign in again, then upload the video again.';
    case 413:
      return `This file is too large. An edited video can be up to ${MEDIA_LIMITS.video.maxBytes / 1024 / 1024} MB.`;
    case 415:
      return 'This file is not a video the site can use. Export it as MP4, MOV or WebM.';
    case 0:
      return 'The upload stopped because the connection dropped. Try again.';
    default:
      return 'The upload failed. Try again.';
  }
};

/**
 * Uploads an admin's edit of a story's video in resumable chunks, like the
 * alumnus upload, so a large export survives a flaky connection. The admin
 * session cookie authorizes it. Resolves once the server has stored it.
 */
export function uploadEditedVideo(
  file: File | Blob | Buffer,
  options: {
    storyId: number;
    filename?: string;
    onProgress: (fraction: number) => void;
    /** Tests point these at a local server. */
    endpoint?: string;
    httpStack?: HttpStack;
  }
): Promise<EditedVideoUploadOutcome> {
  return new Promise((resolve) => {
    new Upload(file, {
      endpoint: options.endpoint ?? API.admin.alumniStoryEditedVideoUploads,
      ...(options.httpStack ? { httpStack: options.httpStack } : {}),
      metadata: {
        storyId: String(options.storyId),
        ...(options.filename ? { filename: options.filename } : {}),
      },
      chunkSize: UPLOAD_CHUNK_BYTES,
      retryDelays: UPLOAD_RETRY_DELAYS_MS,
      // Retrying from the page is enough; nothing resumes after a reload.
      storeFingerprintForResuming: false,
      onProgress: (sent, total) => options.onProgress(total ? sent / total : 0),
      onSuccess: () => resolve({ outcome: 'done' }),
      onError: (error) => {
        const status =
          'originalResponse' in error
            ? (error.originalResponse?.getStatus() ?? 0)
            : 0;
        resolve({
          outcome: 'failed',
          message: editedVideoUploadMessage(status),
        });
      },
    }).start();
  });
}
