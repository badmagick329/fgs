-- Separate phone and email fields (FGS-22): alumni give either or both. The
-- old single `contact` value is moved into whichever column it matches.
-- Re-runnable because tests apply every migration: the move only runs while
-- `contact` still exists.
ALTER TABLE alumni_stories
  ADD COLUMN IF NOT EXISTS phone TEXT NULL,
  ADD COLUMN IF NOT EXISTS email TEXT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alumni_stories' AND column_name = 'contact'
  ) THEN
    UPDATE alumni_stories
       SET email = CASE WHEN contact LIKE '%@%' THEN contact END,
           phone = CASE WHEN contact NOT LIKE '%@%' THEN contact END;
    ALTER TABLE alumni_stories DROP COLUMN contact;
  END IF;
END $$;

ALTER TABLE alumni_stories
  DROP CONSTRAINT IF EXISTS alumni_stories_phone_or_email_check;
ALTER TABLE alumni_stories
  ADD CONSTRAINT alumni_stories_phone_or_email_check
    CHECK (phone IS NOT NULL OR email IS NOT NULL);
