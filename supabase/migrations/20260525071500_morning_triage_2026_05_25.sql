-- Morning routine triage — 2026-05-25
-- Drives the 10-event pending queue to zero + clears one rotating weekly URL.

-- 1) Approve 4 clean on-brand events ----------------------------------------

UPDATE events SET status='approved', updated_at=now()
WHERE id IN (
  '82ec12a2-f424-4e96-8a25-8f2c2bd33c17', -- Saturday Ecstatic Dance & Cacao @ Akasha (weekly Sat)
  '8c023cb1-97c4-441a-b9e1-38e66961ff6e', -- AYNI New Moon Sacred Fire & Cacao @ Yoga Barn (Jun 14)
  'cc7e0203-7073-4ff6-9c4f-d851f531a031', -- New Moon Cacao + Ecstatic Dance (Levi Banner) @ Yoga Barn (Jun 12)
  '3d0e1b0e-88fb-4b05-aed3-f2c4581fa9ae'  -- Moving Waves 5Rhythms (Jada/Sophie) @ Paradiso (weekly Tue 3pm)
);

-- 2) Repair + approve ------------------------------------------------------

-- Ecstatic Dance in the Dark — description says "Wednesdays 6-8pm" but is_recurring was false
UPDATE events SET
  status='approved',
  is_recurring=true,
  recurrence_rule='FREQ=WEEKLY;BYDAY=WE',
  updated_at=now()
WHERE id='f8f91928-b949-4ed6-a47e-08b6ad34a323';

-- Pyramids of Chi Full Moon — missing start_time, free-text recurrence rule
-- Source: https://ubud.pyramidsofchi.com/event/full-moon-ceremony/ confirms 18:00 monthly
UPDATE events SET
  status='approved',
  start_time='18:00:00',
  recurrence_rule='FREQ=MONTHLY',
  updated_at=now()
WHERE id='ca7d059c-e390-4d69-a440-75511a14057b';

-- 3) Archive — Megatix listings are stale (2024/2025), no confirmed 2026 dates --

-- MAGDALENA — Megatix listing is for 2024-07-22 (Monday); curator inferred 2026-07-22 (Wed)
UPDATE events SET
  status='archived',
  moderation_reason='ai_approver_off_topic_2026-05-25_stale_listing_no_confirmed_2026_date',
  updated_at=now()
WHERE id='cf8321d2-8486-418e-a0be-ae60fab90851';

-- Solstice Kirtan Jeremy Sol — Megatix listing is for 2025-06-22 (Sun)
UPDATE events SET
  status='archived',
  moderation_reason='ai_approver_off_topic_2026-05-25_stale_listing_no_confirmed_2026_date',
  updated_at=now()
WHERE id='fb28ddc0-552b-4f93-a0f4-71255673d271';

-- Full Moon West African Tribal Dance — Megatix listing is 2025-07-10 at SOUH Tegallalang, not Yoga Barn
UPDATE events SET
  status='archived',
  moderation_reason='ai_approver_off_topic_2026-05-25_stale_listing_wrong_venue_no_2026_date',
  updated_at=now()
WHERE id='0a8adfdf-eefc-4547-904e-81272ead12a2';

-- Elixir of the Gods — Pyramids of Chi listing returns 404; also flagged in daily maintenance digest
UPDATE events SET
  status='archived',
  moderation_reason='ai_approver_off_topic_2026-05-25_dead_link_404',
  updated_at=now()
WHERE id='954d9334-9558-4328-997b-cf299d285610';

-- 4) Clear rotating weekly Megatix slug from Friday Ecstatic Dance ---------
-- friday-ecstatic-dance-25 returns 404; slug rotates weekly per 2026-05-21 log.
-- Event itself stays approved — we just stop linking out to a dead URL.
UPDATE events SET
  external_ticket_url=NULL,
  updated_at=now()
WHERE id='035b9866-aefb-4724-82ea-2596f8a5d789';
