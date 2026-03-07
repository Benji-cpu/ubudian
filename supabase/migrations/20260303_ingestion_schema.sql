-- Event Ingestion & Deduplication Schema
-- Adds tables and columns for automated event ingestion pipeline

-- ============================================
-- EVENT SOURCES TABLE
-- Tracks where events are ingested from
-- ============================================

CREATE TABLE event_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL, -- 'telegram' | 'api' | 'scraper' | 'whatsapp' | 'facebook' | 'instagram' | 'manual'
  config JSONB DEFAULT '{}',  -- adapter-specific config (API keys ref, selectors, group IDs, etc.)
  is_enabled BOOLEAN DEFAULT TRUE,
  fetch_interval_minutes INTEGER DEFAULT 240, -- default 4 hours
  last_fetched_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  events_ingested_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INGESTION RUNS TABLE
-- Tracks each ingestion pipeline execution
-- ============================================

CREATE TABLE ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES event_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running', -- 'running' | 'completed' | 'failed'
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
-- Stores raw content before parsing
-- ============================================

CREATE TABLE raw_ingestion_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES event_sources(id) ON DELETE CASCADE,
  run_id UUID REFERENCES ingestion_runs(id) ON DELETE SET NULL,
  external_id TEXT, -- message ID from source platform (e.g., Telegram message_id)
  content_text TEXT,
  content_html TEXT,
  image_urls TEXT[],
  sender_name TEXT,
  sender_id TEXT,
  raw_data JSONB, -- full original payload
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'parsed' | 'not_event' | 'failed' | 'duplicate'
  parsed_event_data JSONB, -- structured output from LLM
  parse_error TEXT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- linked event if created
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VENUE ALIASES TABLE
-- Maps alternate venue names to canonical names
-- ============================================

CREATE TABLE venue_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alias)
);

-- ============================================
-- DEDUP MATCHES TABLE
-- Tracks potential and resolved duplicates
-- ============================================

CREATE TABLE dedup_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_a_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_b_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL, -- 'exact_url' | 'fingerprint' | 'fuzzy_title' | 'semantic'
  confidence REAL NOT NULL, -- 0.0 to 1.0
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed_dup' | 'not_dup' | 'merged'
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}', -- match details (similarity scores, LLM reasoning, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_a_id, event_b_id)
);

