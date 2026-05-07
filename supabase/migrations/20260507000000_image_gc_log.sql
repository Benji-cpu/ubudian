-- Audit table for image garbage collection sweeps run by the daily-maintenance
-- cron. Records each storage object that was deleted so we can prove what was
-- removed (or recover the original_url if needed for forensics).
--
-- The actual storage object is gone; we keep only the URL string and the row
-- it belonged to. Text data on the source row (e.g. events.description) is
-- preserved indefinitely for AI corpus value — see CLAUDE.md.

CREATE TABLE IF NOT EXISTS image_gc_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,            -- 'event' (only events GC'd today; future: tours/blog)
  entity_id UUID NOT NULL,              -- the source row id (no FK — row may be hard-deleted later)
  storage_path TEXT NOT NULL,           -- in-bucket path that was removed, e.g. 'events/abc.jpg'
  original_url TEXT NOT NULL,           -- the full public URL prior to deletion
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS image_gc_log_entity_idx
  ON image_gc_log (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS image_gc_log_collected_at_idx
  ON image_gc_log (collected_at DESC);

ALTER TABLE image_gc_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view image_gc_log"
  ON image_gc_log FOR SELECT
  USING (is_admin());
