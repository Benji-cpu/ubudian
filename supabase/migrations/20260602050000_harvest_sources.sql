-- GH-Actions harvest sources. Each is push-fed (POSTed to /api/cron/curator-ingest
-- or /api/cron/instagram-ingest by a GH Actions workflow), NOT pulled by the Vercel
-- cron — so is_enabled=false keeps the cron from trying to run a non-existent adapter.
-- The ingest routes resolve the row by slug regardless of is_enabled.

INSERT INTO event_sources (name, slug, source_type, config, is_enabled, fetch_interval_minutes)
SELECT 'Blissbase (harvest)', 'blissbase', 'api',
       '{"_preParsed": true, "_skipClassification": true}'::jsonb, false, NULL
WHERE NOT EXISTS (SELECT 1 FROM event_sources WHERE slug = 'blissbase');

INSERT INTO event_sources (name, slug, source_type, config, is_enabled, fetch_interval_minutes)
SELECT 'Soulwise (harvest)', 'soulwise', 'api',
       '{"_preParsed": true, "_skipClassification": true}'::jsonb, false, NULL
WHERE NOT EXISTS (SELECT 1 FROM event_sources WHERE slug = 'soulwise');

-- Instagram is NOT pre-parsed — captions need the LLM (instagram-ingest route runs
-- parseEventFromImage / classifyAndParseMessage), so no _preParsed flag here.
INSERT INTO event_sources (name, slug, source_type, config, is_enabled, fetch_interval_minutes)
SELECT 'Public Instagram (free harvest)', 'instagram-public', 'instagram',
       '{}'::jsonb, false, NULL
WHERE NOT EXISTS (SELECT 1 FROM event_sources WHERE slug = 'instagram-public');

-- Move Megatix off the Vercel cron (it 504s on the 50-event geocode sweep even at
-- maxDuration=60). It is now harvested by scripts/scrape/megatix-harvest.mjs in GH
-- Actions and POSTed to curator-ingest (source=megatix), which keeps its existing
-- _preParsed config + year-roll guard.
UPDATE event_sources SET is_enabled = false, updated_at = now()
WHERE slug = 'megatix' AND is_enabled = true;
