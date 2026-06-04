-- Daily routine 2026-06-04 — triage 37 pending (down from 85 yesterday; the dedup
-- + filter fixes are working, megatix new-today was 0).

-- Duplicates. Resonanz weekly editions (megatix/todo) collapse into the recurring
-- "Resonanz :: Ecstatic Dance"; megatix Sayuri kirtan = the existing recurring
-- kirtan; old todo Clarity Breathwork = the live recurring one. (These are
-- non-recurring single-editions of recurring events — the gap Layer 2.5's
-- recurring-only match doesn't cover; archived by hand.)
UPDATE events SET status='archived', moderation_reason='daily_routine_dup_2026_06_04', updated_at=now()
WHERE id IN (
  'bfb0d3bd-fe23-4f4f-9f15-364494738f2a', -- Kirtan mantra medicine & cacao (megatix) = existing Sayuri kirtan
  'd6f78087-5850-48e8-a723-d50f26fd3d27', -- Resonanz x UtaraMata (megatix, 2025 phantom) = recurring Resonanz
  'ea7f33a9-13d8-4d27-aa9a-074a27a85a1f', -- Resonanz x DISTANT GRAND (megatix, 2025) = recurring Resonanz
  'c9d49a01-2b30-45e3-8a1c-1e25dc7eb73f', -- Resonanz x KIMUNDO (megatix) = recurring Resonanz
  '5c97d8b7-7d02-4f59-9046-23de57099e8d', -- Resonanz Contact-to-Ecstatic (todo) = recurring Resonanz
  'f7fb3ca5-aafc-42cf-a448-19a7ddc3305a'  -- Clarity Breathwork old seed (todo) = live recurring one
);

-- Off-ICP. 2 Lombok events that slipped the megatix locality filter (".includes"
-- substring bug — "Mas" matches inside other words), restaurant nightly music,
-- dating / eye-reading / nutrition-talk, myofascial bodywork training, bar salsa.
UPDATE events SET status='archived', moderation_reason='daily_routine_offtopic_2026_06_04', updated_at=now()
WHERE id IN (
  '6ccb5066-1686-492a-a417-fc2312ef76e2', -- Deep Recharge Reiki — Kuta LOMBOK
  'e302037c-bf39-48c5-9a14-6179d54fb8f2', -- Yin Yoga Heart Opening — Kuta LOMBOK
  '82dd7f75-4051-4295-86ea-e6e3eec196a4', -- LIVE MUSIC SATURDAY NIGHT (restaurant)
  'c2278d0c-a1ff-4e90-8ce2-65f12ce0ce3b', -- LIVE MUSIC SUNDAY NIGHT (restaurant)
  '483845bb-420f-49e0-86fe-4ee97af9a65c', -- Date Me at Sayuri (dating)
  '17b77634-c106-47dc-a70c-e751b89ae2c4', -- Revealing Someone's Soul in 1 minute (eye reading)
  'ce511f8e-706d-4caf-b994-4107f308f732', -- Plant-based nutrition talk
  '9b3f428d-c136-4c62-81dc-6093603db6bc', -- Myofascial Release Module 1 (training)
  'b63a3283-342c-4776-bc53-13548c0f4cb3', -- Myofascial Release Module 2 (training)
  '9c476e7e-4b60-4fbe-a659-0d2365856314'  -- Salsa Night: Social Dance & Cocktails (bar)
);

-- Approve the rest (genuine conscious-community gatherings; megatix times backfilled).
UPDATE events SET status='approved', updated_at=now() WHERE status='pending';
