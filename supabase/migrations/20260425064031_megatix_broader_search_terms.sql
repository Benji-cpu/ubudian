-- Broaden Megatix search terms so daily ingestion surfaces more Ubud events
-- that get dedup-matched (and now auto-enriched) onto existing image-less
-- events from WhatsApp/Telegram/manual entry.
--
-- Adds: dance, tantra, cacao, kirtan, paradiso, dissolve, contact improv,
-- meditation, retreat. Existing locality + known-venue filters still gate
-- results to Ubud-area only.
--
-- Also raises max_events_per_run from 15 -> 50 since the run budget is
-- governed primarily by max_list_pages (20) and the per-page fetch delay.

UPDATE event_sources
SET config = jsonb_set(
    jsonb_set(
        config,
        '{search_terms}',
        '["ubud", "yoga barn", "sayuri", "ecstatic dance", "breathwork", "sound healing", "dance", "tantra", "cacao", "kirtan", "paradiso", "dissolve", "contact improv", "meditation", "retreat"]'::jsonb
    ),
    '{max_events_per_run}',
    '50'::jsonb
)
WHERE slug = 'megatix';
