-- Phase 3 of guides — give practitioners and partners the same taxonomy guides
-- and events already use (archetype_tags, intent_tags), plus a hero_image_url
-- and short_description so detail pages can render richly.
--
-- Backfill is deliberate per-row (not heuristic) for the four seeded
-- practitioners, so the quiz integration in Chunk 7 doesn't ship with empty
-- archetype rails. Partner rows are not backfilled (partners table is empty
-- at time of writing; new rows can tag themselves on insert).

-- ----------------------------------------------------------------------------
-- 1. practitioners — taxonomy columns + media columns
-- ----------------------------------------------------------------------------
alter table practitioners
  add column if not exists archetype_tags text[] not null default '{}',
  add column if not exists intent_tags text[] not null default '{}',
  add column if not exists hero_image_url text,
  add column if not exists short_description text;

create index if not exists practitioners_archetype_tags_gin
  on practitioners using gin (archetype_tags);

create index if not exists practitioners_intent_tags_gin
  on practitioners using gin (intent_tags);

-- Explicit per-row tagging of the four seeded practitioners. Mapping rationale
-- documented in plan §B / Risks. Seeker = depth/inner work; explorer = trying
-- something new / shamanic; epicurean = sensory/somatic; creative = quieter
-- intuitive practitioners. Intents follow the existing guide intent vocab.
update practitioners
   set archetype_tags = array['seeker','explorer'],
       intent_tags    = array['spirit'],
       short_description = 'Thirty years of breathwork and shamanic journeying at Pyramids of Chi.'
 where slug = 'krishna-pyramids-of-chi';

update practitioners
   set archetype_tags = array['seeker','epicurean','explorer'],
       intent_tags    = array['spirit','romance'],
       short_description = 'Bodywork, breath, tantra, IFS — fifteen years of somatic depth.'
 where slug = 'nina-pyramids-of-chi';

update practitioners
   set archetype_tags = array['epicurean','seeker'],
       intent_tags    = array['local_culture','living'],
       short_description = 'Lineage carrier in Bali Usadha and Ayurveda — Ubud Bodyworks since 1987.'
 where slug = 'ketut-arsana-ubud-bodyworks';

update practitioners
   set archetype_tags = array['seeker','creative'],
       intent_tags    = array['spirit','living'],
       short_description = 'Pranic Healing, TCM, detox — intuitive care that works by referral.'
 where slug = 'made-nawa-pranic-healing';

-- Hero image backfill: where photo_url is set and hero_image_url isn't, copy
-- across so detail pages have something to render until Phase 3 imagery lands.
update practitioners
   set hero_image_url = photo_url
 where photo_url is not null
   and hero_image_url is null;

-- ----------------------------------------------------------------------------
-- 2. partners — taxonomy columns + media columns
-- ----------------------------------------------------------------------------
alter table partners
  add column if not exists archetype_tags text[] not null default '{}',
  add column if not exists intent_tags text[] not null default '{}',
  add column if not exists hero_image_url text,
  add column if not exists short_description text;

create index if not exists partners_archetype_tags_gin
  on partners using gin (archetype_tags);

create index if not exists partners_intent_tags_gin
  on partners using gin (intent_tags);
