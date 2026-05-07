-- ============================================================================
-- Seed the two launch journeys: 3-Day Ubud Reset + 7-Day Embodied Awakening
-- ============================================================================
-- Both ship as `living_guide` tier (public, free, SEO). They share an atom
-- palette of evergreen rituals + places + reflections; their event-anchored
-- slots use theme_tags so the slot resolver pulls current real events from the
-- `events` table at render time.
--
-- Density is intentionally light (1-2 anchors per day, 1 explicit rest day on
-- the 7-day, 1 active day on the 3-day). See `docs/superpowers/specs/...` and
-- the `feedback_journey_density.md` memory for the rationale.

-- ----------------------------------------------------------------------------
-- Atoms (evergreen — referenced by curated_atom_id on slots)
-- ----------------------------------------------------------------------------
INSERT INTO journey_atoms (id, kind, title, short_description, description, theme_tags, archetype_tags, google_maps_url) VALUES
  -- Places
  ('00000000-0000-0000-0000-00000000a001', 'place',
   'Tirta Empul',
   'The water temple that has held seekers for a thousand years.',
   E'A morning at Tirta Empul is a threshold. Bring a sarong, an empty stomach, and time. The water-purification ritual (melukat) costs almost nothing and asks almost everything — patience, presence, the willingness to be cold and seen.\n\nGo early (before 8am) on a weekday to avoid the bus crowds. A guide is not required, but watching first is wise.',
   ARRAY['temple','water','threshold','purification'],
   ARRAY['seeker','explorer'],
   'https://maps.google.com/?q=Pura+Tirta+Empul+Bali'),

  ('00000000-0000-0000-0000-00000000a002', 'place',
   'Goa Gajah',
   'The Elephant Cave — older than what we know, smaller than you expect.',
   E'A short walk down stone steps into a 9th-century carved sanctuary. The cave itself is a single chamber. The grounds around it — ponds, broken bathing reliefs, banyan roots — are the real reason to stay an hour.\n\nQuiet, mossy, slightly cool. A good place to sit and not say much.',
   ARRAY['temple','place','quiet'],
   ARRAY['seeker','creative'],
   'https://maps.google.com/?q=Goa+Gajah+Bali'),

  ('00000000-0000-0000-0000-00000000a003', 'place',
   'Subak rice paddy walk — Campuhan Ridge',
   'Sunrise route. Two kilometres of ridge, no shade, no shops.',
   E'Start at the IBAH gate before 6am. The east side of the ridge greens with the first light. The walk is mostly flat, ends at a warung at the top, takes 90 minutes round trip if you stop to breathe.',
   ARRAY['walk','sunrise','grounding','nature'],
   ARRAY['seeker','epicurean'],
   'https://maps.google.com/?q=Campuhan+Ridge+Walk'),

  -- Rituals (always-on, self-guided)
  ('00000000-0000-0000-0000-00000000a101', 'ritual',
   'Five minutes of conscious breath',
   'Before food, before phone, before anything else.',
   E'Sit. Inhale four counts through the nose. Pause one. Exhale six counts through the mouth. Repeat for five minutes.\n\nDon’t make it more than that. The point is the floor it puts under the day.',
   ARRAY['breath','grounding','ritual'],
   ARRAY['seeker','explorer','epicurean'],
   NULL),

  ('00000000-0000-0000-0000-00000000a102', 'ritual',
   'Cold plunge — the simple version',
   'Two minutes of cold water, every morning.',
   E'A walk-in pool, a cold shower, a stream — anything that’s under 18°C will do. Two minutes. Breathe slowly through it. Get out.\n\nThe nervous system reorganises. The day arrives.',
   ARRAY['cold','plunge','body','nervous-system'],
   ARRAY['explorer','epicurean'],
   NULL),

  ('00000000-0000-0000-0000-00000000a103', 'ritual',
   'Cacao with intention',
   'Brew slow, drink slow, name what you came for.',
   E'A cup of ceremonial-grade cacao, brewed with hot water, a pinch of chilli or cardamom. Hold the cup. Speak — out loud, even if alone — what you’re here to meet.\n\nYou don’t need a facilitator. You don’t need a circle. The plant is enough.',
   ARRAY['cacao','ceremony','intention'],
   ARRAY['seeker','epicurean'],
   NULL),

  -- Reflections
  ('00000000-0000-0000-0000-00000000a201', 'reflection',
   'Closing voice note — Awakening',
   'A one-minute audio to yourself, before you fly.',
   E'Open the recorder on your phone. Say, slowly, out loud: what you carried in. What you set down. What you’re carrying now. One minute. Don’t edit. Save it where you’ll find it in six months.',
   ARRAY['reflection','closing','voice-note'],
   ARRAY['seeker','creative','connector'],
   NULL),

  ('00000000-0000-0000-0000-00000000a202', 'reflection',
   'Closing line — Reset',
   'One sentence. Write it down before you leave.',
   E'On a piece of paper, in one sentence: what shifted. Don’t make it big. Don’t make it true forever. Just what’s true today.',
   ARRAY['reflection','closing'],
   ARRAY['seeker','epicurean'],
   NULL);

