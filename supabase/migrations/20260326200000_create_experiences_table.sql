CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  cover_image_url TEXT,
  description TEXT NOT NULL,
  who_its_for TEXT,
  practical_info TEXT,
  category TEXT NOT NULL,
  archetype_tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- Public: read active experiences
CREATE POLICY "Anyone can view active experiences"
  ON experiences FOR SELECT
  USING (is_active = true);

-- Admin: full access
CREATE POLICY "Admins can manage experiences"
  ON experiences FOR ALL
  USING (is_admin());
