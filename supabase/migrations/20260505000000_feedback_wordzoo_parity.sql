-- Feedback module parity with WordZoo reference (cross-project standard).
--
-- 1. Adds activity_trail (jsonb), viewport_width / viewport_height (int),
--    route_params (jsonb) so the admin queue has full reproduction context
--    for every submission.
-- 2. Migrates the legacy 'resolved' status to the cross-project standard
--    'actioned'. Existing rows are rewritten in place.
-- 3. Idempotent — safe to re-run.

ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS activity_trail JSONB,
  ADD COLUMN IF NOT EXISTS viewport_width INTEGER,
  ADD COLUMN IF NOT EXISTS viewport_height INTEGER,
  ADD COLUMN IF NOT EXISTS route_params JSONB;

-- Migrate any existing 'resolved' rows to 'actioned'.
UPDATE feedback SET status = 'actioned' WHERE status = 'resolved';
