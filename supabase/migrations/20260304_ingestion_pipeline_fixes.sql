-- Ingestion Pipeline Robustness Fixes
-- 1. New unresolved_venues table for tracking unknown venue names
-- 2. RPC for atomic seen_count increment
-- 3. Index on events.source_url for Layer 1 dedup

-- ============================================
-- UNRESOLVED VENUES TABLE
-- Tracks venue names that don't match any alias
-- ============================================

CREATE TABLE unresolved_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_name TEXT NOT NULL,
  normalized_name TEXT UNIQUE NOT NULL,
  seen_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'unresolved', -- 'unresolved' | 'resolved' | 'ignored'
  resolved_canonical_name TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
);

-- RLS
ALTER TABLE unresolved_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage unresolved venues"
  ON unresolved_venues FOR ALL
  USING (public.is_admin());

-- Indexes
CREATE INDEX idx_unresolved_venues_status ON unresolved_venues(status);
CREATE INDEX idx_unresolved_venues_seen_count ON unresolved_venues(seen_count DESC);

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
-- INDEX: Speed up Layer 1 dedup URL lookups
-- ============================================

CREATE INDEX IF NOT EXISTS idx_events_source_url ON events(source_url);
