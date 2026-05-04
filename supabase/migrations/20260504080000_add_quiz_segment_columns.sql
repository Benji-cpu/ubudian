-- Quiz redesign: add segment routing and primary archetype tracking.
-- Idempotent: safe to re-apply.

ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS user_segment TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_archetype TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_segment TEXT;
