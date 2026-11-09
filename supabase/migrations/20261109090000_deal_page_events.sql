-- Deal page counter (Ben, 9 Nov 2026: "one new table that counts views and taps on each deal
-- page, no personal data"). Venues ask how many readers see their deal: this gives each venue
-- a real number for its own /deals/<slug> page.
-- One row per view (once per venue per browser session) or tap (map, website, Instagram, share,
-- booking). venue_slug is venueSlug() in src/lib/specials/deal-page.ts.
-- No IP, user agent, referrer, cookie id or user id, ever. Written by POST /api/deals/track and
-- read by getDealPageCounts() (src/lib/specials/deal-counts.ts), both with the service role.
-- RLS on with no policies: nobody but the service role reads or writes it.

CREATE TABLE IF NOT EXISTS deal_page_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  venue_slug text NOT NULL,
  special_id uuid NULL REFERENCES specials(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('view','map','website','instagram','share','book')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_page_events_venue_created_idx ON deal_page_events (venue_slug, created_at DESC);

ALTER TABLE deal_page_events ENABLE ROW LEVEL SECURITY;
