-- Edited videos (FGS-19). The public page shows the alumnus's original video
-- unless an admin uploads an edit and picks it. A story holds at most one
-- edited video, replaced in place, so the choice names a single file and the
-- original is never touched.
ALTER TABLE alumni_stories
  ADD COLUMN IF NOT EXISTS public_video_variant TEXT NOT NULL DEFAULT 'original'
    CHECK (public_video_variant IN ('original', 'edited'));

CREATE UNIQUE INDEX IF NOT EXISTS alumni_story_media_one_edited_video_idx
  ON alumni_story_media (story_id)
  WHERE kind = 'video' AND variant = 'edited';
