-- Add last_refreshed_at to events so the daily refresher can prioritize
-- least-recently-refreshed events and stay within the cron time budget.
--
-- The refresher re-fetches source URLs for events with a source_url to
-- pick up updated cover images, prices, and ticket URLs, and to archive
-- listings that have been removed (404). NULL means never refreshed —
-- we sort NULLS FIRST so newly-linked events get refreshed first.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS events_refresh_queue_idx
  ON events (last_refreshed_at NULLS FIRST)
  WHERE status = 'approved' AND source_url IS NOT NULL;
