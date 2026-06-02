-- Phase 2 wiring + Megatix bound.
--
-- 1. ToDo.Today source row. Fed by the GH Actions harvester
--    (scripts/scrape/todo-today-harvest.mjs) which POSTs pre-parsed events to
--    /api/cron/curator-ingest with { source: "todo-today" }. is_enabled=false
--    on purpose: it is push-fed via GH Actions, not pulled by the Vercel cron
--    (there is no registered 'todo-today' adapter, so leaving it enabled would
--    make the cron log a failed "No adapter registered" run every tick). The
--    curator-ingest route resolves the row by slug regardless of is_enabled.
INSERT INTO event_sources (name, slug, source_type, config, is_enabled, fetch_interval_minutes)
SELECT 'ToDo.Today (Ubud harvest)', 'todo-today', 'api',
       '{"_preParsed": true, "_skipClassification": true}'::jsonb, false, NULL
WHERE NOT EXISTS (SELECT 1 FROM event_sources WHERE slug = 'todo-today');

-- 2. Bound Megatix so a single runIngestion() finishes within the 60s function
--    limit. The cron was 504-timing-out at 61s because the sweep processed up to
--    50 events across 20 list pages with 500ms delays (~10s of delay alone) plus
--    per-event dedup + venue-normalise + geocode. Tighter caps land ~15-20
--    events/run reliably; dedup means the next run picks up the rest.
UPDATE event_sources
SET config = config || '{"max_events_per_run": 20, "max_list_pages": 8, "fetch_delay_ms": 250}'::jsonb,
    updated_at = now()
WHERE slug = 'megatix';
