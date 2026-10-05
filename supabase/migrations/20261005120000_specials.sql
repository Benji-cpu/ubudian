-- Restaurant specials: the "Tonight in Ubud" hook (handovers/2026-10-05-ubudian-growth.md).
--
-- One row is one recurring deal at one venue ("pasta + wine, Tuesdays, 135k").
-- The venue lives inline rather than in `places`: a special arrives from a
-- form, a seed or (later) a WhatsApp photo, and most venues will never get a
-- curated `places` page. `place_id` links one when it exists.
--
-- Freshness is by rule, not by a queue (MEMORY.md, "the failure mode this
-- project keeps repeating"): every special carries `expires_on`, 30 days after
-- it was last confirmed, and public reads drop it after that date. Nothing
-- waits for a human.

CREATE TABLE IF NOT EXISTS specials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_name text NOT NULL,
  venue_area text,
  venue_address text,
  google_maps_url text,
  instagram_handle text,
  website_url text,
  place_id uuid REFERENCES places(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  price_idr integer CHECK (price_idr IS NULL OR price_idr >= 0),
  -- 0 = Sunday … 6 = Saturday (same as BaliNow.dayOfWeek). Empty = every day.
  weekdays smallint[] NOT NULL DEFAULT '{}'::smallint[],
  start_time time,
  end_time time,
  status text NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'hidden')),
  source text NOT NULL CHECK (source IN ('form', 'seed', 'whatsapp', 'instagram', 'admin')),
  source_url text,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  expires_on date NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Makassar')::date + 30),
  -- Private: how we reach the venue to reconfirm. Never rendered publicly.
  contact_name text,
  contact_phone text,
  contact_email text,
  not_honoured_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (weekdays <@ ARRAY[0,1,2,3,4,5,6]::smallint[])
);

CREATE INDEX IF NOT EXISTS specials_live_idx ON specials (status, expires_on);

ALTER TABLE specials ENABLE ROW LEVEL SECURITY;

-- Public reads go through the admin client in server components (so the
-- private contact columns are never selectable by anon); this policy only
-- lets an admin session manage rows directly.
CREATE POLICY specials_admin_all ON specials FOR ALL USING (is_admin()) WITH CHECK (is_admin());
