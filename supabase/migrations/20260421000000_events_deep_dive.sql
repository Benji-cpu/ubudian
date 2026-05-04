-- Events deep-dive redesign foundation.
--
-- Adds the columns and tables the new events surfaces rely on:
--   * Geo coordinates on events + a canonical venue_coordinates cache for
--     the map-based discovery view (Nominatim / OSM backed).
--   * Audit trail for AI moderation decisions so we can debug auto-approvals
--     and auto-rejections without a human queue.
--   * Per-profile ICS feed token so users can subscribe their saved events
--     to Apple / Google Calendar.

-- ----------------------------------------------------------------------
-- events: geo + moderation audit
-- ----------------------------------------------------------------------

ALTER TABLE events ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE events ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ai_approved_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

-- Backfill ai_approved_at for events already auto-approved by the pipeline
-- (source_id is set on ingested events; user submissions have no source).
UPDATE events
SET ai_approved_at = COALESCE(ai_approved_at, updated_at, created_at)
WHERE status = 'approved'
  AND source_id IS NOT NULL
  AND ai_approved_at IS NULL;

CREATE INDEX IF NOT EXISTS events_geo_idx
  ON events (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS events_ranking_idx
  ON events (start_date, quality_score DESC NULLS LAST)
  WHERE status = 'approved';

-- ----------------------------------------------------------------------
-- venue_coordinates: canonical venue → lat/lng cache
-- ----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS venue_coordinates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT UNIQUE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geocoded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'nominatim',  -- nominatim | manual
  confidence REAL
);

ALTER TABLE venue_coordinates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_coordinates_public_read"
  ON venue_coordinates FOR SELECT
  USING (true);

CREATE POLICY "venue_coordinates_admin_write"
  ON venue_coordinates FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ----------------------------------------------------------------------
-- profiles: ICS calendar feed token
-- ----------------------------------------------------------------------

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ics_token TEXT UNIQUE;
