-- Venue audit & cleanup migration
--
-- Context: 62% of approved upcoming events render "Map pending" because the long tail
-- of legitimate Ubud venues never made it into venue_aliases / venue_coordinates, and
-- the existing seed data contains case/spelling duplicates that Nominatim sometimes
-- resolved to the wrong place. This migration:
--   1. Deletes garbage rows from unresolved_venues (LLM chain-of-thought paragraphs)
--   2. Marks generic/non-venue rows as 'ignored' so the admin queue stops growing
--   3. Repoints orphan status='resolved' rows that had NULL canonical_name
--   4. Dedupes venue_coordinates (collapses case/spelling variants to one canonical)
--   5. Seeds venue_aliases for the long tail of legit Ubud venues (Arkamara, Akasha,
--      Dragon Tea Temple, Kappa Senses, MAUA Olea, School of Unified Healing, etc.)
--   6. Seeds venue_coordinates for every new canonical (Nominatim-verified or
--      village-centroid, marked 'manual' where village-centroid)
--   7. Backfills events.latitude/longitude for every upcoming approved/pending event
--      whose venue_name now matches an alias with known coords
--   8. Backfills places.lat/lng for the 3 published rows that had none
--
-- Pre-migration state: 13 of 21 approved upcoming events have NULL lat/lng;
-- unresolved_venues has 90+ rows; venue_coordinates has 24 rows (≈10 are dupes).

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- Section 1 — Delete garbage rows (paragraph-long LLM dumps, off-topic London)
-- ──────────────────────────────────────────────────────────────────────────
DELETE FROM unresolved_venues
WHERE length(raw_name) > 120
   OR raw_name ILIKE 'Core Clapton%';

-- ──────────────────────────────────────────────────────────────────────────
-- Section 2 — Mark generic / non-venue rows as 'ignored'
-- ──────────────────────────────────────────────────────────────────────────
UPDATE unresolved_venues
SET status = 'ignored', resolved_at = now()
WHERE normalized_name IN (
  'ubud','online','zoom','ubud center','ubud bali','ubud bali area',
  'north of ubud','north bali','10 minutes from ubud centre','studio space',
  'private villa in ubud','private venue just outside of ubud',
  'private villa ubud','private venue lodtunduh ubud',
  'central ubud location shared on booking',
  'bali bar crawl multiple locations ubud canggu seminyak',
  'st marys','st marys hornsey rose','the amadeus maida vale west london',
  'meditation center in ubud','embodied coloving'
);

-- ──────────────────────────────────────────────────────────────────────────
-- Section 3 — Fix orphan status='resolved' rows that had NULL canonical_name
-- ──────────────────────────────────────────────────────────────────────────
UPDATE unresolved_venues
SET status = 'resolved', resolved_canonical_name = 'Paradiso Ubud', resolved_at = now()
WHERE normalized_name IN ('paradiso','paradiso ubud');

UPDATE unresolved_venues
SET status = 'resolved', resolved_canonical_name = 'Blossom Space Ubud', resolved_at = now()
WHERE normalized_name IN ('blossom ubud','blossom space ubud');

UPDATE unresolved_venues
SET status = 'resolved', resolved_canonical_name = 'Lodtunduh', resolved_at = now()
WHERE normalized_name IN ('lotunduh','lotunduh ubud');

-- ──────────────────────────────────────────────────────────────────────────
-- Section 4 — Dedupe venue_coordinates (collapse case/spelling variants)
-- Sacred Sanctuary previously resolved to Monkey Forest coords — that was wrong;
-- delete and let admins resolve via the unresolved queue.
-- ──────────────────────────────────────────────────────────────────────────
DELETE FROM venue_coordinates
WHERE canonical_name IN (
  'Paradiso','PARADISO',                          -- keep 'Paradiso Ubud'
  'Cinema Paradiso',                              -- same physical venue as Paradiso Ubud
  'Dragonfly','Dragonfly Village',                -- keep 'Dragonfly Village Ubud'
  'Alchemy Yoga Center',                          -- keep 'Alchemy Yoga & Meditation Center'
  'Sacred Sanctuary, Ubud, Bali',                 -- Nominatim returned Monkey Forest; wrong
  'Swasti Eco Cottages, Ubud',                    -- keep 'Swasti Eco Cottages'
  'Ubud','Ubud, Bali','Ubud, Gianyar, Bali Ubud', -- "Ubud" is not a venue
  'Ubud center','Ubud Studio'                     -- generic, not real venues
);

