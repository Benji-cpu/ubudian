-- Feedback hardening + audit log for autonomous dedup decisions.
--
-- 1. Adds pr_url to feedback so the daily maintenance agent can record the
--    PR it opened in response to a piece of user feedback.
-- 2. Creates dedup_decisions audit table so the maintenance endpoint can log
--    every event auto-archived as a fuzzy duplicate (reversible if wrong).
-- 3. Ensures pg_trgm extension is available for similarity-based dedup.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS pr_url TEXT;

CREATE TABLE IF NOT EXISTS dedup_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kept_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  archived_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  similarity NUMERIC(4,3),
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  decided_by TEXT NOT NULL DEFAULT 'daily-maintenance'
);

CREATE INDEX IF NOT EXISTS idx_dedup_decisions_decided_at
  ON dedup_decisions(decided_at DESC);

ALTER TABLE dedup_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read dedup decisions" ON dedup_decisions;
CREATE POLICY "Admins can read dedup decisions"
  ON dedup_decisions FOR SELECT
  USING (public.is_admin());
