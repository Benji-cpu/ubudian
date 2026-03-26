-- Add TicketTailor as an event source (disabled until API keys are configured)
INSERT INTO event_sources (name, slug, source_type, config, is_enabled, fetch_interval_minutes)
VALUES (
  'TicketTailor',
  'tickettailor',
  'api',
  '{"_preParsed": true, "organizers": []}',
  false,
  1440
)
ON CONFLICT (slug) DO NOTHING;