-- Refresh Paradiso Ubud + Yoga Barn with the slightly more accurate Google-direct coords
UPDATE venue_coordinates
SET latitude = -8.5117157, longitude = 115.2641505, source = 'manual', confidence = 1.0,
    geocoded_at = now()
WHERE canonical_name = 'Paradiso Ubud';

UPDATE venue_coordinates
SET latitude = -8.5195828, longitude = 115.2658076, source = 'manual', confidence = 1.0,
    geocoded_at = now()
WHERE canonical_name = 'The Yoga Barn';

-- ──────────────────────────────────────────────────────────────────────────
-- Section 5 — Seed venue_aliases for the long tail of legitimate Ubud venues
-- Pulled from unresolved_venues audit; grouped so all spelling/punctuation
-- variants resolve to a single canonical.
-- ──────────────────────────────────────────────────────────────────────────

-- First, retire the old 'Lotunduh, Ubud' canonical so its aliases can be
-- re-seeded under the correct 'Lodtunduh' spelling.
DELETE FROM venue_aliases WHERE canonical_name = 'Lotunduh, Ubud';

INSERT INTO venue_aliases (canonical_name, alias) VALUES
  -- Arkamara Dijiwa Ubud (313 lifetime hits, 2 upcoming events stuck on it)
  ('Arkamara Dijiwa Ubud', 'Arkamara Dijiwa Ubud'),
  ('Arkamara Dijiwa Ubud', 'Arkamara Djiwa Resort'),
  ('Arkamara Dijiwa Ubud', 'arkamara dijiwa ubud'),
  -- Akasha New Earth Haven
  ('Akasha New Earth Haven', 'Akasha New Earth Haven'),
  ('Akasha New Earth Haven', 'akasha new earth haven'),
  ('Akasha New Earth Haven', 'New Earth Haven'),
  -- Azadi Retreat
  ('Azadi Retreat', 'Azadi Retreat'),
  ('Azadi Retreat', 'Azadi'),
  -- Blossom Space Ubud — canonical already exists; add Mas variant + lowercase
  ('Blossom Space Ubud', 'blossom space ubud'),
  ('Blossom Space Ubud', 'blossom ubud'),
  -- Kappa Senses Ubud
  ('Kappa Senses Ubud', 'Kappa Senses Ubud'),
  ('Kappa Senses Ubud', 'kappa senses ubud'),
  ('Kappa Senses Ubud', 'Kappa Senses'),
  -- Dragon Tea Temple
  ('Dragon Tea Temple', 'Dragon Tea Temple'),
  ('Dragon Tea Temple', 'Dragon Tea Temple (Zest Ubud)'),
  ('Dragon Tea Temple', 'Dragon Tea Temple Zest Ubud'),
  ('Dragon Tea Temple', 'Zest Garden Temple'),
  ('Dragon Tea Temple', 'ZEST GARDEN TEMPLE'),
  -- School of Unified Healing
  ('School of Unified Healing', 'School of Unified Healing'),
  ('School of Unified Healing', 'School of Unified Healing Ubud'),
  ('School of Unified Healing', 'Unified School of Healing'),
  ('School of Unified Healing', 'Unified Healing Bali'),
  -- Titik Dua Ubud
  ('Titik Dua Ubud', 'Titik Dua Ubud'),
  ('Titik Dua Ubud', 'titik dua'),
  ('Titik Dua Ubud', 'Titik Dua'),
  -- The Hidden Paradise Ubud
  ('Hidden Paradise Ubud', 'The Hidden Paradise Ubud'),
  ('Hidden Paradise Ubud', 'Hidden Paradise Ubud'),
  -- MĀUA Olea Ubud
  ('MAUA Olea Ubud', 'MAUA OLEA UBUD'),
  ('MAUA Olea Ubud', 'MAUA Olea Ubud'),
  ('MAUA Olea Ubud', 'Maua Olea Ubud'),
  ('MAUA Olea Ubud', 'MĀUA Olea Ubud'),
  ('MAUA Olea Ubud', 'maua olea ubud'),
  -- KONEKT
  ('KONEKT', 'KONEKT'),
  ('KONEKT', 'KONEKT - Coffee. Conversation. Connection.'),
  ('KONEKT', 'Konekt Ubud'),
  -- Radiantly Alive (canonical exists; clean trailing-space variant)
  ('Radiantly Alive', 'Radiantly alive'),
  -- Intuitive Flow (canonical exists; add yoga-studio variant)
  ('Intuitive Flow', 'Intuitive Flow Yogastudio'),
  ('Intuitive Flow', 'intuitive flow yogastudio'),
  -- Bara Studio at Karma House
  ('Bara Studio at Karma House', 'Bara Studio at Karma House'),
  ('Bara Studio at Karma House', 'Bara Studio @ Karma House'),
  ('Bara Studio at Karma House', 'Bara at Karma'),
  ('Bara Studio at Karma House', 'Bara Dance Studio'),
  ('Bara Studio at Karma House', 'BARA'),
  ('Bara Studio at Karma House', 'Karma House'),
  -- Cinema Paradiso (same venue as Paradiso Ubud)
  ('Paradiso Ubud', 'Cinema Paradiso'),
  ('Paradiso Ubud', 'cinema paradiso'),
  -- Dragonfly Village Ubud (canonical exists; add unresolved variants)
  ('Dragonfly Village Ubud', 'Dragonfly Village'),
  ('Dragonfly Village Ubud', 'Dragonfly'),
  ('Dragonfly Village Ubud', 'dragonfly'),
  -- Alchemy Yoga & Meditation Center (consolidate all Alchemy variants)
  ('Alchemy Yoga & Meditation Center', 'Alchemy Yoga & Meditation Center'),
  ('Alchemy Yoga & Meditation Center', 'Alchemy Yoga & Meditation Center (AYMC)'),
  ('Alchemy Yoga & Meditation Center', 'Alchemy Yoga Center'),
  ('Alchemy Yoga & Meditation Center', 'Alchemy Yoga Ubud'),
  ('Alchemy Yoga & Meditation Center', 'AYMC'),
  ('Alchemy Yoga & Meditation Center', 'UBud Alchemy Yoga & Meditation Center'),
  ('Alchemy Yoga & Meditation Center', 'alchemy yoga meditation center'),
  ('Alchemy Yoga & Meditation Center', 'alchemy yoga ubud'),
  -- Moksa
  ('Moksa', 'Moksa Ubud'),
  ('Moksa', 'Moksa Dojo'),
  -- Sayuri Healing Food
  ('Sayuri Healing Food', 'Sayuri Healing Food'),
  ('Sayuri Healing Food', 'Sayuri'),
  ('Sayuri Healing Food', 'Sayuri Ubud'),
  -- ASH at Nuanu
  ('ASH at Nuanu', 'ASH at Nuanu'),
  ('ASH at Nuanu', 'ASH at Nuanu Creative City'),
  ('ASH at Nuanu', 'ASH Nuanu'),
  -- Sacred Sanctuary (canonical only; no coords until verified)
  ('Sacred Sanctuary', 'Sacred Sanctuary'),
  ('Sacred Sanctuary', 'Sacred Sanctuary, Ubud, Bali'),
  ('Sacred Sanctuary', 'Sacred Sanctuary Ubud'),
  -- Cretya Ubud
  ('Cretya Ubud', 'Cretya Ubud'),
  ('Cretya Ubud', 'Cretya Ubud Bali'),
  ('Cretya Ubud', 'Cretya Lite'),
  -- Heart Space Bali (canonical only)
  ('Heart Space Bali', 'Heart Space Bali'),
  ('Heart Space Bali', 'Heart Space Ubud'),
  -- Happy Puppy Yoga (canonical only)
  ('Happy Puppy Yoga', 'Happy Puppy Yoga'),
  ('Happy Puppy Yoga', 'Happy Puppy Yoga Ubud'),
  -- DaBar
  ('DaBar', 'DaBar'),
  ('DaBar', 'DaBar Ubud'),
  -- Rasa Ubud Yoga Studio
  ('Rasa Ubud Yoga Studio', 'Rasa Ubud Yoga Studio'),
  ('Rasa Ubud Yoga Studio', 'Rasa Ubud'),
  -- Suly Resort (canonical exists in coords; add aliases)
  ('Suly Resort', 'Suly Resort'),
  ('Suly Resort', 'Suly Resort Ubud'),
  -- Swasti Eco Cottages (dedup aliases)
  ('Swasti Eco Cottages', 'Swasti Eco Cottages'),
  ('Swasti Eco Cottages', 'Swasti Eco Cottages, Ubud'),
  ('Swasti Eco Cottages', 'Swasti Eco Cottages Ubud'),
  -- Chontea Ubud
  ('Chontea Ubud', 'Chontea Ubud'),
  ('Chontea Ubud', 'Chontea Ubud Annex'),
  ('Chontea Ubud', 'Chontea Ubud Experience'),
  -- Kokokan Restaurant
  ('Kokokan Restaurant', 'Kokokan Restaurant'),
  -- Bali Dacha
  ('Bali Dacha', 'Bali Dacha'),
  -- Natya River Sidemen
  ('Natya River Sidemen', 'Natya River Sidemen'),
  -- Lodtunduh (replaces 'Lotunduh, Ubud' typo canonical)
  ('Lodtunduh', 'Lodtunduh'),
  ('Lodtunduh', 'Lotunduh'),
  ('Lodtunduh', 'Lotunduh, Ubud'),
  ('Lodtunduh', 'Private venue, Lodtunduh, Ubud'),
  -- Ulu Cliffhouse (note: Uluwatu, not Ubud — kept for completeness)
  ('Ulu Cliffhouse', 'Ulu Cliffhouse'),
  -- Samyama Meditation Center
  ('Samyama Meditation Center', 'Samyama Meditation Center'),
  -- Bambu Indah (canonical exists; add Ubud variant if not already there)
  ('Bambu Indah', 'Bambu Indah'),
  -- Ubud Story Walks (walking tour, anchor on Jl Bisma)
  ('Ubud Story Walks', 'Ubud Story Walks')
