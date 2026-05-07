-- Register the apify-instagram adapter as an event_sources row so the pipeline
-- can run it. One row, multiple handles; the adapter's `handles` array
-- can be extended to include more venues without a new migration.
--
-- auto_approve_enabled is FALSE on purpose — image OCR of weekly schedule
-- posters is a new code path. First few cycles should be eyeballed in
-- /admin/ingestion before flipping this on.
--
-- fetch_interval_minutes is 10080 (one week) — Paradiso re-posts the schedule
-- weekly. Note: the daily ingest cron does not currently honour
-- fetch_interval_minutes; for now an admin uses the per-source "Run now"
-- button in /admin/ingestion/sources, or the source is fired manually.

INSERT INTO event_sources (
  id,
  name,
  slug,
  source_type,
  config,
  is_enabled,
  fetch_interval_minutes,
  auto_approve_enabled,
  auto_approve_threshold
)
VALUES (
  gen_random_uuid(),
  'Public Instagram (Apify)',
  'apify-instagram',
  'instagram',
  '{
    "handles": ["paradisoubud"],
    "max_posts_per_handle": 8,
    "min_caption_length": 0
  }'::jsonb,
  true,
  10080,
  false,
  0.85
)
ON CONFLICT (slug) DO NOTHING;
