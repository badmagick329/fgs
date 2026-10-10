-- Alumni Connect (FGS-10). Statuses and variants are CHECK constraints rather
-- than enum types so the file stays re-runnable (tests apply it repeatedly).
-- reviewed_by_admin_user_id has no FK: admin_users is owned by the email
-- worker's schema, not by these migrations.
CREATE TABLE IF NOT EXISTS alumni_stories (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  full_name TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  profession TEXT NOT NULL,
  contact TEXT NOT NULL,
  story_text TEXT NULL,
  upload_token_hash TEXT NULL UNIQUE,
  upload_token_expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ NULL,
  reviewed_at TIMESTAMPTZ NULL,
  reviewed_by_admin_user_id INTEGER NULL,
  display_order INTEGER NULL
);

CREATE INDEX IF NOT EXISTS alumni_stories_status_created_at_idx
  ON alumni_stories (status, created_at DESC);

CREATE TABLE IF NOT EXISTS alumni_story_media (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL REFERENCES alumni_stories(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('video', 'photo')),
  variant TEXT NOT NULL DEFAULT 'original'
    CHECK (variant IN ('original', 'edited', 'display')),
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  original_filename TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alumni_story_media_story_id_idx
  ON alumni_story_media (story_id);
