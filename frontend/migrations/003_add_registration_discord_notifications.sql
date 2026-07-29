DO $$
BEGIN
    IF to_regclass('public.admin_config') IS NOT NULL THEN
        ALTER TABLE admin_config
            ADD COLUMN IF NOT EXISTS registration_discord_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;
