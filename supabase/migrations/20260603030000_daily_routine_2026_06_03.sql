-- Daily routine 2026-06-03 — triage the 85-event harvest backlog.
-- Archive cross-source duplicates of existing approved events, then archive the
-- non-ICP noise the Megatix "yoga barn"/"sayuri" search dragged in (the venues'
-- full retail program: face yoga, gua sha, osteopathy, comedy, self-help,
-- teacher trainings, language, hormone/cycle clinics, restaurant music). Approve
-- the remaining genuine conscious-community gatherings.

-- 1. Duplicates of existing approved rows.
UPDATE events SET status='archived',
  moderation_reason='daily_routine_dup_2026_06_03', updated_at=now()
WHERE id IN (
  '22cb0e8c-6241-4b8a-98a1-34e6cd652292', -- FRIDAY Ecstatic Dance (megatix) = Friday ED Yoga Barn
  'a7ceb7f2-0976-4502-aa02-c4deffa2576e', -- Authentic Relating Games (telegram) = existing AR Games
  'd6ee9150-f69b-4f30-bd88-0ada5b6d8510', -- DISSOLVE EROS (telegram) = Dissolve::Eros
  'd68efc94-027a-48ae-88c1-45be238f0c17', -- DISSOLVE EROS (todo) = Dissolve::Eros
  'fa4b78f4-4444-44ec-96f4-f37df3e056d6', -- 5Rhythms Moving Wave (todo) = Moving Waves
  '8fee019c-1c26-4a10-b742-cfa73b8e0e06', -- Free Community Entropic (todo) = Entropic Wed
  '4a3b6604-db34-4f23-9117-91e586035278'  -- CoCreate Open Voice Jam (todo) = Voice Jam CoCreate (megatix)
);

-- 2. Off-ICP: wellness retail / training / beauty / comedy / self-help / language / business / restaurant.
UPDATE events SET status='archived',
  moderation_reason='daily_routine_offtopic_2026_06_03', updated_at=now()
WHERE id IN (
  '7a57df8f-97b9-4b80-94b5-6c6d2c4cee15', -- Radiant Light Therapy (stale link too)
  '32d071f7-668f-4084-accc-2bdd1470f613', -- LIVE MUSIC TUESDAY (restaurant ambiance)
  'f6bed85c-1c18-47c1-8208-1030628a0b87', -- LIVE MUSIC THURSDAY (restaurant ambiance)
  'b858d704-6f79-4961-8d19-65ead3f0521e', -- Cycle Wisdom (health class)
  'f7dffd23-263f-4b1f-a593-9433031283a1', -- Handpan Training
  '0a680ea1-8dd0-4cb7-8c49-785421728128', -- YES AND Comedy Improv
  '07b180e7-3180-41e0-9bea-ae4d7c1014d4', -- Standup Comedy Workshop
  'f0460324-c404-471d-bac0-53c12ef5e7e1', -- Outpatient Standup Comedy
  '490476a2-c84e-4aa2-8b65-c565d8ae3749', -- Adjust Your Body & Spine (body class)
  '2104c611-f0d4-4ff4-8cda-94c8ce6383eb', -- Women's Holistic Cycle Health
  '8304d34d-6245-4a59-983c-23fe269875a8', -- Unwind the Feminine (hormone yoga)
  '9d414398-e38d-4fa2-a678-533587c3096b', -- The Art of Teaching
  '8b210c5c-bbba-48cc-ab1d-5a5a1962d64d', -- Biodynamic Osteopathy
  'bfc68632-e5ed-4667-8424-05ee2e837371', -- Qi Abdominal Release
  '871d8d39-2f03-4075-8aa6-8985a3bf5512', -- Silencing Impostor Syndrome
  '80e8ec7e-8242-4cea-918c-40551f138972', -- Overcoming Overthinking
  '5d45e583-77e6-4b7f-9016-ce9428fc7669', -- Tarot Intensive Masterclass
  '7276cb1c-49f1-4dda-b616-a9e4774c6b38', -- The Art of Reinventing Yourself
  '58af424a-e5bf-44cf-8bc0-13bc5368fe14', -- Making Life Meaningful
  '97eec613-5712-4ca9-a158-64b7a2a70f6e', -- Face Yoga Workshop (beauty)
  '2746733a-6c37-4aa4-ab87-f9930b1f43a4', -- Gua Sha Workshop (beauty)
  '05ee8d4d-5169-419a-89b9-15e46b8ee10d', -- Advanced Gua Sha Training (beauty)
  '747b68d5-8e59-4af0-8577-0fb229b54fee', -- Face Yoga Training (beauty)
  'b35c4d3c-9227-4c93-a9b5-3ec960001114', -- Acroyoga Teacher Training
  '2c3dfbbe-7bfe-4bb5-8752-27078e9e2967', -- Inner Strength Mobility Training 100H
  '6fd11bdf-3047-4805-aeaf-6c8fc66ca9e7', -- Yintelligence Training
  '6a5fb559-a9e1-4717-a76e-f69306062498', -- 2-Day Spiritual Awakening Course
  '1587353c-1786-496b-9474-b9f29bed7d13', -- Essence Alchemy blends workshop
  '6c6d7564-eae3-4572-96b6-c25b13ee8636', -- Handpan Foundations Training 20Hr
  '317768d5-aab3-4708-a5c9-1b82cabec5ff', -- Women's preneur Circle (business)
  'e2239dea-8742-4b60-bad4-da3a11d73d3e', -- Learn Indonesia Language Class
  '2592a584-5163-4b83-a0d2-24c6db09ffd6', -- Tantra Master 200hr Training
  '07f2fa8a-0a7a-40e6-9922-64524ca19ece', -- Jazz & Dine (restaurant)
  'e48c8b35-cf45-41d5-b668-04a4b8c5f7c5'  -- Inner Peace Hour Meditation (tourist)
);

-- 3. Approve the remaining genuine conscious-community gatherings.
UPDATE events SET status='approved', updated_at=now() WHERE status='pending';
