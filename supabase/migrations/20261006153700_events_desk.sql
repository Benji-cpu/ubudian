-- Events desk (6 Oct 2026): the Claude routine that reads organisers' Instagram
-- posts and venue pages, picks the week's best, and writes Ben a monthly report.
-- The bus is the private repo Benji-cpu/ubudian-events-bus; these tables are
-- what the site keeps. Additive only.

-- The week's picks, chosen by the routine on Tuesdays (Wed–Tue weeks).
CREATE TABLE IF NOT EXISTS event_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rank smallint NOT NULL,
  why text NOT NULL CHECK (char_length(why) BETWEEN 10 AND 140),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_start, event_id)
);
CREATE INDEX IF NOT EXISTS event_picks_week_idx ON event_picks (week_start, rank);
ALTER TABLE event_picks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "picks are public" ON event_picks;
CREATE POLICY "picks are public" ON event_picks FOR SELECT USING (true);

-- Reader signals, anonymous: "I'm interested" taps and ticket/source clicks.
-- Written only by /api/events/signal (service role); never readable publicly.
CREATE TABLE IF NOT EXISTS event_signals (
  id bigserial PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('interest', 'ticket_click')),
  anon_id text NOT NULL CHECK (char_length(anon_id) BETWEEN 8 AND 64),
  day date NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Makassar')::date),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS event_signals_interest_once
  ON event_signals (event_id, anon_id) WHERE kind = 'interest';
CREATE UNIQUE INDEX IF NOT EXISTS event_signals_click_daily
  ON event_signals (event_id, anon_id, day) WHERE kind = 'ticket_click';
CREATE INDEX IF NOT EXISTS event_signals_event_idx ON event_signals (event_id, kind);
ALTER TABLE event_signals ENABLE ROW LEVEL SECURITY;

-- "Know a teacher or venue we're missing?" Only handles and links that match a
-- pattern ever reach the routine; free text stays here for /admin/curation.
CREATE TABLE IF NOT EXISTS source_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body text NOT NULL CHECK (char_length(body) BETWEEN 3 AND 500),
  handles text[] NOT NULL DEFAULT '{}',
  urls text[] NOT NULL DEFAULT '{}',
  ip_hash text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'passed', 'ignored')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE source_suggestions ENABLE ROW LEVEL SECURITY;

-- The routine's monthly report for Ben (also emailed to ADMIN_EMAIL).
CREATE TABLE IF NOT EXISTS curation_reports (
  month text PRIMARY KEY CHECK (month ~ '^\d{4}-\d{2}$'),
  markdown text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  emailed_at timestamptz
);
ALTER TABLE curation_reports ENABLE ROW LEVEL SECURITY;

-- Source rows the bus ingests under (pre-parsed; off the Vercel cron like the
-- other GH harvesters — curator-ingest and events-bus/ingest don't read is_enabled).
INSERT INTO event_sources (name, slug, source_type, config, is_enabled)
VALUES
  ('Instagram (organisers'' posts, events desk)', 'instagram', 'api', '{"_preParsed": true, "_skipClassification": true}', false),
  ('Venue and organiser pages (events desk)', 'web-pages', 'api', '{"_preParsed": true, "_skipClassification": true}', false)
ON CONFLICT (slug) DO NOTHING;
