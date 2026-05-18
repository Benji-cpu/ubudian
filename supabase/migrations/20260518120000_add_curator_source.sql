-- Daily curator source — Claude-curated dance + tantra + ceremony picks.
-- See .claude/agents/daily-curator.md for the agent that produces inbox payloads
-- and src/app/api/cron/curator-ingest/route.ts for the route that consumes them.
-- Push-driven (GH Actions on commit to curator/inbox/**), so no fetch_interval.

INSERT INTO event_sources (name, slug, source_type, config, fetch_interval_minutes, is_enabled, auto_approve_enabled, auto_approve_threshold)
VALUES (
  'Curator (Claude daily)',
  'curator',
  'api',
  jsonb_build_object(
    'description', 'Claude-curated dance + tantra + ceremony picks',
    '_preParsed', true,
    '_skipClassification', true
  ),
  NULL,
  true,
  false,
  0.85
)
ON CONFLICT (slug) DO NOTHING;
