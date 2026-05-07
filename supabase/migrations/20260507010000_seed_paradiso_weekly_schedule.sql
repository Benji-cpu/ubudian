-- Seed Paradiso Ubud's weekly schedule from the May 1-7 + May 8-15 IG posters.
-- Cross-referenced both posters; only slots running in both weeks are recurring,
-- films/specials are one-offs and skipped.
--
-- Each row has a concrete first-upcoming start_date so it shows on /events
-- immediately, plus is_recurring=true with a day_of_week so future weeks roll
-- forward. content_fingerprint follows the recurring-aware shape introduced in
-- src/lib/ingestion/fingerprint.ts so future Apify-IG ingest runs collapse to
-- these rows via Layer 2 dedup.
--
-- Skipped slots (already in events table on prior ingests):
--   - Existing weekly Dance Temple, Dissolve Eros, Dissolve Play, Kinetic, etc.
--     are dated in the past with seed_kind/llm. They'll continue rolling forward
--     once the day_of_week fixes (separate migration if needed) land. Inserting
--     fresh future-dated rows here makes this week's schedule visible without
--     waiting on rendering changes.

WITH new_events(title, day_of_week, start_date, start_time, price_info, description, short_description, slug) AS (
  VALUES
    ('5Rhythms with Sophie',                                  5, DATE '2026-05-08', TIME '11:00',
      'Drop-in IDR 100K | Kitas/KTP IDR 140K | 5 passes IDR 700K',
      'Friday morning 5Rhythms practice led by Sophie at Paradiso Ubud. A movement meditation through the five rhythms — flowing, staccato, chaos, lyrical, stillness. Drop-in welcome.',
      'Friday morning 5Rhythms with Sophie. Drop-in welcome.',
      'paradiso-5rhythms-friday-with-sophie-weekly'),

    ('Kinetic: Practical Skills for Contact Dance',           6, DATE '2026-05-09', TIME '09:00',
      'Drop-in IDR 180K | 5 passes IDR 700K',
      'Saturday morning Contact Improv skills class at Paradiso Ubud. Builds technical foundation for contact dance practice — weight sharing, rolling point of contact, falling, lifting. All bodies welcome.',
      'Saturday Contact Improv skills class. Drop-in.',
      'paradiso-kinetic-contact-skills-weekly'),

    ('Dissolve :: Play | Intuitive Contact Improv Journey',   6, DATE '2026-05-09', TIME '11:30',
      'Drop-in IDR 100K',
      'Saturday late-morning intuitive contact improv journey at Paradiso Ubud. Open exploration of weight, touch, and shared movement — playful and accessible. Drop-in welcome.',
      'Saturday Dissolve :: Play intuitive contact improv. Drop-in.',
      'paradiso-dissolve-play-saturday-weekly'),

    ('Dance Temple :: A Deep & Delicious Dance Journey',      1, DATE '2026-05-11', TIME '16:00',
      'Drop-in IDR 200K',
      'Monday afternoon ecstatic dance journey with Tabesh & friends at Paradiso Ubud. A deep & delicious dance journey, tea lounge and community connection. Drop-in welcome.',
      'Monday Dance Temple — ecstatic dance with Tabesh & friends. Drop-in.',
      'paradiso-dance-temple-monday-weekly'),

    ('5Rhythms',                                              2, DATE '2026-05-12', TIME '17:00',
      'Drop-in IDR 100K | Kitas/KTP IDR 140K | 5 passes IDR 700K',
      'Tuesday afternoon 5Rhythms practice at Paradiso Ubud. A movement meditation through the five rhythms. Drop-in welcome.',
      'Tuesday 5Rhythms practice. Drop-in.',
      'paradiso-5rhythms-tuesday-weekly'),

    ('Dissolve :: Eros — Contact Improv',                     2, DATE '2026-05-12', TIME '18:00',
      'Drop-in IDR 100K',
      'Tuesday evening contact improv jam at Paradiso Ubud, exploring Eros — the erotic as a force in movement, presence, and contact. Drop-in welcome.',
      'Tuesday Dissolve :: Eros contact improv jam. Drop-in.',
      'paradiso-dissolve-eros-tuesday-weekly'),

    ('Entropic :: Contact Dance & Sound Odyssey',             3, DATE '2026-05-13', TIME '11:00',
      'Drop-in IDR 150K',
      'Wednesday morning contact dance and sound odyssey at Paradiso Ubud — a guided journey through movement and live sound. Drop-in welcome.',
      'Wednesday Entropic contact dance & sound odyssey. Drop-in.',
      'paradiso-entropic-wednesday-weekly'),

    ('Dissolve :: CI Skills Lab',                             4, DATE '2026-05-14', TIME '11:00',
      'Drop-in IDR 200K',
      'Thursday morning Contact Improvisation skills class and lab at Paradiso Ubud. Refines technical fundamentals — contact, weight, momentum — in a class-meets-lab format. Drop-in welcome.',
      'Thursday Dissolve :: CI skills lab. Drop-in.',
      'paradiso-dissolve-ci-skills-thursday-weekly'),

    ('Resonanz :: Ecstatic Dance',                            4, DATE '2026-05-14', TIME '18:00',
      'Online IDR 50K | At the door IDR 200K',
      'Thursday evening ecstatic dance with Resonanz at Paradiso Ubud. A weekly Thursday-night practice of free movement and conscious sober dance. Online tickets IDR 50K, door IDR 200K.',
      'Thursday Resonanz ecstatic dance. Drop-in or pre-book online.',
      'paradiso-resonanz-thursday-weekly')
),
normalized AS (
  SELECT
    *,
    trim(both ' ' from regexp_replace(regexp_replace(lower(title), '[^a-z0-9_[:space:]]', '', 'g'), '[[:space:]]+', ' ', 'g')) AS norm_title,
    'paradiso ubud' AS norm_venue
  FROM new_events
)
INSERT INTO events (
  id, title, slug, description, short_description,
  category, venue_name,
  start_date, start_time,
  is_recurring, recurrence_rule,
  price_info,
  status,
  source_id, source_kind,
  content_fingerprint,
  ingested_at, ai_approved_at,
  llm_parsed
)
SELECT
  gen_random_uuid(),
  title, slug, description, short_description,
  'Dance & Movement',
  'Paradiso Ubud',
  start_date, start_time,
  true,
  format('{"frequency":"weekly","day_of_week":%s}', day_of_week),
  price_info,
  'approved',
  '9f3b8ac3-81b4-441d-8a80-339e4fa32162'::uuid,
  'manual',
  encode(digest(norm_title || '|recurring:weekly:' || day_of_week || '|' || norm_venue, 'sha256'), 'hex'),
  now(), now(),
  false
FROM normalized
ON CONFLICT (slug) DO NOTHING;