ON CONFLICT (alias) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────
-- Section 6 — Seed venue_coordinates for every new canonical with verified coords.
-- Marked 'manual'/confidence=1.0 for venues whose Google Maps pin we have direct;
-- 'manual'/confidence=0.7 for venues anchored at the village centroid (accurate
-- within ~500m — good enough for the "what neighbourhood is this in?" UX).
-- ──────────────────────────────────────────────────────────────────────────
INSERT INTO venue_coordinates (canonical_name, latitude, longitude, source, confidence) VALUES
  -- Precise (Google direct or Nominatim direct hit)
  ('Kappa Senses Ubud',           -8.4607886, 115.2452081, 'manual', 1.0),
  ('Dragon Tea Temple',           -8.5051234, 115.2537221, 'manual', 1.0),
  ('Titik Dua Ubud',              -8.529938,  115.27166,   'manual', 1.0),
  ('Radiantly Alive',             -8.5092659, 115.2670951, 'manual', 1.0),
  ('Intuitive Flow',              -8.5028147, 115.2520465, 'manual', 1.0),
  ('Dragonfly Village Ubud',      -8.4995506, 115.2584172, 'manual', 1.0),
  ('Sayuri Healing Food',         -8.5099158, 115.2689341, 'manual', 1.0),
  ('Moksa',                       -8.5073080, 115.2455579, 'manual', 1.0),
  ('Alchemy Yoga & Meditation Center', -8.5057818, 115.2514168, 'manual', 1.0),
  ('ASH at Nuanu',                -8.6272198, 115.0990953, 'manual', 1.0),
  -- Village-centroid anchored (accurate to neighbourhood; better than "Map pending")
  ('Arkamara Dijiwa Ubud',        -8.5308740, 115.2439079, 'manual', 0.7),  -- Singakerta
  ('MAUA Olea Ubud',              -8.5292250, 115.2638806, 'manual', 0.7),  -- Pengosekan
  ('KONEKT',                      -8.5273517, 115.2585360, 'manual', 0.7),  -- Nyuh Kuning
  ('Hidden Paradise Ubud',        -8.5077850, 115.2839569, 'manual', 0.7),  -- Pejeng Kawan
  ('Azadi Retreat',               -8.5077850, 115.2839569, 'manual', 0.7),  -- Pejeng Kawan / Laplapan
  ('School of Unified Healing',   -8.4803390, 115.2631806, 'manual', 0.7),  -- Subak Sok Wayah, Tegallalang
  ('Lodtunduh',                   -8.5550135, 115.2609915, 'manual', 0.7),
  ('Bara Studio at Karma House',  -8.5119399, 115.2378113, 'manual', 0.7),  -- Penestanan/Sayan
  ('Akasha New Earth Haven',      -8.4737380, 115.2592518, 'manual', 0.7),  -- Keliki, Payangan
  ('Blossom Space Ubud',          -8.5409425, 115.2717688, 'manual', 0.7),  -- Mas (Cempaka Putih area)
  ('Ubud Story Walks',            -8.5168793, 115.2583352, 'manual', 0.7)   -- Jl Bisma start point