-- ============================================================================
-- JOURNEY 1: 3-Day Ubud Reset
-- ============================================================================
INSERT INTO journeys (id, slug, title, subtitle, tier, length_days,
  archetype_tags, hero_quote, summary, whats_included, who_its_for, practical_info,
  is_published, sort_order) VALUES
('00000000-0000-0000-0000-0000000003ad',
 '3-day-ubud-reset',
 '3-Day Ubud Reset',
 'A short, soft on-ramp for the just-arrived. One or two things a day, the rest is yours.',
 'living_guide',
 3,
 ARRAY['seeker','epicurean']::text[],
 'Slow is a practice. Slow is also strategy.',
 E'Three days. One anchor most days, one active day in the middle, an early night, a long breakfast. This isn’t a retreat — it’s the way you actually want to land.\n\nWe’ll point you at the right yoga class for the morning you arrive. The right cold plunge for the day you’re ready. A good massage and a good meal before you fly. The point is what we leave out.',
 E'**Where you stay** — find a villa near Penestanan or Nyuh Kuning; we’ll add partners as we sign them.\n\n**What we anchor** — one welcome dinner, one yoga or plunge morning, one closing massage and meal.\n\n**What we leave open** — afternoons, integrations, the unplanned conversation in a cafe.\n\n**What we don’t do** — schedule you back-to-back. The reset is the point.',
 E'You’ve just landed. You’re jet-lagged or overworked or both. You don’t want to *do* Ubud — you want to *arrive* in it.\n\nSlow over deep. Curious over committed. Three days that don’t cost you the holiday you came for.',
 E'**When** — any time of year. Dry season (April–October) is easier on the rain.\n\n**Budget** — accommodation $40–120/night, anchors $30–80 total.\n\n**Bring** — a sarong, a notebook, an early bedtime.',
 TRUE,
 1);

-- Days for the Reset
INSERT INTO journey_days (id, journey_id, day_number, day_type, theme, theme_subtitle, intention) VALUES
  ('00000000-0000-0000-0000-0000000003a1', '00000000-0000-0000-0000-0000000003ad', 1, 'arrival',
   'Land',
   'Don’t do anything yet.',
   E'Get to the villa. Shower. Sit on the porch for an hour. The first dinner is the only thing on the calendar — a slow one, somewhere walkable, where the kitchen is honest.'),

  ('00000000-0000-0000-0000-0000000003a2', '00000000-0000-0000-0000-0000000003ad', 2, 'active',
   'Plunge in',
   'One body practice in the morning. The afternoon is yours.',
   E'Pick one — a yoga class, a cold plunge. The body knows what it needs first. Eat well. Walk somewhere. By sunset you’ll feel arrived.'),

  ('00000000-0000-0000-0000-0000000003a3', '00000000-0000-0000-0000-0000000003ad', 3, 'closing',
   'Slow exit',
   'Bookend with care.',
   E'A massage in the morning. A long breakfast. A final meal somewhere you’ll want to come back to. Before you fly, write the one line that’s true.');

-- Slots for the Reset
INSERT INTO journey_day_slots (journey_day_id, slot_window, position, is_optional, atom_kinds, theme_tags, curated_atom_id, prompt) VALUES
  -- Day 1 — arrival
  ('00000000-0000-0000-0000-0000000003a1', 'evening', 1, FALSE,
   ARRAY['restaurant','event_ref']::text[],
   ARRAY['food','social','grounding']::text[],
   NULL,
   'Welcome dinner'),

  -- Day 2 — active
  ('00000000-0000-0000-0000-0000000003a2', 'morning', 1, FALSE,
   ARRAY['event_ref','ritual']::text[],
   ARRAY['yoga','breath','grounding']::text[],
   NULL,
   'A morning class — yoga, breath, or a slow flow'),
  ('00000000-0000-0000-0000-0000000003a2', 'morning', 2, TRUE,
   ARRAY['ritual','place']::text[],
   ARRAY['cold','plunge','body']::text[],
   '00000000-0000-0000-0000-00000000a102',
   'Or — the cold plunge'),
  ('00000000-0000-0000-0000-0000000003a2', 'evening', 1, TRUE,
   ARRAY['place','ritual']::text[],
   ARRAY['walk','sunset','nature']::text[],
   '00000000-0000-0000-0000-00000000a003',
   'A sunset walk'),

  -- Day 3 — closing
  ('00000000-0000-0000-0000-0000000003a3', 'morning', 1, FALSE,
   ARRAY['practitioner','event_ref']::text[],
   ARRAY['massage','bodywork','closing']::text[],
   NULL,
   'A massage to bookend the trip'),
  ('00000000-0000-0000-0000-0000000003a3', 'evening', 1, FALSE,
   ARRAY['restaurant','event_ref']::text[],
   ARRAY['food','closing']::text[],
   NULL,
   'A final meal'),
  ('00000000-0000-0000-0000-0000000003a3', 'evening', 2, TRUE,
   ARRAY['reflection']::text[],
   ARRAY['reflection','closing']::text[],
   '00000000-0000-0000-0000-00000000a202',
   'Before you fly');

