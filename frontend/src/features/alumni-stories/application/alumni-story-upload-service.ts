import { AlumniStoryService } from '@/features/alumni-stories/application/alumni-story-service';
import {
  AlumniStory,
  AlumniStoryMedia,
  DRAFT_LIFETIME_MS,
  MEDIA_KINDS,
  MEDIA_LIMITS,
  MediaKind,
  mediaUploadStartViolation,
} from '@/features/alumni-stories/domain/alumni-story';
import { IUploadStaging } from '@/features/alumni-stories/domain/interfaces';
import {
  MEDIA_SNIFF_BYTES,
  sniffMediaType,
} from '@/features/alumni-stories/domain/media-type';
import * as z from 'zod';
import { IClock } from '@/lib/server/i-clock';

export type UploadError =
  | 'bad-request'
  | 'not-found'
  | 'invalid-token'
  | 'forbidden'
  | 'not-draft'
  | 'too-large'
  | 'invalid-media'
  | 'limit-reached';

export type UploadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: UploadError; message: string };

const fail = <T>(error: UploadError, message: string): UploadResult<T> => ({
  ok: false,
  error,
  message,
});

/** What the server records on a staged upload; the client's own metadata is dropped. */
const stagedMetadataSchema = z.object({
  storyId: z.coerce.number().int().positive(),
  kind: z.enum(MEDIA_KINDS),
  filename: z.string().nullable().optional(),
});

export type StagedUploadMetadata = Record<string, string | null>;

type Reservation = {
  storyId: number;
  kind: MediaKind;
  startedAtMs: number;
  finishing: boolean;
};

const FILENAME_MAX_LENGTH = 200;

// Filenames come from the client and are shown to admins.
export const cleanFilename = (filename: string | null | undefined) =>
  filename
    ?.replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, FILENAME_MAX_LENGTH) || null;

/**
 * Runs the rules around a resumable upload: who may upload, how much, and
 * what a finished file must be before it becomes story media.
 *
 * Unfinished uploads hold a slot of their kind. Starting one more than a
 * story has room for drops the oldest unfinished one, so an alumnus can swap
 * a file mid-upload while a single token can never stage more than one
 * story's worth of bytes.
 */
export class AlumniStoryUploadService {
  private readonly reservations = new Map<string, Reservation>();

  constructor(
    private readonly stories: AlumniStoryService,
    private readonly staging: IUploadStaging,
    private readonly clock: IClock
  ) {}

  /**
   * Checks that `token` belongs to a live draft and, for an existing upload,
   * that the upload was started under that draft.
   */
  async authorize(
    token: string | null,
    uploadStoryId?: number
  ): Promise<UploadResult<AlumniStory>> {
    if (!token) return fail('invalid-token', 'Upload token is missing');
    const story = await this.stories.findDraftByUploadToken(token);
    if (!story) {
      return fail(
        'invalid-token',
        'This upload link has expired or the story was already submitted'
      );
    }
    if (uploadStoryId !== undefined && story.id !== uploadStoryId) {
      return fail('forbidden', 'This upload belongs to another story');
    }
    return { ok: true, data: story };
  }

