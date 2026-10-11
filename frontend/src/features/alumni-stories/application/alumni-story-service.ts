import {
  AlumniStory,
  AlumniStoryMedia,
  AlumniStoryReviewDecision,
  AlumniStoryStatus,
  CreateAlumniStoryDraft,
  DRAFT_LIFETIME_MS,
  MEDIA_LIMITS,
  MediaKind,
  canReview,
  canSubmit,
  mediaUploadViolation,
} from '@/features/alumni-stories/domain/alumni-story';
import {
  IAlumniStoryRepository,
  IMediaStore,
} from '@/features/alumni-stories/domain/interfaces';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { IClock } from '@/lib/server/i-clock';

export type AlumniStoryError =
  | 'not-found'
  | 'not-draft'
  | 'invalid-media'
  | 'limit-reached'
  | 'empty-story'
  | 'not-reviewable';

export type AlumniStoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AlumniStoryError; message: string };

const MIME_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/3gpp': '3gp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/** Only the hash is stored, so a database leak does not expose live tokens. */
export const hashUploadToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const storyMediaPrefix = (storyId: number) => `stories/${storyId}`;

const fail = <T>(
  error: AlumniStoryError,
  message: string
): AlumniStoryResult<T> => ({ ok: false, error, message });

export class AlumniStoryService {
  constructor(
    private readonly repository: IAlumniStoryRepository,
    private readonly mediaStore: IMediaStore,
    private readonly clock: IClock
  ) {}

  /**
   * Creates the draft an alumnus uploads media into. The returned token is the
   * only credential for that draft; it is shown once and expires with it.
   */
  async createDraft(input: CreateAlumniStoryDraft) {
    const uploadToken = randomBytes(32).toString('base64url');
    const uploadTokenExpiresAt = new Date(
      this.clock.nowMs() + DRAFT_LIFETIME_MS
    );
    const story = await this.repository.createDraft({
      ...input,
      uploadTokenHash: hashUploadToken(uploadToken),
      uploadTokenExpiresAt,
    });
    return { story, uploadToken, uploadTokenExpiresAt };
  }

  findDraftByUploadToken(token: string) {
    return this.repository.findDraftByUploadTokenHash(
      hashUploadToken(token),
      this.clock.now()
    );
  }

  countOriginalMedia(storyId: number, kind: MediaKind) {
    return this.repository.countOriginalMedia(storyId, kind);
  }

  /**
   * Stores an original upload and records it. Limits are checked before the
   * bytes are written and again, atomically, when the row is inserted; the
   * stored object is removed whenever the row is refused.
   */
  async addOriginalMedia(
    storyId: number,
    upload: {
      kind: MediaKind;
      mimeType: string;
      sizeBytes: number;
      originalFilename: string | null;
      body: ReadableStream<Uint8Array>;
    }
  ): Promise<AlumniStoryResult<AlumniStoryMedia>> {
    const existing = await this.repository.countOriginalMedia(
      storyId,
      upload.kind
    );
    const violation = mediaUploadViolation(upload, existing);
    if (violation) {
      await upload.body.cancel();
      return fail(
        existing >= MEDIA_LIMITS[upload.kind].maxCount
          ? 'limit-reached'
          : 'invalid-media',
        violation
      );
    }

    const storageKey = `${storyMediaPrefix(storyId)}/${randomUUID()}.${MIME_EXTENSIONS[upload.mimeType]}`;
    const { sizeBytes } = await this.mediaStore.put(storageKey, upload.body);
    if (sizeBytes !== upload.sizeBytes) {
      await this.mediaStore.delete(storageKey);
      return fail(
        'invalid-media',
        `Expected ${upload.sizeBytes} bytes but received ${sizeBytes}`
      );
    }

    const outcome = await this.repository.addMedia(
      storyId,
      {
        kind: upload.kind,
        variant: 'original',
        storageKey,
        mimeType: upload.mimeType,
        sizeBytes,
        originalFilename: upload.originalFilename,
      },
      MEDIA_LIMITS[upload.kind].maxCount
    );
    if (!outcome.ok) {
      await this.mediaStore.delete(storageKey);
      return outcome.reason === 'not-draft'
        ? fail('not-draft', 'This story has already been submitted')
        : fail(
            'limit-reached',
            `A story can have at most ${MEDIA_LIMITS[upload.kind].maxCount} ${upload.kind}s`
          );
    }
    return { ok: true, data: outcome.media };
  }

  /**
   * Submits the draft `token` belongs to. Submitting moves the story out of
   * `draft`, which is the only state a token unlocks, so the token is spent.
   */
  async submitWithUploadToken(
    token: string
  ): Promise<AlumniStoryResult<AlumniStory>> {
    const draft = await this.findDraftByUploadToken(token);
    if (!draft) {
      return fail(
        'not-draft',
        'This upload link has expired or the story was already submitted'
      );
    }
    return this.submit(draft.id);
  }

  async submit(storyId: number): Promise<AlumniStoryResult<AlumniStory>> {
    const found = await this.repository.getWithMedia(storyId);
    if (!found) return fail('not-found', 'Story not found');
    if (found.story.status !== 'draft') {
      return fail('not-draft', 'This story has already been submitted');
    }

    const originals = found.media.filter((m) => m.variant === 'original');
    if (!canSubmit(found.story, originals.length)) {
      return fail(
        'empty-story',
        'Add your story as text, a video or photos before submitting'
      );
    }

    const story = await this.repository.markSubmitted(
      storyId,
      this.clock.now()
    );
    return story
      ? { ok: true, data: story }
      : fail('not-draft', 'This story has already been submitted');
  }

  /**
   * Removes drafts whose upload window has closed. Files go first, so a
   * failure leaves the row behind for the next sweep instead of orphaning
   * files no row points at.
   */
  async sweepExpiredDrafts() {
    const now = this.clock.now();
    const storyIds = await this.repository.listExpiredDraftIds(now);
    for (const storyId of storyIds) {
      await this.mediaStore.deletePrefix(storyMediaPrefix(storyId));
    }
    return storyIds.length
      ? this.repository.deleteExpiredDrafts(storyIds, now)
      : 0;
  }

  listByStatus(status: AlumniStoryStatus) {
    return this.repository.listByStatus(status);
  }

  getWithMedia(storyId: number) {
    return this.repository.getWithMedia(storyId);
  }

  async review(
    storyId: number,
    decision: AlumniStoryReviewDecision,
    adminUserId: number
  ): Promise<AlumniStoryResult<AlumniStory>> {
    const found = await this.repository.getWithMedia(storyId);
    if (!found) return fail('not-found', 'Story not found');
    if (!canReview(found.story.status)) {
      return fail('not-reviewable', 'Drafts cannot be reviewed');
    }

    const story = await this.repository.setReview(
      storyId,
      decision,
      adminUserId,
      this.clock.now()
    );
    return story
      ? { ok: true, data: story }
      : fail('not-reviewable', 'Drafts cannot be reviewed');
  }
}
