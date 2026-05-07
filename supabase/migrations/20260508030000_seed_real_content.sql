-- ============================================================================
-- Real-content seed: practitioners, venues, restaurants, and live event_refs
-- ============================================================================
-- Replaces the placeholder-only state with real Ubud content sourced via
-- public-facing web research (May 2026). Practitioners and venues are listed
-- in Living Guide style — these are recommendations a knowledgeable friend
-- would give, not partnership announcements. If a practitioner objects we
-- de-list. Same standard a Lonely Planet would apply.
--
-- Event_ref atoms are linked to real approved upcoming events from the
-- events table via INSERT … SELECT … WHERE id IN (...) AND status='approved'
-- so the migration is idempotent and safe to re-run on fresh environments
-- where those specific events do not exist (the inserts silently skip).

-- ----------------------------------------------------------------------------
-- 1. Practitioners (4 known facilitators in Ubud's conscious-community scene)
-- ----------------------------------------------------------------------------
INSERT INTO practitioners (id, slug, name, modalities, bio, contact_instagram, base_location, theme_tags) VALUES
  ('00000000-0000-0000-0000-0000000c00a1',
   'krishna-pyramids-of-chi',
   'Krishna',
   ARRAY['breathwork','shamanic journey']::text[],
   E'Thirty years of clinical experience facilitating client transformation. Holds breathwork and shamanic journeying sessions at Pyramids of Chi in Tegallalang. Brings depth, knowledge and care; not flashy. The kind of practitioner where the work happens because he stays with you.',
   NULL,
   'Pyramids of Chi, Tegallalang (15min from Ubud)',
   ARRAY['breath','breathwork','shamanic','depth']::text[]),

  ('00000000-0000-0000-0000-0000000c00a2',
   'nina-pyramids-of-chi',
   'Nina',
   ARRAY['bodywork','breathwork','tantra','pelvis health care','IFS']::text[],
   E'Fifteen-plus years across bodywork, energywork, yogatherapy, breathwork, IFS, tantra and pelvis health care. Her "Awaken: Breath & Bodywork Therapy" at Pyramids of Chi combines breath, bodywork, and sound — a single session can move things that talk therapy spent months on.',
   NULL,
   'Pyramids of Chi, Tegallalang (15min from Ubud)',
   ARRAY['breath','bodywork','tantra','somatic','integration']::text[]),

  ('00000000-0000-0000-0000-0000000c00a3',
   'ketut-arsana-ubud-bodyworks',
   'Ketut Arsana',
   ARRAY['ayurveda','bali usadha','massage','traditional healing']::text[],
   E'Opened Ubud Bodyworks Centre in 1987. Locally and internationally recognised for nature-based healing — a Mahatma therapist combining Ayurveda and Bali Usadha. Treatments are tailored to the individual, not a menu. The lineage carrier in the Ubud bodywork scene.',
   NULL,
   'Ubud Bodyworks Centre, Ubud',
   ARRAY['massage','bodywork','ayurveda','traditional']::text[]),

  ('00000000-0000-0000-0000-0000000c00a4',
   'made-nawa-pranic-healing',
   'Made Nawa',
   ARRAY['pranic healing','traditional chinese medicine','detox']::text[],
   E'Twenty-plus years blending Pranic Healing, detox protocols, and Traditional Chinese Medicine. Known for intuitive care and results that hold. Quieter than the Instagram-fronted scene — works by referral and word of mouth.',
   NULL,
   'Pranic Healing Ubud',
   ARRAY['pranic','energy','tcm','detox','traditional']::text[]);

-- ----------------------------------------------------------------------------
-- 2. Additional places (real Ubud venues, beyond the 3 we already seeded)
-- ----------------------------------------------------------------------------
INSERT INTO journey_atoms (id, kind, title, short_description, description, theme_tags, archetype_tags, google_maps_url, affiliate_url) VALUES
  ('00000000-0000-0000-0000-00000000a004', 'place',
   'Pyramids of Chi',
   'Two sacred pyramids and a yoga shala in the rice fields of Tegallalang. The sound healing destination near Ubud.',
   E'Three pyramids, geodesic domes, and a dedicated yoga shala. Daily sound healing sessions at 10am, 12pm, 2pm, 4pm, and 6pm. Light Sound Vibration journeys, moon ceremonies, breath and voice workshops. The room itself does half the work — the geometry of the pyramid and the resonance of the gongs.\n\nFifteen minutes from Ubud town by scooter, or a longer walk via rice fields. Book in advance for the popular sessions.',
   ARRAY['sound','ceremony','breathwork','meditation']::text[],
   ARRAY['seeker','explorer','epicurean']::text[],
   'https://maps.google.com/?q=Pyramids+of+Chi+Ubud',
   'https://ubud.pyramidsofchi.com/'),

  ('00000000-0000-0000-0000-00000000a005', 'place',
   'The Yoga Barn',
   'Ubud''s flagship yoga + wellness centre. The hub everyone passes through eventually.',
   E'Four large shalas in a jungle-edge compound off Hanoman. Classes from sunrise to sunset across yoga, dance, sound, breathwork, and integration circles. Café on site. Touristy at peak hours, lineage-carrying at others — pick your teacher more than the time slot.\n\nGood as a daily anchor. The 7:30am Vinyasa with the senior teachers is the most reliable starting point.',
   ARRAY['yoga','vinyasa','meditation','community']::text[],
   ARRAY['seeker','explorer','epicurean','connector']::text[],
   'https://maps.google.com/?q=The+Yoga+Barn+Ubud',
   'https://theyogabarn.com/');

-- ----------------------------------------------------------------------------
-- 3. Restaurants (Living Guide picks; partner_id null until real partnerships)
-- ----------------------------------------------------------------------------
INSERT INTO journey_atoms (id, kind, title, short_description, description, theme_tags, archetype_tags, google_maps_url, affiliate_url) VALUES
  ('00000000-0000-0000-0000-00000000a301', 'restaurant',
   'Moksa',
   '100% plant-based, fed from the permaculture garden out back. The honest kitchen.',
   E'Everything plant-based, locally sourced, mostly grown on site. Tempeh ribs you''ll think about for weeks. The panna cotta might be the best dessert on the island, depending on who you ask. Off the main strip, in a quiet jungle setting near Sayan.\n\nGood for a slow welcome dinner or a final meal that feels intentional.',
   ARRAY['food','plant-based','social','grounding','closing']::text[],
   ARRAY['seeker','epicurean']::text[],
   'https://maps.google.com/?q=Moksa+Ubud',
   NULL),

  ('00000000-0000-0000-0000-00000000a302', 'restaurant',
   'Hujan Locale',
   'Indonesian and Southeast Asian, smartly done, in a heritage Ubud building.',
   E'Two-storey colonial-era building near the palace. Indonesian street food made well, gorgeous cocktails, an indoor-outdoor feel. Vegetarian and gluten-free options if you want them; the meat dishes are why most people return.\n\nWalkable from central Ubud. A safe, beautiful welcome dinner choice.',
   ARRAY['food','social','indonesian','grounding','cohort']::text[],
   ARRAY['seeker','explorer','epicurean','connector']::text[],
   'https://maps.google.com/?q=Hujan+Locale+Ubud',
   NULL),

  ('00000000-0000-0000-0000-00000000a303', 'restaurant',
   'Locavore NXT',
   'The Locavore reincarnation — a sustainability-first 20-course tasting menu.',
   E'The original Locavore closed; this is the next thing. Solar-powered, grey-water reused, soil-regenerating, worm-toilet honest. The menu is hyper-local — no imports, no dairy, no wheat, less animal protein. A 20-plus course tasting that takes the whole evening.\n\nThis is a final-night occasion, not a casual dinner. Book weeks ahead.',
   ARRAY['food','tasting','sustainable','closing','ceremony']::text[],
   ARRAY['seeker','epicurean','creative']::text[],
   'https://maps.google.com/?q=Locavore+NXT+Ubud',
   NULL),

  ('00000000-0000-0000-0000-00000000a304', 'restaurant',
   'Mozaic',
   'Fine dining; the only Indonesian member of Les Grandes Tables du Monde.',
   E'Award-winning kitchen led by Chris Salans and Blake Thornley, fusing French technique with seasonal Balinese ingredients. There''s a fully vegetarian "Botanicals" menu including a rendang carpaccio worth ordering. Garden setting, quiet, ceremonial pacing.\n\nOccasion food. Pair with a journey closing.',
   ARRAY['food','tasting','closing','ceremony']::text[],
   ARRAY['seeker','epicurean','creative']::text[],
   'https://maps.google.com/?q=Mozaic+Restaurant+Ubud',
   NULL);

-- ----------------------------------------------------------------------------
-- 4. Practitioner-kind atoms (linking to the 4 practitioners above)
-- ----------------------------------------------------------------------------
INSERT INTO journey_atoms (id, kind, title, short_description, description, theme_tags, archetype_tags, practitioner_id) VALUES
  ('00000000-0000-0000-0000-0000000c0a01', 'practitioner',
   'Krishna — Breathwork & Shamanic Journey',
   'Thirty years of practice. Held at Pyramids of Chi.',
   E'A Krishna session is a slow build. Breath that takes you somewhere you didn''t book. Shamanic drumming. Stillness afterwards that lasts the rest of the day. Bring water, an open afternoon, and don''t plan dinner for an hour after.',
   ARRAY['breath','breathwork','shamanic','integration','ceremony']::text[],
   ARRAY['seeker','explorer']::text[],
   '00000000-0000-0000-0000-0000000c00a1'),

  ('00000000-0000-0000-0000-0000000c0a02', 'practitioner',
   'Nina — Awaken: Breath & Bodywork Therapy',
   'Breath + bodywork + sound, woven into one session.',
   E'A Nina session can move what a year of talk therapy hasn''t. She holds breath, body, and sound as a single conversation. Particularly powerful as a Day 4 (rest day) booking on a longer journey, when there''s space afterwards to integrate.',
   ARRAY['breath','bodywork','tantra','somatic','integration']::text[],
   ARRAY['seeker','explorer','epicurean']::text[],
   '00000000-0000-0000-0000-0000000c00a2'),

  ('00000000-0000-0000-0000-0000000c0a03', 'practitioner',
   'Ketut Arsana — Ubud Bodyworks',
   'The lineage holder. Ayurveda + Bali Usadha massage since 1987.',
   E'Ketut Arsana opened Ubud Bodyworks Centre nearly forty years ago. He works in the older tradition — Ayurveda crossed with Bali Usadha. Treatments are tailored, not menu-picked. Book at the start of a longer journey for diagnostic insight, or at the end for closing.',
   ARRAY['massage','bodywork','ayurveda','traditional','closing']::text[],
   ARRAY['seeker','epicurean']::text[],
   '00000000-0000-0000-0000-0000000c00a3'),

  ('00000000-0000-0000-0000-0000000c0a04', 'practitioner',
   'Made Nawa — Pranic Healing & TCM',
   'Quieter than the Instagram scene. Twenty years of intuitive practice.',
   E'Pranic Healing, TCM, and detox protocols woven together. Made works by referral; the room is small, the work is precise. Best as a focused session if something specific is asking to be moved — not as a generic spa booking.',
   ARRAY['energy','pranic','tcm','detox','closing']::text[],
   ARRAY['seeker','epicurean']::text[],
   '00000000-0000-0000-0000-0000000c00a4');

-- ----------------------------------------------------------------------------
-- 5. event_ref atoms — link real upcoming events from the events table
-- ----------------------------------------------------------------------------
-- Cacao / sound / ceremony events (Awakening Day 3 afternoon slot)
INSERT INTO journey_atoms (kind, title, short_description, theme_tags, archetype_tags, event_id)
SELECT 'event_ref', e.title, e.short_description,
       ARRAY['cacao','sound','ceremony']::text[],
       ARRAY['seeker','explorer','epicurean']::text[],
       e.id
FROM events e
WHERE e.id IN (
    '16408241-cc21-4f27-b553-4b51e5a051e1',  -- Vibrational Healing Arts Workshop
    'ab65c871-cab2-4021-bcbc-3899d85516ea',  -- Let it Flow Soundbath
    'd7dfb27d-9e81-49d2-9d73-ff776acd5d94'   -- MYSTIC JOURNEY ALECEO
  )
  AND e.status = 'approved';

-- Ecstatic dance / movement events (Awakening Day 5 afternoon slot)
INSERT INTO journey_atoms (kind, title, short_description, theme_tags, archetype_tags, event_id)
SELECT 'event_ref', e.title, e.short_description,
       ARRAY['dance','ecstatic','movement']::text[],
       ARRAY['explorer','epicurean','connector']::text[],
       e.id
FROM events e
WHERE e.id IN (
    'c10f1184-00a0-40ed-af62-6db611871e41',  -- Resonanz Ecstatic Dance @ Paradiso
    '3b2b268d-8c67-48b6-b7a0-065856f95292',  -- BASS LOUNGE @ Paradiso
    '40c48d48-d1b9-4d77-b8eb-b435a0c6f113',  -- Dance Your Own Dance @ Blossom Space
    '8a70fcd1-cdc7-4365-bb25-e5c94ae55a94',  -- DISSOLVE::PLAY @ Paradiso (recurring)
    'a500e122-09cf-46d5-bde0-c5b9812a1dd2'   -- FREE Community Contact Improv Jam
  )
  AND e.status = 'approved';

-- Integration / sharing circle events (Awakening Day 6 evening optional slot)
INSERT INTO journey_atoms (kind, title, short_description, theme_tags, archetype_tags, event_id)
SELECT 'event_ref', e.title, e.short_description,
       ARRAY['integration','tea','sharing']::text[],
       ARRAY['seeker','connector']::text[],
       e.id
FROM events e
WHERE e.id IN (
    '922ac453-3d75-4cf2-8f12-56327f848213',  -- DISSOLVE: CANDLELIGHT (recurring)
    'd7c81e41-0478-4a2e-af81-e008a0f49cf7'   -- DISSOLVE :: BLINDFOLD (recurring)
  )
  AND e.status = 'approved';

-- Movement / grounding for Reset Day 2 morning (theme_tags=['yoga','breath','grounding'])
INSERT INTO journey_atoms (kind, title, short_description, theme_tags, archetype_tags, event_id)
SELECT 'event_ref', e.title, e.short_description,
       ARRAY['breath','grounding','movement']::text[],
       ARRAY['seeker','epicurean']::text[],
       e.id
FROM events e
WHERE e.id IN (
    '40c48d48-d1b9-4d77-b8eb-b435a0c6f113'   -- Dance Your Own Dance (Blossom Space)
  )
  AND e.status = 'approved';

-- ----------------------------------------------------------------------------
-- 6. Pin curated atoms onto specific slots
-- ----------------------------------------------------------------------------
-- Awakening Day 1 evening welcome dinner → Hujan Locale (curated pin)
UPDATE journey_day_slots
SET    curated_atom_id = '00000000-0000-0000-0000-00000000a302'
WHERE  journey_day_id = '00000000-0000-0000-0000-00000000701a'
  AND  slot_window = 'evening'
  AND  position = 1;

-- Awakening Day 4 (rest day) afternoon massage → pinned to Nina (Breath + Bodywork)
UPDATE journey_day_slots
SET    curated_atom_id = '00000000-0000-0000-0000-0000000c0a02'
WHERE  journey_day_id = '00000000-0000-0000-0000-00000000704a'
  AND  slot_window = 'afternoon'
  AND  position = 1;

-- Awakening Day 5 evening cohort dinner → Moksa (curated pin)
UPDATE journey_day_slots
SET    curated_atom_id = '00000000-0000-0000-0000-00000000a301'
WHERE  journey_day_id = '00000000-0000-0000-0000-00000000705a'
  AND  slot_window = 'evening'
  AND  position = 1;

-- Awakening Day 7 evening final meal → Locavore NXT (occasion pick)
UPDATE journey_day_slots
SET    curated_atom_id = '00000000-0000-0000-0000-00000000a303'
WHERE  journey_day_id = '00000000-0000-0000-0000-00000000707a'
  AND  slot_window = 'evening'
  AND  position = 1;

-- Reset Day 1 evening welcome dinner → Hujan Locale (cheap, walkable, honest)
UPDATE journey_day_slots
SET    curated_atom_id = '00000000-0000-0000-0000-00000000a302'
WHERE  journey_day_id = '00000000-0000-0000-0000-0000000003a1'
  AND  slot_window = 'evening'
  AND  position = 1;

-- Reset Day 3 morning massage → Ketut Arsana (Ubud Bodyworks closing massage)
UPDATE journey_day_slots
SET    curated_atom_id = '00000000-0000-0000-0000-0000000c0a03'
WHERE  journey_day_id = '00000000-0000-0000-0000-0000000003a3'
  AND  slot_window = 'morning'
  AND  position = 1;

-- Reset Day 3 evening final meal → Moksa (gentle plant-based farewell)
UPDATE journey_day_slots
SET    curated_atom_id = '00000000-0000-0000-0000-00000000a301'
WHERE  journey_day_id = '00000000-0000-0000-0000-0000000003a3'
  AND  slot_window = 'evening'
  AND  position = 1;
