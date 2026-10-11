-- The display page will be built by hand from stories the school picks
-- (decided 2026-10-11), so no admin sets an order and no worker writes a
-- transcoded 'display' copy. Re-runnable because tests apply every migration.
ALTER TABLE alumni_stories DROP COLUMN IF EXISTS display_order;

ALTER TABLE alumni_story_media
  DROP CONSTRAINT IF EXISTS alumni_story_media_variant_check;
ALTER TABLE alumni_story_media
  ADD CONSTRAINT alumni_story_media_variant_check
    CHECK (variant IN ('original', 'edited'));
