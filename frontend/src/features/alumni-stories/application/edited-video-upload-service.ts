import { AlumniStoryService } from '@/features/alumni-stories/application/alumni-story-service';
import {
  StagedUploadMetadata,
  UploadError,
  UploadResult,
  cleanFilename,
} from '@/features/alumni-stories/application/alumni-story-upload-service';
import {
  AlumniStoryMedia,
  MEDIA_LIMITS,
  mediaUploadStartViolation,
} from '@/features/alumni-stories/domain/alumni-story';
import { IUploadStaging } from '@/features/alumni-stories/domain/interfaces';
import {
  MEDIA_SNIFF_BYTES,
  sniffMediaType,
} from '@/features/alumni-stories/domain/media-type';
import * as z from 'zod';

const fail = <T>(error: UploadError, message: string): UploadResult<T> => ({
  ok: false,
  error,
  message,
});

const stagedMetadataSchema = z.object({
  storyId: z.coerce.number().int().positive(),
  filename: z.string().nullable().optional(),
});

/**
 * Runs the rules around an admin's resumable upload of an edited video.
 * Callers admit only signed-in admins, and any admin may edit any story, so
 * unlike alumnus uploads there is no per-upload owner to check.
 */
export class EditedVideoUploadService {
  constructor(
    private readonly stories: AlumniStoryService,
    private readonly staging: IUploadStaging
  ) {}

  /** Admits a new upload and returns the metadata to store on it. */
  async begin(upload: {
    storyId: string | null | undefined;
    sizeBytes: number | undefined;
    filename: string | null | undefined;
  }): Promise<UploadResult<StagedUploadMetadata>> {
    const storyId = z.coerce
      .number()
      .int()
      .positive()
      .safeParse(upload.storyId);
    if (!storyId.success) {
      return fail('bad-request', 'Upload metadata must set storyId');
    }
    if (upload.sizeBytes === undefined) {
      return fail('bad-request', 'Upload-Length is required');
    }
    const violation = mediaUploadStartViolation(
      { kind: 'video', sizeBytes: upload.sizeBytes },
      0
    );
    if (violation) return fail('too-large', violation);

    const found = await this.stories.getWithMedia(storyId.data);
    if (!found) return fail('not-found', 'Story not found');
    if (found.story.status === 'draft') {
      return fail('forbidden', 'Only submitted stories can be edited');
    }

    const filename = cleanFilename(upload.filename);
    return {
      ok: true,
      data: {
        storyId: String(storyId.data),
        ...(filename ? { filename } : {}),
      },
    };
  }

  /**
   * Types a fully received upload by its first bytes and stores it as the
   * story's edited video. The staged copy is removed whatever the outcome.
   */
  async finish(upload: {
    uploadId: string;
    sizeBytes: number | undefined;
    metadata: Record<string, string | null> | undefined;
  }): Promise<UploadResult<AlumniStoryMedia>> {
    try {
      const metadata = stagedMetadataSchema.safeParse(upload.metadata);
      if (!metadata.success || upload.sizeBytes === undefined) {
        return fail('bad-request', 'Upload was not started by this server');
      }

      const head = await this.staging.readHead(
        upload.uploadId,
        MEDIA_SNIFF_BYTES
      );
      const mimeType = sniffMediaType(head);
      if (!mimeType || !MEDIA_LIMITS.video.mimeTypes.includes(mimeType)) {
        return fail('invalid-media', 'This file is not a supported video');
      }

      const stored = await this.stories.replaceEditedVideo(
        metadata.data.storyId,
        {
          mimeType,
          sizeBytes: upload.sizeBytes,
          originalFilename: metadata.data.filename ?? null,
          body: this.staging.open(upload.uploadId),
        }
      );
      if (stored.ok) return stored;
      switch (stored.error) {
        case 'not-found':
          return fail('not-found', stored.message);
        case 'invalid-media':
          return fail('invalid-media', stored.message);
        default:
          return fail('forbidden', stored.message);
      }
    } finally {
      await this.staging.remove(upload.uploadId);
    }
  }

  /** Removes unfinished uploads past their expiry. Meant to run periodically. */
  sweep() {
    return this.staging.removeExpired();
  }
}
