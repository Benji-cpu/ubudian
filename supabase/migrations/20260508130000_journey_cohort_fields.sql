-- Cohort metadata for paid Ubud Retreats. Each journey can run as a hosted
-- cohort a few times a year — these fields surface the host, dates, neighbourhood,
-- size, and price band on the listing card and detail page so a visitor can see
-- *who, when, where, how many, what cost* without scrolling.
--
-- All fields nullable: a journey without an upcoming cohort still renders, just
-- without the facts panel. Seed values for the two launch journeys appended.

ALTER TABLE journeys
  ADD COLUMN IF NOT EXISTS host_name TEXT,
  ADD COLUMN IF NOT EXISTS host_role TEXT,
  ADD COLUMN IF NOT EXISTS host_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS cohort_size_min SMALLINT CHECK (cohort_size_min IS NULL OR cohort_size_min BETWEEN 1 AND 30),
  ADD COLUMN IF NOT EXISTS cohort_size_max SMALLINT CHECK (cohort_size_max IS NULL OR cohort_size_max BETWEEN 1 AND 30),
  ADD COLUMN IF NOT EXISTS villa_neighbourhood TEXT,
  ADD COLUMN IF NOT EXISTS price_per_person_cents INTEGER CHECK (price_per_person_cents IS NULL OR price_per_person_cents >= 0),
  ADD COLUMN IF NOT EXISTS next_cohort_starts_at DATE,
  ADD COLUMN IF NOT EXISTS next_cohort_ends_at DATE,
  ADD COLUMN IF NOT EXISTS next_cohort_status TEXT CHECK (next_cohort_status IS NULL OR next_cohort_status IN ('open', 'almost_full', 'full', 'waitlist'));

COMMENT ON COLUMN journeys.host_name IS 'First name of the editorial host running this cohort.';
COMMENT ON COLUMN journeys.host_role IS 'Short role line, e.g. "Founder, The Ubudian".';
COMMENT ON COLUMN journeys.cohort_size_max IS 'Max guests per cohort. The defensible "small cohort" promise.';
COMMENT ON COLUMN journeys.villa_neighbourhood IS 'Penestanan / Nyuh Kuning / Sayan / etc.';
COMMENT ON COLUMN journeys.price_per_person_cents IS 'Single-occupancy retail in cents USD.';
COMMENT ON COLUMN journeys.next_cohort_starts_at IS 'First day of the next scheduled cohort. NULL when nothing is scheduled.';
COMMENT ON COLUMN journeys.next_cohort_status IS 'Open / almost full / full / waitlist — drives the CTA copy.';

-- Seed values for the two launch journeys. Dates intentionally a few months
-- out so the page reads "future cohort" not "past cohort." Prices in cents.
UPDATE journeys
SET
  host_name = 'Benji',
  host_role = 'Founder, The Ubudian',
  cohort_size_min = 4,
  cohort_size_max = 6,
  villa_neighbourhood = 'Penestanan',
  price_per_person_cents = 168000,
  next_cohort_starts_at = '2026-07-12',
  next_cohort_ends_at = '2026-07-14',
  next_cohort_status = 'open'
WHERE slug = '3-day-ubud-reset';

UPDATE journeys
SET
  host_name = 'Benji',
  host_role = 'Founder, The Ubudian',
  cohort_size_min = 6,
  cohort_size_max = 8,
  villa_neighbourhood = 'Nyuh Kuning',
  price_per_person_cents = 298000,
  next_cohort_starts_at = '2026-08-09',
  next_cohort_ends_at = '2026-08-15',
  next_cohort_status = 'almost_full'
WHERE slug = '7-days-embodied-awakening';