-- ============================================================================
-- JOURNEY 2: 7 Days of Embodied Awakening
-- ============================================================================
INSERT INTO journeys (id, slug, title, subtitle, tier, length_days,
  archetype_tags, hero_quote, summary, whats_included, who_its_for, practical_info,
  is_published, sort_order) VALUES
('00000000-0000-0000-0000-00000000704c',
 '7-days-embodied-awakening',
 '7 Days of Embodied Awakening',
 'A week of cacao, sound, dance, and the practitioners who hold space without flinching.',
 'living_guide',
 7,
 ARRAY['seeker','explorer','epicurean']::text[],
 'What you can’t name, you carry. What you name, you set down.',
 E'A flexible recipe for a week in Ubud’s conscious-community scene. One anchor most days, an explicit rest day on day four, a closing circle on day seven. The point isn’t to do everything — it’s to follow one thread deeply enough to feel the other end of it.\n\nWe’ll point you at real ceremonies happening this week, the temples worth waking for, the dance floor that breaks something open. The journey survives even on a quiet Tuesday — there’s always a ritual or a place that holds the day.',
 E'**Where you stay** — a quiet villa in Penestanan, Nyuh Kuning, or up the Tegallalang ridge. Partners coming.\n\n**What we anchor** — a welcome dinner, one cacao or sound ceremony, an ecstatic dance + cohort dinner, a temple morning, a closing circle.\n\n**What’s woven in** — morning yoga, optional integration teas, a real rest day, evening meals where the cohort lands.\n\n**What we leave open** — most afternoons, the pull-up conversation, the unplanned thing that finds you.',
 E'You came to deal with your stuff and you’re willing to do the work. You like the practitioners who’ve done the work themselves. You can sit with cold water, with cacao, with silence, with a stranger’s eye contact for longer than is comfortable.\n\nThis isn’t a beginner reset. It’s a week of thresholds.',
 E'**When** — any month. New moon and full moon weeks have the strongest ceremony lineup.\n\n**Budget** — $80–200/night accommodation, $200–500 total for anchors and meals across the week.\n\n**Bring** — a journal, a sarong, an open evening on day five, a willingness to leave with a different sentence than you arrived with.',
 TRUE,
 2);

-- Days for the Awakening
INSERT INTO journey_days (id, journey_id, day_number, day_type, theme, theme_subtitle, intention) VALUES
  ('00000000-0000-0000-0000-00000000701a', '00000000-0000-0000-0000-00000000704c', 1, 'arrival',
   'Settle in',
   'Land first. The work is later.',
   E'Get to the villa. Shower. Sit on the porch. Tonight is one slow welcome dinner — somewhere honest, ideally walkable from where you’re staying. Nothing else on the calendar.'),

  ('00000000-0000-0000-0000-00000000702a', '00000000-0000-0000-0000-00000000704c', 2, 'light',
   'Body remembers',
   'A morning practice, then space.',
   E'Pick one yoga class. Eat well after. Take the afternoon — wander, write, nap. If the heart is open in the evening, walk a temple or a gallery.'),

  ('00000000-0000-0000-0000-00000000703a', '00000000-0000-0000-0000-00000000704c', 3, 'active',
   'Open the chest',
   'A ceremony day.',
   E'A cacao ceremony or a sound bath, whichever’s on this week. That’s the day. Eat lightly before, rest deeply after, let it work overnight.'),

  ('00000000-0000-0000-0000-00000000704a', '00000000-0000-0000-0000-00000000704c', 4, 'rest',
   'Don’t fill it',
   'Rest is the practice.',
   E'No anchor. The pool. A massage if your body asks. A long breakfast. The book you brought and never opened. This day is structurally important — without it, day five doesn’t land.'),

  ('00000000-0000-0000-0000-00000000705a', '00000000-0000-0000-0000-00000000704c', 5, 'active',
   'Move what’s stuck',
   'Dance, then cohort.',
   E'Ecstatic dance in the late afternoon. Dinner with whoever danced near you — the introductions are easier when the room is sweaty and grinning. This is the social anchor of the week.'),

  ('00000000-0000-0000-0000-00000000706a', '00000000-0000-0000-0000-00000000704c', 6, 'light',
   'Threshold day',
   'A temple in the morning. The afternoon is yours.',
   E'Tirta Empul or Goa Gajah — early, before the buses. Eat a long breakfast on the way back. The afternoon stays open. Optional integration tea in the evening if there’s a circle running.'),

  ('00000000-0000-0000-0000-00000000707a', '00000000-0000-0000-0000-00000000704c', 7, 'closing',
   'Carry it well',
   'Closing circle, final meal, voice note.',
   E'A closing circle if there’s one in town. Otherwise — sit somewhere quiet and record the voice note. A final dinner with the cohort if they’re still in Ubud. Then go.');

