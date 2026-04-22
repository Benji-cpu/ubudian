-- site_settings: singleton row of admin-controlled public visibility flags.
-- Defaults are all FALSE so sections start hidden until admin flips them on.

CREATE TABLE IF NOT EXISTS site_settings (
  id                          INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  blog_enabled                BOOLEAN NOT NULL DEFAULT FALSE,
  stories_enabled             BOOLEAN NOT NULL DEFAULT FALSE,
  tours_enabled               BOOLEAN NOT NULL DEFAULT FALSE,
  newsletter_archive_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings public read" ON site_settings;
CREATE POLICY "site_settings public read" ON site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_settings admin update" ON site_settings;
CREATE POLICY "site_settings admin update" ON site_settings
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
