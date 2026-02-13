-- Database initialization script
CREATE TABLE IF NOT EXISTS registrations (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    registration_message TEXT,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    email_status TEXT DEFAULT 'pending' CHECK (email_status IN ('pending', 'success', 'failed')) NOT NULL,
    retry_count INT DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_user_id INT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    replaced_by_token_id INT REFERENCES admin_refresh_tokens(id)
);

CREATE TABLE IF NOT EXISTS admin_config (
    id INT PRIMARY KEY CHECK (id = 1),
    notification_email TEXT NOT NULL,
    updated_by_admin_user_id INT NOT NULL REFERENCES admin_users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at column on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the registrations table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at') THEN
        CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON registrations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Attach the trigger to the admin_users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_admin_users_updated_at') THEN
        CREATE TRIGGER set_admin_users_updated_at
        BEFORE UPDATE ON admin_users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Ensure at least one super admin exists on upgraded databases
WITH first_admin AS (
    SELECT id
    FROM admin_users
    ORDER BY id ASC
    LIMIT 1
)
UPDATE admin_users
SET is_super_admin = TRUE
WHERE id = (SELECT id FROM first_admin)
  AND NOT EXISTS (
    SELECT 1 FROM admin_users WHERE is_super_admin = TRUE
  );

-- Attach the trigger to the admin_config table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_admin_config_updated_at') THEN
        CREATE TRIGGER set_admin_config_updated_at
        BEFORE UPDATE ON admin_config
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
