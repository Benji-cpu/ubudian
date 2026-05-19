-- The partial unique index on sponsorship_events (WHERE dedupe_key IS NOT NULL)
-- isn't usable by Postgres' ON CONFLICT clause, so the analytics upsert was
-- failing with `42P10 there is no unique or exclusion constraint matching the
-- ON CONFLICT specification`. Replace it with a full unique index — Postgres
-- treats NULL ≠ NULL in unique constraints, so the behaviour for NULL dedupe
-- keys is unchanged (every NULL row is its own).

DROP INDEX IF EXISTS sponsorship_events_dedupe_idx;

CREATE UNIQUE INDEX IF NOT EXISTS sponsorship_events_dedupe_idx
  ON sponsorship_events(sponsor_id, event_type, dedupe_key);
