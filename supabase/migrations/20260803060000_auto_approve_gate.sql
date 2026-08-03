-- The autonomous editorial gate (see src/lib/maintenance/auto-approve.ts).
--
-- Context: pipeline.ts inserts every ingested event as status='pending' because
-- "the daily Claude approver routine is the editorial gate". That trigger was
-- disabled 2026-05-20 and the human routine that replaced it last ran
-- 2026-06-10. Between then and 2026-08-03, ~19 events/night landed in pending
-- and zero were ever approved -- archivePastPendingEvents() quietly archived
-- each one as its date passed.
--
-- auto_approved_at marks every row published by the machine rather than by a
-- person. It exists so the change is reversible in one statement:
--
--   UPDATE events
--      SET status = 'pending', auto_approved_at = NULL, ai_approved_at = NULL
--    WHERE auto_approved_at IS NOT NULL;
--
-- It is also the honest audit trail: "approved" no longer implies a human
-- looked at it, and anything reading events.status should be able to tell.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS auto_approved_at TIMESTAMPTZ;

COMMENT ON COLUMN events.auto_approved_at IS
  'Set when the autonomous editorial gate published this event. NULL means a human (or an older automated approver) approved it. Reverse an auto-approval run by filtering on this column.';

-- The gate scans pending events ordered by start_date. Partial index keeps that
-- scan cheap as the archived corpus grows.
CREATE INDEX IF NOT EXISTS idx_events_pending_start_date
  ON events (start_date)
  WHERE status = 'pending';

-- The `curator` event_sources row has been is_enabled = true since
-- 20260518120000 with fetch_interval_minutes NULL, but no adapter registers
-- sourceSlug 'curator' -- curator events arrive via POST /api/cron/curator-ingest,
-- not by polling. So the Vercel ingest-events cron has been treating it as due
-- on every tick and logging a failed run ("No adapter registered for source:
-- curator"). Later push-ingest sources set is_enabled = false for exactly this
-- reason (see 20260602040000); this one was missed.
UPDATE event_sources
   SET is_enabled = FALSE,
       updated_at = NOW()
 WHERE slug = 'curator'
   AND is_enabled = TRUE;
