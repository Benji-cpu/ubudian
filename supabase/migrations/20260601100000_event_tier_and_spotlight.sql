-- Diversity feed: two-tier events + the floating festival banner flag.
--
-- event_tier  — splits the conscious-community CORE feed (Dance & Movement,
--               Tantra & Intimacy, Ceremony & Sound, …) from the broader
--               DISCOVERY section ("More happenings in Ubud": festivals,
--               gallery openings, markets, food, performance). This axis is
--               ORTHOGONAL to is_core (which means "weekly community anchor"),
--               so a gallery opening is is_core=false AND event_tier='discovery'
--               without corrupting the existing "Core" pill semantics.
--
-- is_spotlight — editorial flag for the single floating banner that is allowed
--               to surface ABOVE the core feed when a big, time-sensitive
--               moment (a festival or market) is imminent. One banner max,
--               soonest spotlight wins. Deliberately a hand-set flag, not a
--               derived rule — the banner is the one wall-breach and stays
--               under editorial control.
--
-- Backfill is a verified no-op: every existing approved row is a conscious
-- category (zero approved events in Art & Culture / Music & Performance today),
-- so DEFAULT 'core' is correct for the entire current table.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_tier TEXT NOT NULL DEFAULT 'core'
    CHECK (event_tier IN ('core', 'discovery'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_spotlight BOOLEAN NOT NULL DEFAULT false;

-- Drives the tier+status+date read path on /events.
CREATE INDEX IF NOT EXISTS events_tier_status_start_idx
  ON events (event_tier, status, start_date);
