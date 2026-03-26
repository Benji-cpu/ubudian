-- Add Megatix event source for ingestion pipeline
INSERT INTO event_sources (id, name, slug, source_type, config, is_enabled, fetch_interval_minutes, auto_approve_enabled, auto_approve_threshold)
VALUES (
  gen_random_uuid(),
  'Megatix',
  'megatix',
  'api',
  '{
    "_preParsed": true,
    "search_terms": ["ubud"],
    "ubud_localities": ["Ubud", "Gianyar", "Peliatan", "Mas", "Sayan", "Campuhan", "Penestanan", "Nyuh Kuning", "Keliki", "Lodtunduh", "Tegallalang", "Kedewatan", "Singakerta"],
    "fetch_delay_ms": 750,
    "max_events_per_run": 50
  }'::jsonb,
  true,
  1440,
  false,
  0.85
)
ON CONFLICT (slug) DO NOTHING;
