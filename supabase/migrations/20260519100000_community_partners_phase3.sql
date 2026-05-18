-- Community Partners — Phase 3
--
-- Adds:
--   1. Self-service columns on `sponsors` (claimed_by_profile_id, stripe_*)
--   2. `sponsor_leads` for /partners pitch-page lead capture
--   3. `sponsorship_events` for impressions + profile-view analytics

-- ============================================================================
-- Sponsors: self-service + Stripe linkage
-- ============================================================================

ALTER TABLE sponsors
  ADD COLUMN IF NOT EXISTS claimed_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;

CREATE INDEX IF NOT EXISTS sponsors_claimed_by_idx ON sponsors(claimed_by_profile_id);
CREATE INDEX IF NOT EXISTS sponsors_stripe_subscription_idx ON sponsors(stripe_subscription_id);

-- Allow a claiming profile to read their own sponsor row (even when paused/ended)
-- so the /sponsor/dashboard can still load.
DROP POLICY IF EXISTS "Claimed sponsor self-read" ON sponsors;
CREATE POLICY "Claimed sponsor self-read"
  ON sponsors FOR SELECT
  USING (claimed_by_profile_id = auth.uid());

-- Allow a claiming profile to update a small subset of fields on their sponsor
-- row. Tier, status, stripe_*, category_sponsor, and claimed_by_profile_id
-- remain admin-only. The application enforces field-level restrictions; this
-- policy gates row-level access. Field protection is handled at the API layer.
DROP POLICY IF EXISTS "Claimed sponsor self-update" ON sponsors;
CREATE POLICY "Claimed sponsor self-update"
  ON sponsors FOR UPDATE
  USING (claimed_by_profile_id = auth.uid())
  WITH CHECK (claimed_by_profile_id = auth.uid());

-- ============================================================================
-- sponsor_leads — lead capture from public /partners pitch page
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsor_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_whatsapp TEXT,
  website_url TEXT,
  tier_interest TEXT
    CHECK (tier_interest IS NULL OR tier_interest IN ('patron','partner','anchor','unsure')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','converted','dismissed')),
  admin_notes TEXT,
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sponsor_leads_status_created_idx
  ON sponsor_leads(status, created_at DESC);

ALTER TABLE sponsor_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sponsor leads"
  ON sponsor_leads FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- sponsorship_events — basic impression + profile-view counter
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsorship_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('event_impression','profile_view','partner_click')),
  -- Optional context: which event/edition/etc triggered this (NULL for profile_view)
  context_entity_type TEXT,
  context_entity_id UUID,
  -- Short rolling-window dedup key (e.g. hashed session+day) so we don't double-count
  -- a single visitor refreshing a page. Application-supplied, opaque.
  dedupe_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index for dedup: at most one row per (sponsor, type, dedupe_key)
-- where dedupe_key is non-null. Lets the writer use upsert(ignoreDuplicates=true).
CREATE UNIQUE INDEX IF NOT EXISTS sponsorship_events_dedupe_idx
  ON sponsorship_events(sponsor_id, event_type, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS sponsorship_events_sponsor_created_idx
  ON sponsorship_events(sponsor_id, created_at DESC);

ALTER TABLE sponsorship_events ENABLE ROW LEVEL SECURITY;

-- Admin-only read; writes happen via service-role (admin client) from the
-- impression-tracking helper. No public access.
CREATE POLICY "Admins read sponsorship events"
  ON sponsorship_events FOR SELECT
  USING (is_admin());

-- Claimed sponsor can read their own events (for the self-service analytics card).
CREATE POLICY "Claimed sponsor reads own events"
  ON sponsorship_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sponsors
      WHERE sponsors.id = sponsorship_events.sponsor_id
        AND sponsors.claimed_by_profile_id = auth.uid()
    )
  );