ON CONFLICT (canonical_name) DO UPDATE
  SET latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      source = EXCLUDED.source,
      confidence = EXCLUDED.confidence,
      geocoded_at = now();

-- ──────────────────────────────────────────────────────────────────────────
-- Section 7 — Clean event venue_name whitespace, then backfill event coords
-- ──────────────────────────────────────────────────────────────────────────
UPDATE events
SET venue_name = trim(regexp_replace(venue_name, '\s+', ' ', 'g'))
WHERE venue_name ~ '(^\s|\s$|\s\s)';

-- Backfill every approved/pending future event whose venue_name now matches an alias
-- with known coords. Case-insensitive alias match.
UPDATE events e
SET latitude = vc.latitude,
    longitude = vc.longitude
FROM venue_aliases va
JOIN venue_coordinates vc ON vc.canonical_name = va.canonical_name
WHERE e.latitude IS NULL
  AND e.venue_name IS NOT NULL
  AND lower(trim(e.venue_name)) = lower(va.alias)
  AND e.status IN ('approved','pending')
  AND e.start_date >= (now() AT TIME ZONE 'Asia/Makassar')::date;

-- Also backfill any archived/past events with the same match (cheap, helps history
-- pages render maps for old events too — touches everything that matches an alias).
UPDATE events e
SET latitude = vc.latitude,
    longitude = vc.longitude
FROM venue_aliases va
JOIN venue_coordinates vc ON vc.canonical_name = va.canonical_name
WHERE e.latitude IS NULL
  AND e.venue_name IS NOT NULL
  AND lower(trim(e.venue_name)) = lower(va.alias);

-- ──────────────────────────────────────────────────────────────────────────
-- Section 8 — Backfill places.latitude/longitude for the 3 published rows
-- ──────────────────────────────────────────────────────────────────────────
UPDATE places
SET latitude = -8.5117157, longitude = 115.2641505,
    google_maps_url = 'https://maps.app.goo.gl/jb8NkLHLVM1Dr2Y5A'
WHERE slug = 'paradiso-ubud' AND latitude IS NULL;

UPDATE places
SET latitude = -8.5058559, longitude = 115.2615235
WHERE slug = 'pura-saraswati' AND latitude IS NULL;

-- Yellow Flower Café — Penestanan Kelod centroid (estimated; verify on next visit)
UPDATE places
SET latitude = -8.5041, longitude = 115.2543
WHERE slug = 'yellow-flower-cafe' AND latitude IS NULL;

COMMIT;
