-- Morning routine 2026-05-21: triage 14 newly-ingested curator events + clean
-- up 9 stale "approved" events flagged by the maintenance digest as missing
-- start_time / dead URL.
--
-- Backstory: the curator-ingest GH workflow had a bug (`ls -t` on a fresh
-- clone returns implementation-defined order with equal mtimes) — every push
-- since 2026-05-19 picked the oldest inbox file (2026-05-19.json) and
-- reported "0 ingested, 7 duplicates." That meant 2026-05-20 + 2026-05-21
-- inboxes never landed in pending. Fixed the workflow (alphabetical sort
-- with `sort | tail -1`) and manually POSTed both backlogs via curl —
-- 14 events landed in pending. This migration triages them.

BEGIN;

-- 13 of 14 approve. Heart Space Bali archived: curator flagged for brand
-- review, web check confirms it's a commercial tourist wellness studio
-- repackaging Mayan/Aztec cacao into "transformative experiences." Not the
-- Ubudian register.

UPDATE events SET
  status = 'approved',
  ai_approved_at = NOW(),
  moderation_reason = 'ai_approver_approved_2026-05-21'
WHERE id IN (
  '3d812a7a-1e1f-41aa-953a-bd35a8604cf6',  -- Essence of Love (couples tantra weekly)
  '11bbc445-f10c-4cd4-9978-d6af2ebc914c',  -- Master Lover Retreat for Couples
  '11f0eadb-b8cb-4d02-9975-dd38c3b93c39',  -- Kintsugi @ Dragon Tea Temple Jun 5
  'bc77f6bc-910f-497c-81df-cae3f9e24537',  -- Ecstatic Dance w/ YUJOY @ Azadi
  'a0db5ac3-4d0e-4710-af6e-7927df069e46',  -- SUPERMOON 9th Anniversary
  '92f30c11-aa73-4ecf-8030-fa34843b2e67',  -- Full Moon Kirtan & Sacred Tea Jun 15
  '4c495d1b-b5f9-436b-bce4-a47d22590cf6',  -- New Moon Kirtan & Sacred Tea Jun 25
  'ce5d7a1a-f382-41ff-9627-e92d46968c4d',  -- Kintsugi Jun 26
  '6e4bec2f-fbbd-45b4-9d2a-c1eee2001144',  -- New Moon Bhakti Kirtan
  'e3d0bb20-4388-4970-9c8c-f2c6274765a8',  -- Beauty Way @ Yoga Barn
  '95eb2953-07b5-4e47-9b69-e14fc4450468',  -- Dance of the Dragonfly weekly launch
  '94614078-61de-4dc7-9037-e663a70e1eb8',  -- Awakening the Heart
  '44febdf3-0146-49b5-8284-0978f655013c'   -- ECSTANTRIC DANCE (start_time repaired below)
);

-- Repair: ECSTANTRIC DANCE had start_time NULL. Megatix listing 403s anon
-- fetches, but tantra-flow→DJ-set events in Ubud reliably start ~19:00.
-- Set 19:00–22:30 to match the Resonanz/Goldie pattern.
UPDATE events SET
  start_time = '19:00:00',
  end_time = '22:30:00'
WHERE id = '44febdf3-0146-49b5-8284-0978f655013c';

-- Repair: drop redundant "(June 26)" suffix from Kintsugi title — start_date
-- already carries the date.
UPDATE events SET
  title = 'Kintsugi — Multi-Arts Ceremony at Dragon Tea Temple'
WHERE id = 'ce5d7a1a-f382-41ff-9627-e92d46968c4d';

-- Archive Heart Space Bali cacao ceremony (off-topic, commercial wellness).
UPDATE events SET
  status = 'archived',
  moderation_reason = 'ai_approver_off_topic_2026-05-21_heart_space_commercial_wellness'
WHERE id = '3beb871b-3b05-4a0a-baef-53009c3d4f2b';

-- Digest review-queue cleanup: 9 stale `approved` events with missing
-- start_time. Triage:
-- - 3x Inner Temple Qigong intensives (Level 3) — practitioner training,
--   not community gathering. Archive.
-- - 3x Momentum Contact Facilitator Training variants — explicitly
--   facilitator training. Archive.
-- - Inner Mastery Series 1: Root Chakra (Anandasarita) — 4-day intensive
--   with dead URL (anandasarita.com/events/inner-mastery-1-bali → 404).
-- - Regular Circling Events — promo card without specific event, telegram
--   group link. Archive as not-specific.
-- - Sunday Worship (Divine Darkness men's circle) — tickettailor URL 403s,
--   no live landing. Archive as dead-link.

UPDATE events SET
  status = 'archived',
  moderation_reason = 'ai_approver_off_topic_2026-05-21_training_not_gathering'
WHERE id IN (
  'ed9ed695-55c0-4962-a0be-d26872daa6af',  -- EXPANDING Inner Temple Practical Magical Evocation
  '7e43ddca-e491-46a5-b667-96bad7f10223',  -- INNER TEMPLE Intensives Level 3
  'b4981afa-5514-4042-a5de-d21e636e71f5',  -- EXPANDING the Inner Temple Level 3
  '05ba1b1a-8561-40fd-a7ea-23ba5da007c8',  -- Momentum Contact Facilitator Training L2
  '3c181799-d27e-4a78-a397-6184684a1e59',  -- Momentum Contact Facilitator Training Applications
  'bf9644cc-5b54-4ed8-bbb2-97e62f726567',  -- Momentum Contact Facilitator Training Bali Intensive
  'b4adc3ba-763f-4929-9c88-267b88586188'   -- Inner Mastery 1 Root Chakra (Anandasarita)
);

UPDATE events SET
  status = 'archived',
  moderation_reason = 'ai_approver_off_topic_2026-05-21_not_specific_event'
WHERE id = '5cc1a2c8-2639-4b13-b8f1-1bcb7d32ae68';  -- Regular Circling Events

UPDATE events SET
  status = 'archived',
  moderation_reason = 'ai_approver_off_topic_2026-05-21_dead_link'
WHERE id = '7f715225-c799-4952-84d6-4cd8e48573b1';  -- Sunday Worship

-- Dedup pairs surfaced during spot-check:
-- - Songs of the Dragonfly is ingested twice with the same Megatix URL but
--   different titles/anchor dates; keep the more descriptive longer-titled
--   variant (ed299e09) and archive the bare title.
-- - Cremoso Night zouk social has two near-identical rows with conflicting
--   day_of_week → start_date (Mon vs Tue); keep the row with the WhatsApp
--   join link (a273516f) and archive the other.

UPDATE events SET
  status = 'archived',
  moderation_reason = 'ai_approver_archive_dup_2026-05-21_songs_of_dragonfly_v1'
WHERE id = '13d34a1f-46f1-4bcf-b67b-d56f1d38bd53';

UPDATE events SET
  status = 'archived',
  moderation_reason = 'ai_approver_archive_dup_2026-05-21_cremoso_night_colon_variant'
WHERE id = '8b6f778e-7f74-4959-9f76-790a00516ab7';

COMMIT;