-- Slots for the Awakening
INSERT INTO journey_day_slots (journey_day_id, slot_window, position, is_optional, atom_kinds, theme_tags, curated_atom_id, prompt) VALUES
  -- Day 1 — arrival
  ('00000000-0000-0000-0000-00000000701a', 'evening', 1, FALSE,
   ARRAY['restaurant','event_ref']::text[],
   ARRAY['food','social','grounding']::text[],
   NULL,
   'Welcome dinner'),

  -- Day 2 — light
  ('00000000-0000-0000-0000-00000000702a', 'morning', 1, FALSE,
   ARRAY['event_ref','ritual']::text[],
   ARRAY['yoga','breath','grounding']::text[],
   NULL,
   'Morning yoga'),
  ('00000000-0000-0000-0000-00000000702a', 'evening', 1, TRUE,
   ARRAY['place','event_ref']::text[],
   ARRAY['walk','temple','nature']::text[],
   '00000000-0000-0000-0000-00000000a003',
   'A sunset walk or a small gallery'),

  -- Day 3 — active
  ('00000000-0000-0000-0000-00000000703a', 'afternoon', 1, FALSE,
   ARRAY['event_ref','ritual']::text[],
   ARRAY['cacao','sound','ceremony']::text[],
   NULL,
   'Cacao ceremony or sound bath'),
  ('00000000-0000-0000-0000-00000000703a', 'evening', 1, TRUE,
   ARRAY['ritual','reflection']::text[],
   ARRAY['integration','reflection']::text[],
   '00000000-0000-0000-0000-00000000a101',
   'Five minutes of conscious breath before bed'),

  -- Day 4 — rest (one optional anchor only)
  ('00000000-0000-0000-0000-00000000704a', 'afternoon', 1, TRUE,
   ARRAY['practitioner','event_ref']::text[],
   ARRAY['massage','bodywork','spa']::text[],
   NULL,
   'A massage, only if the body asks'),

  -- Day 5 — active
  ('00000000-0000-0000-0000-00000000705a', 'afternoon', 1, FALSE,
   ARRAY['event_ref']::text[],
   ARRAY['dance','ecstatic','movement']::text[],
   NULL,
   'Ecstatic dance'),
  ('00000000-0000-0000-0000-00000000705a', 'evening', 1, FALSE,
   ARRAY['restaurant','event_ref']::text[],
   ARRAY['food','social','cohort']::text[],
   NULL,
   'Cohort dinner'),
  ('00000000-0000-0000-0000-00000000705a', 'morning', 1, TRUE,
   ARRAY['ritual','place']::text[],
   ARRAY['walk','sunrise','nature']::text[],
   '00000000-0000-0000-0000-00000000a003',
   'Optional sunrise walk'),

  -- Day 6 — light
  ('00000000-0000-0000-0000-00000000706a', 'morning', 1, FALSE,
   ARRAY['place']::text[],
   ARRAY['temple','threshold','water']::text[],
   '00000000-0000-0000-0000-00000000a001',
   'Tirta Empul, before the buses'),
  ('00000000-0000-0000-0000-00000000706a', 'evening', 1, TRUE,
   ARRAY['event_ref','ritual']::text[],
   ARRAY['integration','tea','sharing']::text[],
   NULL,
   'Optional integration tea'),

  -- Day 7 — closing
  ('00000000-0000-0000-0000-00000000707a', 'morning', 1, FALSE,
   ARRAY['event_ref']::text[],
   ARRAY['closing','circle','sharing']::text[],
   NULL,
   'Closing circle'),
  ('00000000-0000-0000-0000-00000000707a', 'evening', 1, FALSE,
   ARRAY['restaurant','event_ref']::text[],
   ARRAY['food','closing','cohort']::text[],
   NULL,
   'Final meal'),
  ('00000000-0000-0000-0000-00000000707a', 'evening', 2, TRUE,
   ARRAY['reflection']::text[],
   ARRAY['reflection','closing','voice-note']::text[],
   '00000000-0000-0000-0000-00000000a201',
   'Before you fly');
