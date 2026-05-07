-- Manual backfill of start_time / end_time on 13 events where the LLM ingestion
-- parser missed the time. All values inferred by re-reading the event description
-- (quoted source line per row). Applied 2026-05-07 during nightly cleanup.

-- 19:00 — "Starts at 7 PM" (Live Acoustic, Mekel Bayu)
update public.events
   set start_time = '19:00:00', updated_at = now()
 where id = 'd3ecf91c-ead7-4041-9257-0ef9a126bb4e';

-- 12:00–13:00 — "Wednesday : 12-1pm" (Indonesian language class)
update public.events
   set start_time = '12:00:00', end_time = '13:00:00', updated_at = now()
 where id = '42e3b862-747e-49a8-95b6-7c949771d434';

-- 18:30–19:30 — "Tuesday 5th Mei at 6.30-7.30pm" (Activate Your Feminine Energy)
update public.events
   set start_time = '18:30:00', end_time = '19:30:00', updated_at = now()
 where id = '17d42cbf-b6f8-4e20-ba92-40441e8b9fb4';

-- 18:00–20:45 — "18:00 till 20:45" (Resonanz Ecstatic Dance)
update public.events
   set start_time = '18:00:00', end_time = '20:45:00', updated_at = now()
 where id = 'c10f1184-00a0-40ed-af62-6db611871e41';

-- 14:00–16:30 — "Time : 14:00pm - 16:30pm" (Vibrational Healing Arts)
update public.events
   set start_time = '14:00:00', end_time = '16:30:00', updated_at = now()
 where id = '16408241-cc21-4f27-b553-4b51e5a051e1';

-- 18:30–19:30 — "Friday 8th April at 6.30-7.30pm" (Dance Your Own Dance)
update public.events
   set start_time = '18:30:00', end_time = '19:30:00', updated_at = now()
 where id = '40c48d48-d1b9-4d77-b8eb-b435a0c6f113';

-- 19:30 — "Show starts at 7.30 PM" (SECRET COMEDY NIGHT)
update public.events
   set start_time = '19:30:00', updated_at = now()
 where id = 'db009a80-053a-4e6d-8f98-05a00c322bb4';

-- 14:00–16:30 — "Time : 14:00pm - 16:30pm" (Attract Abundance Reiki)
update public.events
   set start_time = '14:00:00', end_time = '16:30:00', updated_at = now()
 where id = 'cb30fed6-5ec2-4ebe-97ae-4b2d43c54a94';

-- 18:30–20:30 — schedule listed: warm-up 18:30, closing 20:20–20:30 (DISSOLVE: CANDLELIGHT)
update public.events
   set start_time = '18:30:00', end_time = '20:30:00', updated_at = now()
 where id = '922ac453-3d75-4cf2-8f12-56327f848213';

-- 18:00–20:00 — "Schedule: 6:00PM - 8:00PM Sunday" (DISSOLVE :: BLINDFOLD)
update public.events
   set start_time = '18:00:00', end_time = '20:00:00', updated_at = now()
 where id = 'd7c81e41-0478-4a2e-af81-e008a0f49cf7';

-- 13:30–15:00 — "Wednesday 6th April at 1.30-3pm" (Healing Clay Workshop)
update public.events
   set start_time = '13:30:00', end_time = '15:00:00', updated_at = now()
 where id = '8d7e862c-bee2-411b-8c49-ca1fbfcc40bb';

-- 18:30–20:00 — "Wednesday 6th Mei at 6.30-8pm" (Women'spreneur Circle)
update public.events
   set start_time = '18:30:00', end_time = '20:00:00', updated_at = now()
 where id = 'f2b9c861-d728-496f-af58-006dcf61515b';

-- 18:00 — "Thursdays at 6,7 PM" — taking earliest listed session time (Paint & Sip Blacklight)
update public.events
   set start_time = '18:00:00', updated_at = now()
 where id = '3a5ace5a-5e23-4546-940d-8a19d3a3160c';

-- The remaining 10 events are multi-day retreats / trainings or have empty
-- descriptions. Leaving start_time NULL is correct for these:
--   b4981afa EXPANDING the Inner Temple (5/29–6/6 intensive)
--   4ff2e5b2 TANTRA SACRED TOUCH (5/11–5/18 retreat)
--   00186b0d BUILDING THE INNER TEMPLE (5/16–5/25 intensive)
--   3fcf9632 Tantra Massage Training (5/6–5/8)
--   743e5f0f Blissful Keyboard Private Session (placeholder description)
--   74a30eff Sacred Smoke Incense Course (no time in desc)
--   ab65c871 Let it Flow Soundbath (no time in desc — would need WebFetch)
--   1413d4a8 Hypnosis Facilitator's Training (3-day training)
--   414f8f01 The Door Is Open (4-day program)
--   c000a44d Initiation Into Tantra (multi-day)
