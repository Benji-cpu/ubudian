-- Community Partners (sponsorship) program.
-- Two tables: `sponsors` (the partner business) and `sponsorships` (the placement
-- attaching a sponsor to an entity — event, newsletter edition, journey, story,
-- or an entire event category). The existing `newsletter_editions.sponsor_*`
-- columns stay for now as a fallback; the route prefers `sponsorships`.

CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  website_url TEXT,
  instagram_handle TEXT,
  contact_email TEXT,
  contact_whatsapp TEXT,
  tier TEXT NOT NULL DEFAULT 'patron'
    CHECK (tier IN ('patron','partner','anchor')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','ended')),
  -- Only meaningful when tier='anchor'. One of the event categories from constants.ts
  -- (e.g. 'Dance & Movement', 'Tantra & Intimacy'). NULL for non-category sponsors.
  category_sponsor TEXT,
  -- Internal accounting only; not exposed in the public profile.
  monthly_amount_cents INTEGER,
  starts_on DATE,
  ends_on DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sponsors_status_tier_idx ON sponsors(status, tier);
CREATE UNIQUE INDEX IF NOT EXISTS sponsors_category_unique
  ON sponsors(category_sponsor)
  WHERE category_sponsor IS NOT NULL AND status = 'active';

CREATE TABLE IF NOT EXISTS sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL
    CHECK (entity_type IN ('event','newsletter_edition','journey','story')),
  entity_id UUID NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- NULL = ongoing (no scheduled end).
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sponsorships_entity_idx
  ON sponsorships(entity_type, entity_id, ends_at);
CREATE INDEX IF NOT EXISTS sponsorships_sponsor_idx
  ON sponsorships(sponsor_id);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;

-- Public read: active sponsors are visible to anyone (directory + credit rendering).
CREATE POLICY "Anyone can view active sponsors"
  ON sponsors FOR SELECT
  USING (status = 'active');

-- Public read: sponsorship rows are readable so unauth users can see which event/
-- edition is linked to which active sponsor. The sponsor itself is gated by the
-- policy above, so a paused sponsor's name still won't leak.
CREATE POLICY "Anyone can view sponsorships"
  ON sponsorships FOR SELECT
  USING (true);

-- Admin: full access to sponsors + sponsorships.
CREATE POLICY "Admins can manage sponsors"
  ON sponsors FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage sponsorships"
  ON sponsorships FOR ALL
  USING (is_admin());