-- ============================================
-- ALTER EVENTS TABLE — Add ingestion columns
-- ============================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES event_sources(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_event_id TEXT; -- external ID from source platform
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_url TEXT; -- original URL of event on source
ALTER TABLE events ADD COLUMN IF NOT EXISTS content_fingerprint TEXT; -- SHA-256 hash for dedup
ALTER TABLE events ADD COLUMN IF NOT EXISTS raw_message_id UUID REFERENCES raw_ingestion_messages(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS llm_parsed BOOLEAN DEFAULT FALSE; -- whether LLM was used to parse

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE event_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_ingestion_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE dedup_matches ENABLE ROW LEVEL SECURITY;

-- Admin-only access for all ingestion tables
CREATE POLICY "Admins can manage event sources"
  ON event_sources FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage ingestion runs"
  ON ingestion_runs FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage raw messages"
  ON raw_ingestion_messages FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage venue aliases"
  ON venue_aliases FOR ALL
  USING (public.is_admin());

CREATE POLICY "Anyone can read venue aliases"
  ON venue_aliases FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage dedup matches"
  ON dedup_matches FOR ALL
  USING (public.is_admin());

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

CREATE INDEX idx_event_sources_enabled ON event_sources(is_enabled);
CREATE INDEX idx_event_sources_type ON event_sources(source_type);
CREATE INDEX idx_ingestion_runs_source ON ingestion_runs(source_id);
CREATE INDEX idx_ingestion_runs_status ON ingestion_runs(status);
CREATE INDEX idx_raw_messages_source ON raw_ingestion_messages(source_id);
CREATE INDEX idx_raw_messages_status ON raw_ingestion_messages(status);
CREATE INDEX idx_raw_messages_external_id ON raw_ingestion_messages(source_id, external_id);
CREATE INDEX idx_venue_aliases_alias ON venue_aliases(alias);
CREATE INDEX idx_venue_aliases_canonical ON venue_aliases(canonical_name);
CREATE INDEX idx_dedup_matches_status ON dedup_matches(status);
CREATE INDEX idx_dedup_matches_events ON dedup_matches(event_a_id, event_b_id);
CREATE INDEX idx_events_source ON events(source_id);
CREATE INDEX idx_events_fingerprint ON events(content_fingerprint);
CREATE INDEX idx_events_source_event_id ON events(source_id, source_event_id);

-- ============================================
-- SEED INITIAL VENUE ALIASES
-- ============================================

INSERT INTO venue_aliases (canonical_name, alias) VALUES
  -- Yoga Barn
  ('The Yoga Barn', 'Yoga Barn'),
  ('The Yoga Barn', 'yoga barn ubud'),
  ('The Yoga Barn', 'The Yoga Barn Ubud'),
  -- Pyramids of Chi
  ('Pyramids of Chi', 'pyramids of chi ubud'),
  ('Pyramids of Chi', 'Pyramids Of Chi Ubud'),
  ('Pyramids of Chi', 'POC Ubud'),
  -- Outpost
  ('Outpost', 'Outpost Ubud'),
  ('Outpost', 'outpost coworking'),
  ('Outpost', 'Outpost Co-working'),
  -- Hubud
  ('Hubud', 'Hubud Bali'),
  ('Hubud', 'hubud coworking'),
  -- Alchemy
  ('Alchemy', 'Alchemy Ubud'),
  ('Alchemy', 'Alchemy Bali'),
  -- CP Lounge
  ('CP Lounge', 'CP Lounge Ubud'),
  ('CP Lounge', 'CPUB'),
  -- Ubud Palace
  ('Ubud Palace', 'Puri Saren Agung'),
  ('Ubud Palace', 'Puri Saren'),
  -- ARMA Museum
  ('ARMA Museum', 'Agung Rai Museum of Art'),
  ('ARMA Museum', 'ARMA'),
  -- Neka Museum
  ('Neka Art Museum', 'Neka Museum'),
  ('Neka Art Museum', 'Neka'),
  -- Museum Puri Lukisan
  ('Museum Puri Lukisan', 'Puri Lukisan'),
  ('Museum Puri Lukisan', 'Puri Lukisan Museum'),
  -- Intuitive Flow
  ('Intuitive Flow', 'Intuitive Flow Yoga'),
  ('Intuitive Flow', 'Intuitive Flow Ubud'),
  -- Radiantly Alive
  ('Radiantly Alive', 'Radiantly Alive Yoga'),
  ('Radiantly Alive', 'Radiantly Alive Ubud'),
  -- Taksu
  ('Taksu', 'Taksu Ubud'),
  ('Taksu', 'Taksu Spa'),
  -- Bridges Bali
  ('Bridges Bali', 'Bridges Restaurant'),
  ('Bridges Bali', 'Bridges Ubud'),
  -- Locavore
  ('Locavore', 'Locavore Ubud'),
  ('Locavore', 'Locavore Restaurant'),
  -- Sacred Monkey Forest
  ('Sacred Monkey Forest Sanctuary', 'Monkey Forest'),
  ('Sacred Monkey Forest Sanctuary', 'Monkey Forest Ubud'),
  ('Sacred Monkey Forest Sanctuary', 'Sacred Monkey Forest'),
  -- Campuhan Ridge
  ('Campuhan Ridge Walk', 'Campuhan Ridge'),
  ('Campuhan Ridge Walk', 'Campuhan Walk'),
  -- Fivelements
  ('Fivelements', 'Fivelements Bali'),
  ('Fivelements', 'Five Elements'),
  -- Bambu Indah
  ('Bambu Indah', 'Bambu Indah Ubud'),
  -- Komaneka
  ('Komaneka', 'Komaneka at Bisma'),
  ('Komaneka', 'Komaneka Ubud'),
  -- Bali Spirit Festival
  ('BaliSpirit Festival Grounds', 'BaliSpirit Festival'),
  ('BaliSpirit Festival Grounds', 'Bali Spirit Festival')
ON CONFLICT (alias) DO NOTHING;
