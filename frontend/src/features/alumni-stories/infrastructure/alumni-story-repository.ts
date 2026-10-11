import {
  AlumniStoryReviewDecision,
  AlumniStoryStatus,
  CreateAlumniStoryDraft,
  MediaKind,
  NewAlumniStoryMedia,
  alumniStoryMediaSchema,
  alumniStorySchema,
  alumniStorySummarySchema,
} from '@/features/alumni-stories/domain/alumni-story';
import {
  AddMediaOutcome,
  IAlumniStoryRepository,
} from '@/features/alumni-stories/domain/interfaces';
import { Pool } from 'pg';
import 'server-only';

// Never select the upload token hash: it stays inside this repository.
const STORY_COLUMNS = `
  id, status, full_name, graduation_year, profession, contact, story_text,
  created_at, submitted_at, reviewed_at, reviewed_by_admin_user_id,
  display_order`;

const STORY_COLUMNS_QUALIFIED = STORY_COLUMNS.split(',')
  .map((column) => `s.${column.trim()}`)
  .join(', ');

export class AlumniStoryRepository implements IAlumniStoryRepository {
  constructor(private readonly pool: Pool) {}

  async createDraft(
    input: CreateAlumniStoryDraft & {
      uploadTokenHash: string;
      uploadTokenExpiresAt: Date;
    }
  ) {
    const res = await this.pool.query(
      `INSERT INTO alumni_stories (
         full_name, graduation_year, profession, contact, story_text,
         upload_token_hash, upload_token_expires_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${STORY_COLUMNS}`,
      [
        input.fullName,
        input.graduationYear,
        input.profession,
        input.contact,
        input.storyText,
        input.uploadTokenHash,
        input.uploadTokenExpiresAt,
      ]
    );
    return alumniStorySchema.parse(res.rows[0]);
  }

  async findDraftByUploadTokenHash(tokenHash: string, now: Date) {
    const res = await this.pool.query(
      `SELECT ${STORY_COLUMNS}
       FROM alumni_stories
       WHERE upload_token_hash = $1
         AND status = 'draft'
         AND upload_token_expires_at > $2`,
      [tokenHash, now]
    );
    return res.rows[0] ? alumniStorySchema.parse(res.rows[0]) : null;
  }

  async addMedia(
    storyId: number,
    media: NewAlumniStoryMedia,
    maxOfKind: number
  ): Promise<AddMediaOutcome> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const story = await client.query<{ status: AlumniStoryStatus }>(
        `SELECT status FROM alumni_stories WHERE id = $1 FOR UPDATE`,
        [storyId]
      );
      if (story.rows[0]?.status !== 'draft') {
        await client.query('ROLLBACK');
        return { ok: false, reason: 'not-draft' };
      }

      if (media.variant === 'original') {
        const count = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
           FROM alumni_story_media
           WHERE story_id = $1 AND kind = $2 AND variant = 'original'`,
          [storyId, media.kind]
        );
        if (Number(count.rows[0].count) >= maxOfKind) {
          await client.query('ROLLBACK');
          return { ok: false, reason: 'limit-reached' };
        }
      }

      const res = await client.query(
        `INSERT INTO alumni_story_media (
           story_id, kind, variant, storage_key, mime_type, size_bytes,
           original_filename
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          storyId,
          media.kind,
          media.variant,
          media.storageKey,
          media.mimeType,
          media.sizeBytes,
          media.originalFilename,
        ]
      );
      await client.query('COMMIT');
      return { ok: true, media: alumniStoryMediaSchema.parse(res.rows[0]) };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async countOriginalMedia(storyId: number, kind?: MediaKind) {
    const res = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM alumni_story_media
       WHERE story_id = $1
         AND variant = 'original'
         AND ($2::text IS NULL OR kind = $2)`,
      [storyId, kind ?? null]
    );
    return Number(res.rows[0].count);
  }

  async markSubmitted(storyId: number, now: Date) {
    const res = await this.pool.query(
      `UPDATE alumni_stories
       SET status = 'pending',
           submitted_at = $2,
           upload_token_hash = NULL,
           upload_token_expires_at = NULL
       WHERE id = $1 AND status = 'draft'
       RETURNING ${STORY_COLUMNS}`,
      [storyId, now]
    );
    return res.rows[0] ? alumniStorySchema.parse(res.rows[0]) : null;
  }

  async listExpiredDraftIds(now: Date) {
    const res = await this.pool.query<{ id: number }>(
      `SELECT id FROM alumni_stories
       WHERE status = 'draft' AND upload_token_expires_at <= $1
       ORDER BY id`,
      [now]
    );
    return res.rows.map((row) => row.id);
  }

  async deleteExpiredDrafts(storyIds: number[], now: Date) {
    const res = await this.pool.query(
      `DELETE FROM alumni_stories
       WHERE id = ANY($1::int[])
         AND status = 'draft'
         AND upload_token_expires_at <= $2`,
      [storyIds, now]
    );
    return res.rowCount ?? 0;
  }

  async listByStatus(status: AlumniStoryStatus) {
    const res = await this.pool.query(
      `SELECT ${STORY_COLUMNS_QUALIFIED},
         COUNT(m.id) FILTER (WHERE m.kind = 'video' AND m.variant = 'original') AS video_count,
         COUNT(m.id) FILTER (WHERE m.kind = 'photo' AND m.variant = 'original') AS photo_count
       FROM alumni_stories s
       LEFT JOIN alumni_story_media m ON m.story_id = s.id
       WHERE s.status = $1
       GROUP BY s.id
       ORDER BY s.created_at DESC, s.id DESC`,
      [status]
    );
    return res.rows.map((row) => alumniStorySummarySchema.parse(row));
  }

  async getWithMedia(storyId: number) {
    const story = await this.pool.query(
      `SELECT ${STORY_COLUMNS} FROM alumni_stories WHERE id = $1`,
      [storyId]
    );
    if (!story.rows[0]) return null;

    const media = await this.pool.query(
      `SELECT * FROM alumni_story_media
       WHERE story_id = $1
       ORDER BY kind DESC, created_at ASC, id ASC`,
      [storyId]
    );
    return {
      story: alumniStorySchema.parse(story.rows[0]),
      media: media.rows.map((row) => alumniStoryMediaSchema.parse(row)),
    };
  }

  async setReview(
    storyId: number,
    decision: AlumniStoryReviewDecision,
    adminUserId: number,
    now: Date
  ) {
    const res = await this.pool.query(
      `UPDATE alumni_stories
       SET status = $2, reviewed_at = $3, reviewed_by_admin_user_id = $4
       WHERE id = $1 AND status <> 'draft'
       RETURNING ${STORY_COLUMNS}`,
      [storyId, decision, now, adminUserId]
    );
    return res.rows[0] ? alumniStorySchema.parse(res.rows[0]) : null;
  }
}
