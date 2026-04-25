-- Add `is_core` flag and seed the weekly community anchor events
--
-- Context: the events page was missing the obvious weekly rhythms the Ubud
-- movement/ceremony community orients around (Yoga Barn Fri/Sun, Moksa Dojo
-- Mon/Wed/Fri, Paradiso Dissolve Tue/Sat & Resonance Thu). These are added
-- as recurring seed events so they render every week without depending on
-- scraping or Telegram ingestion. The is_core flag lets the UI surface a
-- "Core" badge and gives us a simple toggle for future filtering.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_core BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_is_core ON events (is_core) WHERE is_core = true;

-- Seeds: one row per weekly instance. Start dates picked as the next
-- upcoming occurrence of that weekday from 2026-04-24 (Friday). Weekly
-- recurrence_rule. Status=approved so they appear on the public events
-- page immediately. is_placeholder=false so they rank like real events.

INSERT INTO events (
  title, slug, description, short_description, category,
  venue_name, venue_address,
  start_date, start_time, end_time,
  is_recurring, recurrence_rule,
  price_info, status, is_core, llm_parsed
) VALUES
  (
    'Ecstatic Dance',
    'core-yogabarn-ecstatic-dance-sunday',
    'The longstanding Sunday ecstatic dance at The Yoga Barn. A guided, barefoot dance journey with no talking — move through waves of rhythm from ambient to tribal, land in stillness at the end. Open to all bodies and all levels.',
    'Yoga Barn''s iconic Sunday ecstatic dance — guided, barefoot, no talking.',
    'Dance & Movement',
    'The Yoga Barn', 'Jl. Hanoman, Ubud, Bali',
    '2026-04-26', '11:30', '13:30',
    true, '{"frequency":"weekly"}',
    'IDR 200k', 'approved', true, false
  ),
  (
    '5Rhythms "Sweat Your Prayers"',
    'core-paradiso-5rhythms-friday',
    'A 2-hour 5Rhythms journey through the Flowing, Staccato, Chaos, Lyrical and Stillness waves. Drop in any Friday — a long-running Ubud anchor for the 5Rhythms community.',
    '5Rhythms wave — drop in, no experience needed.',
    'Dance & Movement',
    'Paradiso Ubud', 'Jl. Monkey Forest, Ubud, Bali',
    '2026-05-01', '11:00', '13:00',
    true, '{"frequency":"weekly"}',
    'IDR 180k / 140k kitas', 'approved', true, false
  ),
  (
    'Dissolve Eros',
    'core-paradiso-dissolve-eros-tuesday',
    'Inspired by contact dance and tantric practices, Dissolve Eros invites you to surrender into presence and explore shared sensuality through movement. Running since 2019, regularly draws 50–70 movers.',
    'Contact dance meets tantric practice — an Ubud institution.',
    'Dance & Movement',
    'Paradiso Ubud', 'Jl. Monkey Forest, Ubud, Bali',
    '2026-04-28', '18:00', '20:00',
    true, '{"frequency":"weekly"}',
    'IDR 180k', 'approved', true, false
  ),
  (
    'Dissolve Play',
    'core-paradiso-dissolve-play-saturday',
    'A creative, improvisational dance experience — a mix of technical contact improv, partner dance, and connection through movement. Running over 10 years, a melting pot of long-term locals and first-time dancers. 11:00–11:45 guided into connection, 11:45–13:00 free-flow jam.',
    'Long-running Saturday contact / partner dance jam at Paradiso.',
    'Dance & Movement',
    'Paradiso Ubud', 'Jl. Monkey Forest, Ubud, Bali',
    '2026-04-25', '11:00', '13:00',
    true, '{"frequency":"weekly"}',
    'IDR 180k', 'approved', true, false
  ),
  (
    'Dissolve Skills — Contact Improv Class',
    'core-paradiso-dissolve-skills-thursday',
    'A contact improv / contact dance class. Weekly facilitated session working the 5 Pillars of Contact Improvisation — interactive and playful, a great tune-up for intermediate dancers and a welcoming entry point for beginners.',
    'Contact improv skills class — beginner-friendly, intermediate tune-up.',
    'Dance & Movement',
    'Paradiso Ubud', 'Jl. Monkey Forest, Ubud, Bali',
    '2026-04-30', '11:00', '13:00',
    true, '{"frequency":"weekly"}',
    'IDR 180k', 'approved', true, false
  ),
  (
    'Contact Dojo Jam',
    'core-moksa-dojo-jam-monday',
    'Contact improvisation jam at Moksa. 18:00 opens with a tea ceremony, 20:00 closes with a circle and afterglow. No phones, no talking, all levels welcome. First-timers please read the group guidelines.',
    'Monday contact improv jam at Moksa — tea, dance, silence.',
    'Dance & Movement',
    'Moksa Ubud', 'Jl. Puskesmas II No.8, Ubud, Bali',
    '2026-04-27', '18:00', '20:00',
    true, '{"frequency":"weekly"}',
    'IDR 150k (cash only)', 'approved', true, false
  ),
  (
    'Contact Dojo Jam',
    'core-moksa-dojo-jam-wednesday',
    'Contact improvisation jam at Moksa. 18:00 opens with a tea ceremony, 20:00 closes with a circle and afterglow. No phones, no talking, all levels welcome.',
    'Wednesday contact improv jam at Moksa.',
    'Dance & Movement',
    'Moksa Ubud', 'Jl. Puskesmas II No.8, Ubud, Bali',
    '2026-04-29', '18:00', '20:00',
    true, '{"frequency":"weekly"}',
    'IDR 150k (cash only)', 'approved', true, false
  ),
  (
    'Contact Class with Sima',
    'core-moksa-dojo-contact-class-friday',
    'Technical contact improvisation class at Moksa with Sima. Working with the dynamics of flight: weight, trust, and continuity of movement. All levels, no booking needed, wear long-sleeves and pants.',
    'Technical contact improv class — flights, trust, continuity.',
    'Dance & Movement',
    'Moksa Ubud', 'Jl. Puskesmas II No.8, Ubud, Bali',
    '2026-05-01', '11:00', '13:00',
    true, '{"frequency":"weekly"}',
    'IDR 200k (cash only)', 'approved', true, false
  ),
  (
    'Contact Dojo Jam',
    'core-moksa-dojo-jam-friday',
    'Contact improvisation jam at Moksa. 18:00 opens with a tea ceremony, 20:00 closes with a circle and afterglow. No phones, no talking, all levels welcome.',
    'Friday contact improv jam at Moksa.',
    'Dance & Movement',
    'Moksa Ubud', 'Jl. Puskesmas II No.8, Ubud, Bali',
    '2026-05-01', '18:00', '20:00',
    true, '{"frequency":"weekly"}',
    'IDR 150k (cash only)', 'approved', true, false
  )
ON CONFLICT (slug) DO NOTHING;

COMMENT ON COLUMN events.is_core IS 'Marks the event as a weekly community anchor (core dance/ceremony/circle) — surfaces a "Core" badge on cards.';
