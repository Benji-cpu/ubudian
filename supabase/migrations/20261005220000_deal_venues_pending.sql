-- Venue self-serve (/venue) and reviewed submissions.
-- Plan: Code/handovers/2026-10-05-ubudian-deals.md items 1 and 4.
--
-- * `deal_venues`: one row per venue. `owner_user_id` is set when a signed-in
--   owner claims it with the private confirm link the venue was emailed.
-- * `specials.status` gains `pending`: a new deal from a venue (form or /venue)
--   waits for the daily review instead of going live at once.
-- * `specials.pending_changes`: an owner's edit to a LIVE deal waits here, so the
--   live version stays up until the review applies the change.
-- * `review_note`/`reviewed_at`: what the daily review decided and why. A deal
--   it flags stays pending with the note, and the admin sees it on /admin/deals.

CREATE TABLE IF NOT EXISTS deal_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area text,
  address text,
  website_url text,
  instagram_handle text,
  google_maps_url text,
  contact_name text,
  contact_phone text,
  contact_email text,
  research_notes jsonb,
  researched_at timestamptz,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS deal_venues_name_key ON deal_venues (lower(name));
CREATE INDEX IF NOT EXISTS deal_venues_owner_idx ON deal_venues (owner_user_id);

ALTER TABLE deal_venues ENABLE ROW LEVEL SECURITY;
-- All reads and writes go through server routes with the admin client; this
-- policy only lets an admin session manage rows directly.
CREATE POLICY deal_venues_admin_all ON deal_venues FOR ALL USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE specials ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES deal_venues(id) ON DELETE SET NULL;
ALTER TABLE specials ADD COLUMN IF NOT EXISTS pending_changes jsonb;
ALTER TABLE specials ADD COLUMN IF NOT EXISTS submitted_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE specials ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE specials ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
CREATE INDEX IF NOT EXISTS specials_venue_idx ON specials (venue_id);

ALTER TABLE specials DROP CONSTRAINT IF EXISTS specials_status_check;
ALTER TABLE specials ADD CONSTRAINT specials_status_check CHECK (status IN ('live', 'hidden', 'pending'));

-- Backfill: one venue per distinct venue name, carrying the first contact seen.
INSERT INTO deal_venues (name, area, address, website_url, instagram_handle, google_maps_url, contact_name, contact_phone, contact_email)
SELECT DISTINCT ON (lower(venue_name))
  venue_name, venue_area, venue_address, website_url, instagram_handle, google_maps_url, contact_name, contact_phone, contact_email
FROM specials
ORDER BY lower(venue_name), (contact_email IS NULL), created_at
ON CONFLICT DO NOTHING;

UPDATE specials s SET venue_id = v.id
FROM deal_venues v
WHERE s.venue_id IS NULL AND lower(s.venue_name) = lower(v.name);
