-- Archive older Paradiso event rows that overlap with the cleaner weekly rows
-- seeded in 20260507010000_seed_paradiso_weekly_schedule.sql.
--
-- Each archived row covers a slot now represented by the newer canonical row
-- (proper day_of_week, accurate poster title/time, recurring-aware fingerprint).
-- Setting status='archived' is reversible — frontend hides them but the row
-- (with whatever curation, descriptions, cover images, etc.) stays in the DB.

UPDATE events
SET status = 'archived',
    updated_at = now()
WHERE id IN (
  -- Friday 5Rhythms duplicates
  '7d326ecb-5fb5-4bd3-95d6-9b1c6014eb43', -- 5Rhythms "Sweat Your Prayers" seed (no day_of_week)
  -- Saturday Dissolve Play duplicates
  'de9e2e03-e745-451f-9212-66d039d8fe9e', -- Dissolve Play seed (no day_of_week)
  '8a70fcd1-cdc7-4365-bb25-e5c94ae55a94', -- DISSOLVE::PLAY (2026-06-06 day:6)
  -- Monday Dance Temple duplicates (older 6pm rows; current poster says 4pm)
  '9ed27f7f-81e0-495e-acd3-39ae22f0ccc5', -- Dance Temple May 4 6pm (RRULE format)
  '0b945994-ad9c-43b4-95b9-3a0aaa951048', -- Dance Temple Apr 27 6pm
  '83e9c3b0-ad8d-4b72-ad4f-e0c5be5c35f2', -- Dance Temple - TOLTECH Apr 20 6pm
  '19f999d3-0c26-406a-8fbe-3f489e0a29c7', -- Dance Temple Apr 20 6pm
  -- Tuesday Dissolve Eros duplicates
  'fb5bccee-d34c-4634-b881-4f1d54208f9a', -- Dissolve Eros seed (no day_of_week)
  '194255e8-11de-4662-b669-b5edef2cf874', -- Dissolve ~ Eros Oct 20 day:2
  'a63301b7-f101-44ef-84fe-fd294f7dc55c', -- Dissolve Eros Oct 6 (one-off, dup of weekly)
  'bd4ea80f-ff57-4fd8-817b-2ded8b0d5c80', -- Dissolve ~ Eros Nov 3 (one-off, dup of weekly)
  -- Wednesday Entropic duplicates (slot now branded "Entropic | Contact Dance & Sound Odyssey")
  'a500e122-09cf-46d5-bde0-c5b9812a1dd2', -- FREE Community Contact Improv Jam May 13
  'ee02eeda-67e2-4ab5-b43a-c352dae1a437', -- Entropic: Free Community Contact Improv Jam Aug 20
  'b89a8edd-6ba0-4deb-8e24-f16de6029718', -- Entropic: Facilitated Contact Improv Jam Oct 7 day:3
  -- Thursday Dissolve Skills duplicates
  '2d6dc9ae-3534-4059-b4ee-ac8c59623431', -- Dissolve Skills seed Apr 30 (no day_of_week)
  '43e9b8a7-be48-4706-8c93-3e555e0fe4ec', -- Dissolve Skills Jul 16 (one-off, dup)
  -- Saturday Kinetic duplicates
  '9b0b8de7-0b86-41a5-b421-f01fcfe14cb2', -- Kinetic: Contact Improv Skills Class Oct 3 day:6
  '83949d43-518d-4c14-81c2-4d405057231f'  -- KINETIC Contact Improv Skills Class Nov 15
);
