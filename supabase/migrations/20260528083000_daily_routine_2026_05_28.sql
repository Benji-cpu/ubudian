-- Daily routine triage — 2026-05-28
-- 14 pending → 6 approved, 7 archived off-topic, 1 archived dup
-- Plus 2 resurrected archived recurring rows (curator past-date filter false-positive)

BEGIN;

------------------------------------------------------------
-- APPROVE (6) — flip pending → approved, backfill start/end times where missing
------------------------------------------------------------

-- 1. Kirtan: Mantra Medicine & Sacred Cacao — already has 18:00, recurring weekly Thu
UPDATE events SET status='approved', ai_approved_at=NOW(), updated_at=NOW()
WHERE id='f532e989-bad4-4047-a4b5-77ac441d8c95' AND status='pending';

-- 2. Sunday Kirtan with Vasudev — already has 18:00, recurring weekly Sun
UPDATE events SET status='approved', ai_approved_at=NOW(), updated_at=NOW()
WHERE id='42a1c848-70ff-4d23-9f11-dfdf1f9e5e25' AND status='pending';

-- 3. Kundalini Activation & Sound Healing — backfill "4-6pm"
UPDATE events SET status='approved', start_time='16:00', end_time='18:00', ai_approved_at=NOW(), updated_at=NOW()
WHERE id='17238a0f-e0df-4fa4-b232-3c658291553d' AND status='pending';

-- 4. Biosonic Studio Soft Opening — backfill "3pm doors, 9pm close"
UPDATE events SET status='approved', start_time='15:00', end_time='21:00', ai_approved_at=NOW(), updated_at=NOW()
WHERE id='dff0f2b8-c518-4475-9b5a-7f5e84611b6a' AND status='pending';

-- 5. LOVE LIFE workshop — backfill "14:00-16:30"
UPDATE events SET status='approved', start_time='14:00', end_time='16:30', ai_approved_at=NOW(), updated_at=NOW()
WHERE id='1b8cdca5-0e74-4850-9df5-3aa35d21c633' AND status='pending';

-- 6. Eco Breathwork 7 Energies — backfill "14:00-16:30"
UPDATE events SET status='approved', start_time='14:00', end_time='16:30', ai_approved_at=NOW(), updated_at=NOW()
WHERE id='4601c931-ac99-46af-8ac6-309c77037532' AND status='pending';

------------------------------------------------------------
-- RESURRECT (2) — weekly recurring rows wrongly archived by curator past-date filter
------------------------------------------------------------

-- 7. Shamanic Breathwork with Jane @ Yoga Barn (weekly Wed)
UPDATE events SET status='approved', ai_approved_at=NOW(), updated_at=NOW()
WHERE id='85c59898-2c9d-43ca-8aaf-d2bad326337f' AND status='archived';

-- 8. Shakti Bhakti Kirtan with Anu Karoliina @ Intuitive Flow (weekly Wed)
UPDATE events SET status='approved', ai_approved_at=NOW(), updated_at=NOW()
WHERE id='bc0af456-b459-4ed3-bba6-803043bdba92' AND status='archived';

------------------------------------------------------------
-- ARCHIVE OFF-TOPIC (7)
------------------------------------------------------------

UPDATE events SET status='archived', moderation_reason='ai_approver_off_topic_2026-05-28', updated_at=NOW()
WHERE id IN (
  '92929809-e42f-469e-b002-dd850fcfdcb5', -- MAUA Olea Grand Opening (luxury hotel)
  '4c39908a-442e-439b-885d-d9456076ffef', -- Flavours and Rhythms (tourist dining)
  '0164a5c0-ea75-4107-b991-7ca0d01cf227', -- Yoga Class Arkamara (chain hotel yoga)
  'b9b0c9c5-be6d-4d82-ab2e-5ae9d410916c', -- Secret Comedy Night (tourist)
  '4defce88-65dd-468e-abc8-e73b66fc51dd', -- Let it Flow Soundbath (tourist-coded, no facilitator depth)
  'bed76adb-7986-466f-afa2-c13eeaaed44b', -- French Artistry Terroir Masterclass (luxury dining)
  'ffc2e6bf-7561-4760-adee-6feccafd50a6'  -- Ubud Temple Run (running tour, tourist-coded)
) AND status='pending';

------------------------------------------------------------
-- ARCHIVE DUP (1)
------------------------------------------------------------

-- Resonanz PRABUMI is a single-instance dup of the approved weekly Resonanz Thu recurring row
UPDATE events SET status='archived', moderation_reason='ai_approver_dup_of_paradiso-resonanz-thursday-weekly_2026-05-28', updated_at=NOW()
WHERE id='ec3a9669-8fc4-49e6-845f-f0ace2c0d825' AND status='pending';

COMMIT;
