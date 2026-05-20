-- Seed three places + two partners so the Phase 3 public listings have
-- something to render on day one. Idempotent: re-running this migration leaves
-- already-edited rows alone. Each insert uses `on conflict (slug) do nothing`
-- so editors can refine these in production without fear of being clobbered
-- by a re-run. Heroes intentionally NULL — populated by
-- scripts/generate-phase3-atom-images.ts in Chunk 6.

-- ----------------------------------------------------------------------------
-- Places (3)
-- ----------------------------------------------------------------------------
insert into places (
  slug, name, kind, short_description, description,
  address, neighbourhood, google_maps_url, website_url, instagram_handle,
  opening_hours, price_range,
  theme_tags, archetype_tags, intent_tags,
  is_published, sort_order
) values
  (
    'pura-saraswati',
    'Pura Saraswati',
    'temple',
    'The water-temple at the centre of Ubud — lotus ponds, the most photographed face of the town.',
    E'Built in the 1950s and dedicated to Saraswati, goddess of knowledge, art and water. The two lotus ponds at the entry are the postcard but the temple proper sits behind, used by the puri for ceremony. Best visited in the late afternoon when the legong dancers rehearse and the light comes through the frangipani.',
    'Jl. Kajeng, Ubud',
    'Central Ubud',
    'https://maps.app.goo.gl/Pura-Saraswati-Ubud',
    null,
    null,
    'Open dawn to dusk; ceremonies most evenings',
    null,
    array['temple','water','ritual','local_culture'],
    array['seeker','creative'],
    array['local_culture','spirit'],
    true,
    10
  ),
  (
    'yellow-flower-cafe',
    'Yellow Flower Café',
    'cafe',
    'Penestanan ridge café — long-running, plant-forward, the kind of place you write in.',
    E'Sits up the rice-paddy path past the Penestanan steps, looking back at the valley. Plant-forward menu, a long bookshelf, slow service in the good sense. People come for the view, stay for an afternoon, leave having made a friend. One of the few places that still feels like the Ubud of ten years ago.',
    'Penestanan, Sayan',
    'Penestanan',
    'https://maps.app.goo.gl/Yellow-Flower-Cafe',
    null,
    '@yellowflowercafe',
    '8:00 — 21:00 daily',
    '$$',
    array['view','contemplative','grounding'],
    array['creative','seeker','epicurean'],
    array['community','living'],
    true,
    20
  ),
  (
    'paradiso-ubud',
    'Paradiso Ubud',
    'studio',
    'The community dance studio — ecstatic dance, contact improv, 5Rhythms, plant-based kitchen downstairs.',
    E'Three rooms (one large sprung floor, two smaller), a vegan kitchen, a cinema. The published weekly schedule covers ecstatic dance, 5Rhythms, contact improv, sound journeys, occasional film nights. Most classes are drop-in (75-150K IDR). The community is the building — go once and you''ll see the same faces for years.',
    'Jl. Monkey Forest, Ubud',
    'Central Ubud',
    'https://maps.app.goo.gl/Paradiso-Ubud',
    'https://paradisoubud.com',
    '@paradisoubud',
    'Schedule varies; see Instagram',
    '$$',
    array['movement','community','sound','dance'],
    array['explorer','connector','epicurean'],
    array['community','living'],
    true,
    30
  )
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Partners (2) — placeholder partnerships, real affiliate URLs to be added by
-- editor once contracts are signed. `is_active=false` keeps them off the public
-- surface until the editor flips them.
-- ----------------------------------------------------------------------------
insert into partners (
  slug, name, kind, description, short_description,
  affiliate_url, commission_rate,
  contact_email, base_location,
  archetype_tags, intent_tags,
  is_active
) values
  (
    'villa-ametis',
    'Villa Ametis',
    'villa',
    E'Three-bedroom villa above the Sayan ridge, the kind of place that turns a long weekend into a proper reset. Open-air bath, ricefield-facing pool, a cook who comes in for breakfast. Used as an anchor stay for several of our journeys.',
    'Three-bedroom Sayan villa — slow mornings, ricefield-facing pool.',
    null,
    null,
    null,
    'Sayan',
    array['epicurean','seeker'],
    array['living','romance'],
    false
  ),
  (
    'lineage-bodywork',
    'Lineage Bodywork Studio',
    'studio',
    E'Quiet bodywork studio behind Jl. Kajeng. Massage in the Bali Usadha tradition plus a small offering of Thai and craniosacral. Walk-ins possible mid-week; weekends book out a few days ahead.',
    'Traditional Balinese + cross-tradition bodywork in central Ubud.',
    null,
    null,
    null,
    'Central Ubud',
    array['epicurean','seeker'],
    array['living','local_culture'],
    false
  )
on conflict (slug) do nothing;
