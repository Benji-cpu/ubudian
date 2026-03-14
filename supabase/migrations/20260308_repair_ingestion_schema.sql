-- Repair: ingestion schema was registered as applied (version 20260303)
-- but tables were never created. This migration re-applies everything
-- with IF NOT EXISTS / idempotent guards.

-- Remove the stale migration record so version tracking is accurate
DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260303';

-- ============================================
-- EVENT SOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT TRUE,
  fetch_interval_minutes INTEGER DEFAULT 240,
  last_fetched_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  events_ingested_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INGESTION RUNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES event_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  messages_fetched INTEGER DEFAULT 0,
  messages_parsed INTEGER DEFAULT 0,
  events_created INTEGER DEFAULT 0,
  duplicates_found INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RAW INGESTION MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS raw_ingestion_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES event_sources(id) ON DELETE CASCADE,
  run_id UUID REFERENCES ingestion_runs(id) ON DELETE SET NULL,
  external_id TEXT,
  content_text TEXT,
  content_html TEXT,
  image_urls TEXT[],
  sender_name TEXT,
  sender_id TEXT,
  raw_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  parsed_event_data JSONB,
  parse_error TEXT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VENUE ALIASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS venue_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alias)
);

-- ============================================
-- DEDUP MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dedup_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_a_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_b_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL,
  confidence REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_a_id, event_b_id)
);

-- ============================================
-- UNRESOLVED VENUES TABLE (from pipeline fixes)
-- ============================================
CREATE TABLE IF NOT EXISTS unresolved_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_name TEXT NOT NULL,
  normalized_name TEXT UNIQUE NOT NULL,
  seen_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'unresolved',
  resolved_canonical_name TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
);

