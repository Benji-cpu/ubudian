-- ============================================================================
-- Atom image credit infrastructure + saved_journeys
-- ============================================================================
-- Two related additions, batched into one migration:
--
-- 1. journey_atoms gains `image_credit` (plain-text caption) and
--    `image_credit_url` (optional link target). The journey detail page
--    renders the caption beneath each atom image so attribution is honest:
--    Hujan Locale's atom image, for example, currently shows
--    "Representative · visit Hujan Locale →" linking to their Instagram. As
--    real venue press images come in, the caption can shift to
--    "Photo: @hujanlocale" without a schema change.
--
-- 2. saved_journeys mirrors the saved_events pattern. Logged-in users tap a
--    heart on a journey hero to come back to it; the dashboard surfaces the
--    list. Profile-owner-only RLS keeps each user's queue private.

ALTER TABLE journey_atoms
  ADD COLUMN IF NOT EXISTS image_credit TEXT,
  ADD COLUMN IF NOT EXISTS image_credit_url TEXT;

CREATE TABLE IF NOT EXISTS saved_journeys (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, journey_id)
);

CREATE INDEX IF NOT EXISTS saved_journeys_profile_idx
  ON saved_journeys (profile_id, created_at DESC);

ALTER TABLE saved_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own saved journeys"
  ON saved_journeys FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users save their own journeys"
  ON saved_journeys FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users unsave their own journeys"
  ON saved_journeys FOR DELETE
  USING (profile_id = auth.uid());

CREATE POLICY "Admins manage saved_journeys"
  ON saved_journeys FOR ALL
  USING (is_admin());
