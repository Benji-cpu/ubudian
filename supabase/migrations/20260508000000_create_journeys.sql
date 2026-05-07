-- ============================================================================
-- Journeys: time-bounded curated experiences
-- ============================================================================
-- A Journey is a packaged path through Ubud's conscious-community scene —
-- composed of typed `journey_days`, each with morning/afternoon/evening slots
-- filled by `journey_atoms` (events, accommodation, food, places, rituals,
-- practitioners, reflections). Density is intentionally light (1-2 anchors/day,
-- rest days as a feature).
--
-- The thin `experiences` table from migration 20260326200000 is left in place
-- for backward compatibility but is no longer used by the public site after
-- this migration ships. It can be dropped in a later migration once we are
-- certain there are no external readers.

-- ----------------------------------------------------------------------------
-- 1. journeys: top-level journey definition
-- ----------------------------------------------------------------------------
CREATE TABLE journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  tier TEXT NOT NULL DEFAULT 'living_guide'
    CHECK (tier IN ('living_guide', 'self_paced', 'signature_cohort')),
  length_days INTEGER NOT NULL CHECK (length_days BETWEEN 1 AND 30),
  archetype_tags TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  hero_quote TEXT,
  summary TEXT,
  whats_included TEXT,
  who_its_for TEXT,
  practical_info TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX journeys_tier_published_idx ON journeys (tier, is_published);
CREATE INDEX journeys_sort_idx ON journeys (sort_order);

-- ----------------------------------------------------------------------------
-- 2. journey_days: days within a journey (1..length_days)
-- ----------------------------------------------------------------------------
CREATE TABLE journey_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1),
  day_type TEXT NOT NULL DEFAULT 'light'
    CHECK (day_type IN ('arrival', 'light', 'active', 'rest', 'closing')),
  theme TEXT NOT NULL,
  theme_subtitle TEXT,
  intention TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (journey_id, day_number)
);

CREATE INDEX journey_days_journey_idx ON journey_days (journey_id, day_number);

-- ----------------------------------------------------------------------------
-- 3. journey_atoms: reusable building blocks
-- ----------------------------------------------------------------------------
-- An atom can be:
--   - a curated reference to a real `events` row (kind='event_ref' + event_id)
--   - an evergreen entity we author (kind in ['ritual','place','reflection'])
--   - a partner/practitioner-backed offering (kind in ['accommodation',
--     'restaurant','practitioner'] + partner_id and/or practitioner_id)
CREATE TABLE journey_atoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN (
    'event_ref',
    'accommodation',
    'restaurant',
    'practitioner',
    'place',
    'ritual',
    'reflection'
  )),
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  theme_tags TEXT[] DEFAULT '{}',
  archetype_tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  affiliate_url TEXT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  practitioner_id UUID,
  partner_id UUID,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  google_maps_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX journey_atoms_kind_idx ON journey_atoms (kind, is_active);
CREATE INDEX journey_atoms_theme_tags_idx ON journey_atoms USING GIN (theme_tags);
CREATE INDEX journey_atoms_archetype_tags_idx ON journey_atoms USING GIN (archetype_tags);

-- ----------------------------------------------------------------------------
-- 4. journey_day_slots: slots within a day (morning/afternoon/evening)
-- ----------------------------------------------------------------------------
CREATE TABLE journey_day_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_day_id UUID NOT NULL REFERENCES journey_days(id) ON DELETE CASCADE,
  slot_window TEXT NOT NULL CHECK (slot_window IN ('morning', 'afternoon', 'evening')),
  position INTEGER NOT NULL DEFAULT 0,
  is_optional BOOLEAN DEFAULT FALSE,
  atom_kinds TEXT[] DEFAULT '{}',
  theme_tags TEXT[] DEFAULT '{}',
  curated_atom_id UUID REFERENCES journey_atoms(id) ON DELETE SET NULL,
  prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX journey_day_slots_day_idx ON journey_day_slots (journey_day_id, slot_window, position);

-- ----------------------------------------------------------------------------
-- 5. practitioners: sound healers, massage therapists, breathwork guides, etc.
-- ----------------------------------------------------------------------------
-- Empty at launch; populated as practitioners are recruited.
CREATE TABLE practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  modalities TEXT[] DEFAULT '{}',
  bio TEXT,
  photo_url TEXT,
  contact_whatsapp TEXT,
  contact_email TEXT,
  contact_instagram TEXT,
  base_location TEXT,
  theme_tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX practitioners_active_idx ON practitioners (is_active);
CREATE INDEX practitioners_modalities_idx ON practitioners USING GIN (modalities);

-- ----------------------------------------------------------------------------
-- 6. partners: villas, hotels, restaurants, studios with affiliate arrangements
-- ----------------------------------------------------------------------------
-- Empty at launch.
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN (
    'villa',
    'hotel',
    'homestay',
    'restaurant',
    'cafe',
    'studio',
    'spa',
    'other'
  )),
  description TEXT,
  affiliate_url TEXT,
  commission_rate NUMERIC(5,2),
  contact_whatsapp TEXT,
  contact_email TEXT,
  base_location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX partners_kind_active_idx ON partners (kind, is_active);

-- ----------------------------------------------------------------------------
-- Deferred FKs: journey_atoms.practitioner_id, journey_atoms.partner_id
-- ----------------------------------------------------------------------------
ALTER TABLE journey_atoms
  ADD CONSTRAINT journey_atoms_practitioner_fk
  FOREIGN KEY (practitioner_id) REFERENCES practitioners(id) ON DELETE SET NULL;

ALTER TABLE journey_atoms
  ADD CONSTRAINT journey_atoms_partner_fk
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL;

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE journeys           ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_days       ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_day_slots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_atoms      ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioners      ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners           ENABLE ROW LEVEL SECURITY;

-- Public read: published journeys, their days/slots, active atoms/practitioners/partners
CREATE POLICY "Anyone can view published journeys"
  ON journeys FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Anyone can view days of published journeys"
  ON journey_days FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM journeys
    WHERE journeys.id = journey_days.journey_id
      AND journeys.is_published = TRUE
  ));

CREATE POLICY "Anyone can view slots of published journey days"
  ON journey_day_slots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM journey_days jd
    JOIN journeys j ON j.id = jd.journey_id
    WHERE jd.id = journey_day_slots.journey_day_id
      AND j.is_published = TRUE
  ));

CREATE POLICY "Anyone can view active atoms"
  ON journey_atoms FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Anyone can view active practitioners"
  ON practitioners FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Anyone can view active partners"
  ON partners FOR SELECT
  USING (is_active = TRUE);

-- Admin-only write for everything
CREATE POLICY "Admins can manage journeys"
  ON journeys FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage journey_days"
  ON journey_days FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage journey_day_slots"
  ON journey_day_slots FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage journey_atoms"
  ON journey_atoms FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage practitioners"
  ON practitioners FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage partners"
  ON partners FOR ALL USING (is_admin());
