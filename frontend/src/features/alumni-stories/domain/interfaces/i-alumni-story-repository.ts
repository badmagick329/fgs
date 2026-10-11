import {
  AlumniStory,
  AlumniStoryMedia,
  AlumniStoryReviewDecision,
  AlumniStoryStatus,
  AlumniStorySummary,
  AlumniStoryWithMedia,
  CreateAlumniStoryDraft,
  MediaKind,
  NewAlumniStoryMedia,
} from '@/features/alumni-stories/domain/alumni-story';

export type AddMediaOutcome =
  | { ok: true; media: AlumniStoryMedia }
  | { ok: false; reason: 'not-draft' | 'limit-reached' };

export interface IAlumniStoryRepository {
  createDraft(
    input: CreateAlumniStoryDraft & {
      uploadTokenHash: string;
      uploadTokenExpiresAt: Date;
    }
  ): Promise<AlumniStory>;
  /** The draft holding this upload token, if the token has not expired. */
  findDraftByUploadTokenHash(
    tokenHash: string,
    now: Date
  ): Promise<AlumniStory | null>;
  /**
   * Adds media while holding a lock on the story row, so parallel uploads
   * finishing together cannot exceed `maxOfKind`.
   */
  addMedia(
    storyId: number,
    media: NewAlumniStoryMedia,
    maxOfKind: number
  ): Promise<AddMediaOutcome>;
  countOriginalMedia(storyId: number, kind?: MediaKind): Promise<number>;
  /** Marks a draft pending and retires its upload token. */
  markSubmitted(storyId: number, now: Date): Promise<AlumniStory | null>;
  /** Drafts whose upload window closed before `now` without a submit. */
  listExpiredDraftIds(now: Date): Promise<number[]>;
  /**
   * Deletes those of `storyIds` that are still expired drafts, with their
   * media rows, and returns how many went.
   */
  deleteExpiredDrafts(storyIds: number[], now: Date): Promise<number>;
  listByStatus(status: AlumniStoryStatus): Promise<AlumniStorySummary[]>;
  getWithMedia(storyId: number): Promise<AlumniStoryWithMedia | null>;
  setReview(
    storyId: number,
    decision: AlumniStoryReviewDecision,
    adminUserId: number,
    now: Date
  ): Promise<AlumniStory | null>;
}