  /** Admits a new upload and returns the metadata to store on it. */
  async begin(
    token: string | null,
    upload: {
      uploadId: string;
      kind: string | null | undefined;
      sizeBytes: number | undefined;
      filename: string | null | undefined;
    }
  ): Promise<UploadResult<StagedUploadMetadata>> {
    const auth = await this.authorize(token);
    if (!auth.ok) return auth;
    const story = auth.data;

    const kind = z.enum(MEDIA_KINDS).safeParse(upload.kind);
    if (!kind.success) {
      return fail(
        'bad-request',
        'Upload metadata must set kind to video or photo'
      );
    }
    if (upload.sizeBytes === undefined) {
      return fail('bad-request', 'Upload-Length is required');
    }

    const recorded = await this.stories.countOriginalMedia(story.id, kind.data);
    const violation = mediaUploadStartViolation(
      { kind: kind.data, sizeBytes: upload.sizeBytes },
      recorded
    );
    if (violation) {
      return fail(
        recorded >= MEDIA_LIMITS[kind.data].maxCount
          ? 'limit-reached'
          : 'too-large',
        violation
      );
    }

    await this.evictUnfinished(
      story.id,
      kind.data,
      MEDIA_LIMITS[kind.data].maxCount - recorded
    );
    this.reservations.set(upload.uploadId, {
      storyId: story.id,
      kind: kind.data,
      startedAtMs: this.clock.nowMs(),
      finishing: false,
    });

    const filename = cleanFilename(upload.filename);
    return {
      ok: true,
      data: {
        storyId: String(story.id),
        kind: kind.data,
        ...(filename ? { filename } : {}),
      },
    };
  }

  /**
   * Types a fully received upload by its first bytes and records it as story
   * media. The staged copy is removed whatever the outcome, so a refused file
   * never lingers.
   */
  async finish(upload: {
    uploadId: string;
    sizeBytes: number | undefined;
    metadata: Record<string, string | null> | undefined;
  }): Promise<UploadResult<AlumniStoryMedia>> {
    const reservation = this.reservations.get(upload.uploadId);
    if (reservation) reservation.finishing = true;

    try {
      const metadata = stagedMetadataSchema.safeParse(upload.metadata);
      if (!metadata.success || upload.sizeBytes === undefined) {
        return fail('bad-request', 'Upload was not started by this server');
      }
      const { storyId, kind, filename } = metadata.data;

      const head = await this.staging.readHead(
        upload.uploadId,
        MEDIA_SNIFF_BYTES
      );
      const mimeType = sniffMediaType(head);
      if (!mimeType || !MEDIA_LIMITS[kind].mimeTypes.includes(mimeType)) {
        return fail('invalid-media', `This file is not a supported ${kind}`);
      }

      const stored = await this.stories.addOriginalMedia(storyId, {
        kind,
        mimeType,
        sizeBytes: upload.sizeBytes,
        originalFilename: filename ?? null,
        body: this.staging.open(upload.uploadId),
      });
      if (stored.ok) return stored;
      switch (stored.error) {
        case 'limit-reached':
          return fail('limit-reached', stored.message);
        case 'invalid-media':
          return fail('invalid-media', stored.message);
        default:
          return fail('not-draft', 'This story has already been submitted');
      }
    } finally {
      this.reservations.delete(upload.uploadId);
      await this.staging.remove(upload.uploadId);
    }
  }

  /** Frees the slot of an upload the client terminated. */
  release(uploadId: string) {
    this.reservations.delete(uploadId);
  }

  /**
   * Removes expired drafts with their media, and unfinished uploads past the
   * draft lifetime. Meant to run periodically.
   */
  async sweep() {
    const drafts = await this.stories.sweepExpiredDrafts();
    const stagedUploads = await this.staging.removeExpired();

    const cutoffMs = this.clock.nowMs() - DRAFT_LIFETIME_MS;
    for (const [uploadId, reservation] of this.reservations) {
      if (reservation.startedAtMs <= cutoffMs) {
        this.reservations.delete(uploadId);
      }
    }
    return { drafts, stagedUploads };
  }

  private async evictUnfinished(
    storyId: number,
    kind: MediaKind,
    slots: number
  ) {
    const unfinished = [...this.reservations.entries()]
      .filter(
        ([, r]) => r.storyId === storyId && r.kind === kind && !r.finishing
      )
      .sort(([, a], [, b]) => a.startedAtMs - b.startedAtMs);

    while (unfinished.length >= slots && unfinished.length > 0) {
      const [uploadId] = unfinished.shift()!;
      this.reservations.delete(uploadId);
      await this.staging.remove(uploadId);
    }
  }
}