-- ============================================
-- ALTER EVENTS TABLE — Add ingestion columns
-- ============================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES event_sources(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_event_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS content_fingerprint TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS raw_message_id UUID REFERENCES raw_ingestion_messages(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS llm_parsed BOOLEAN DEFAULT FALSE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE event_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_ingestion_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE dedup_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE unresolved_venues ENABLE ROW LEVEL SECURITY;

-- Policies (drop first to be idempotent)
DROP POLICY IF EXISTS "Admins can manage event sources" ON event_sources;
CREATE POLICY "Admins can manage event sources" ON event_sources FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage ingestion runs" ON ingestion_runs;
CREATE POLICY "Admins can manage ingestion runs" ON ingestion_runs FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage raw messages" ON raw_ingestion_messages;
CREATE POLICY "Admins can manage raw messages" ON raw_ingestion_messages FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage venue aliases" ON venue_aliases;
CREATE POLICY "Admins can manage venue aliases" ON venue_aliases FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read venue aliases" ON venue_aliases;
CREATE POLICY "Anyone can read venue aliases" ON venue_aliases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage dedup matches" ON dedup_matches;
CREATE POLICY "Admins can manage dedup matches" ON dedup_matches FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage unresolved venues" ON unresolved_venues;
CREATE POLICY "Admins can manage unresolved venues" ON unresolved_venues FOR ALL USING (public.is_admin());

-- ============================================
-- PERFORMANCE INDEXES (IF NOT EXISTS)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_event_sources_enabled ON event_sources(is_enabled);
CREATE INDEX IF NOT EXISTS idx_event_sources_type ON event_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source ON ingestion_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status ON ingestion_runs(status);
CREATE INDEX IF NOT EXISTS idx_raw_messages_source ON raw_ingestion_messages(source_id);
CREATE INDEX IF NOT EXISTS idx_raw_messages_status ON raw_ingestion_messages(status);
CREATE INDEX IF NOT EXISTS idx_raw_messages_external_id ON raw_ingestion_messages(source_id, external_id);
CREATE INDEX IF NOT EXISTS idx_venue_aliases_alias ON venue_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_venue_aliases_canonical ON venue_aliases(canonical_name);
CREATE INDEX IF NOT EXISTS idx_dedup_matches_status ON dedup_matches(status);
CREATE INDEX IF NOT EXISTS idx_dedup_matches_events ON dedup_matches(event_a_id, event_b_id);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source_id);
CREATE INDEX IF NOT EXISTS idx_events_fingerprint ON events(content_fingerprint);
CREATE INDEX IF NOT EXISTS idx_events_source_event_id ON events(source_id, source_event_id);
CREATE INDEX IF NOT EXISTS idx_events_source_url ON events(source_url);
CREATE INDEX IF NOT EXISTS idx_unresolved_venues_status ON unresolved_venues(status);
CREATE INDEX IF NOT EXISTS idx_unresolved_venues_seen_count ON unresolved_venues(seen_count DESC);

-- ============================================
-- RPC: Atomic increment for seen_count
-- ============================================
CREATE OR REPLACE FUNCTION increment_venue_seen_count(
  p_normalized_name TEXT,
  p_raw_name TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO unresolved_venues (raw_name, normalized_name, seen_count, first_seen_at, last_seen_at, status)
  VALUES (p_raw_name, p_normalized_name, 1, NOW(), NOW(), 'unresolved')
  ON CONFLICT (normalized_name) DO UPDATE SET
    seen_count = unresolved_venues.seen_count + 1,
    last_seen_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED VENUE ALIASES
-- ============================================
INSERT INTO venue_aliases (canonical_name, alias) VALUES
  ('The Yoga Barn', 'Yoga Barn'),
  ('The Yoga Barn', 'yoga barn ubud'),
  ('The Yoga Barn', 'The Yoga Barn Ubud'),
  ('Pyramids of Chi', 'pyramids of chi ubud'),
  ('Pyramids of Chi', 'Pyramids Of Chi Ubud'),
  ('Pyramids of Chi', 'POC Ubud'),
  ('Outpost', 'Outpost Ubud'),
  ('Outpost', 'outpost coworking'),
  ('Outpost', 'Outpost Co-working'),
  ('Hubud', 'Hubud Bali'),
  ('Hubud', 'hubud coworking'),
  ('Alchemy', 'Alchemy Ubud'),
  ('Alchemy', 'Alchemy Bali'),
  ('CP Lounge', 'CP Lounge Ubud'),
  ('CP Lounge', 'CPUB'),
  ('Ubud Palace', 'Puri Saren Agung'),
  ('Ubud Palace', 'Puri Saren'),
  ('ARMA Museum', 'Agung Rai Museum of Art'),
  ('ARMA Museum', 'ARMA'),
  ('Neka Art Museum', 'Neka Museum'),
  ('Neka Art Museum', 'Neka'),
  ('Museum Puri Lukisan', 'Puri Lukisan'),
  ('Museum Puri Lukisan', 'Puri Lukisan Museum'),
  ('Intuitive Flow', 'Intuitive Flow Yoga'),
  ('Intuitive Flow', 'Intuitive Flow Ubud'),
  ('Radiantly Alive', 'Radiantly Alive Yoga'),
  ('Radiantly Alive', 'Radiantly Alive Ubud'),
  ('Taksu', 'Taksu Ubud'),
  ('Taksu', 'Taksu Spa'),
  ('Bridges Bali', 'Bridges Restaurant'),
  ('Bridges Bali', 'Bridges Ubud'),
  ('Locavore', 'Locavore Ubud'),
  ('Locavore', 'Locavore Restaurant'),
  ('Sacred Monkey Forest Sanctuary', 'Monkey Forest'),
  ('Sacred Monkey Forest Sanctuary', 'Monkey Forest Ubud'),
  ('Sacred Monkey Forest Sanctuary', 'Sacred Monkey Forest'),
  ('Campuhan Ridge Walk', 'Campuhan Ridge'),
  ('Campuhan Ridge Walk', 'Campuhan Walk'),
  ('Fivelements', 'Fivelements Bali'),
  ('Fivelements', 'Five Elements'),
  ('Bambu Indah', 'Bambu Indah Ubud'),
  ('Komaneka', 'Komaneka at Bisma'),
  ('Komaneka', 'Komaneka Ubud'),
  ('BaliSpirit Festival Grounds', 'BaliSpirit Festival'),
  ('BaliSpirit Festival Grounds', 'Bali Spirit Festival')
ON CONFLICT (alias) DO NOTHING;

-- Subscriber self-read policy
DROP POLICY IF EXISTS "Users can read own subscription" ON newsletter_subscribers;
CREATE POLICY "Users can read own subscription"
  ON newsletter_subscribers FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));
