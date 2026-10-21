-- FGS-28. The email worker stamps rows it is about to mail so two passes (or
-- two worker instances) never send the same registration. A stamp older than
-- the worker's claim timeout counts as abandoned and is claimable again, so a
-- crashed pass delays its rows instead of stranding them.
ALTER TABLE registration_requests
    ADD COLUMN IF NOT EXISTS email_claimed_at TIMESTAMPTZ NULL;
