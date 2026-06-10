-- Data-quality backfill, 2026-06-10 daily-improvement session.
-- 15 upcoming approved events were missing start_time and/or cover_image_url.
-- Times come from the original harvest payloads (raw_ingestion_messages.raw_data,
-- which the creation path dropped — see session notes), Megatix JSON-LD, or the
-- venue's own event page. Covers were mirrored into Supabase storage
-- (images/events/backfill-*.{jpg,webp}) from todo.today event art and official
-- festival sites — no AI-generated artwork.
--
-- Undeterminable (left as-is, branded placeholder/no time):
--   7766246d TANTRA JAM cover (ticket page is a JS shell, no public art)
--   c583b0db Ubud Organic Farmers Market cover (no official art found)
--   41af2df1 UWRF 2026 start_time (multi-day festival, day programmes TBA)
--   c4eb96bc Women's Initiation Retreat start_time (7-day residential retreat)

-- source: Megatix JSON-LD startDate 2026-06-21T08:00:00+08:00 (megatix.co.id/events/arkamara-wellness-day-experience)
UPDATE events SET start_time = '08:00:00' WHERE id = 'c5d5c6fa-e102-4809-a076-7f01593cab4b';

-- source: alchemyyogacenter.com/full-moon-celebration-with-jeremy-sol — "6 PM - 9 PM", doors 5.45pm
UPDATE events SET start_time = '18:00:00', end_time = '21:00:00' WHERE id = '9969d6f0-e9a8-421c-b72f-f35bd9d716c2';

-- source: raw_ingestion_messages.raw_data (Megatix harvest): start 2026-06-25 09:00, end 17:00
UPDATE events SET start_time = '09:00:00', end_time = '17:00:00' WHERE id = '86229a2a-0475-46a2-9cc5-4ffbbd5f62e5';

-- source: raw_ingestion_messages.raw_data (todo.today todo-170110): 09:00-10:00 + event art
UPDATE events SET start_time = '09:00:00', end_time = '10:00:00',
  cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/backfill-mindfulness-meditation-michael-green.jpg'
WHERE id = '1fcbbe9b-fc54-407d-af6a-043558242cc6';

-- source: raw_ingestion_messages.raw_data (todo.today todo-162953): 19:00 + event art
UPDATE events SET start_time = '19:00:00',
  cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/backfill-kosmos-album-launch-catur.jpg'
WHERE id = '7c1e0151-84b6-4e73-ba66-d7bf46156365';

-- source: raw_ingestion_messages.raw_data (todo.today todo-169967): 16:00-18:00 + event art
UPDATE events SET start_time = '16:00:00', end_time = '18:00:00',
  cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/backfill-thai-massage-jam-clara-gabi.jpg'
WHERE id = 'b83ea8c2-2e3e-4f3a-8232-d174cb595ff0';

-- source: raw_ingestion_messages.raw_data (todo.today todo-116989): 17:00-19:00 + event art
UPDATE events SET start_time = '17:00:00', end_time = '19:00:00',
  cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/backfill-kirtan-and-cacao-raw-temple.jpg'
WHERE id = 'c36d7c5c-e301-4eae-bf26-373eed935cad';

-- source: raw_ingestion_messages.raw_data (todo.today todo-168374): 14:00-15:30 + event art
UPDATE events SET start_time = '14:00:00', end_time = '15:30:00',
  cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/backfill-threefold-breathwork-dirk.jpg'
WHERE id = '76f3dc64-eacf-48f6-a86d-c260874c8cb1';

-- source: ubudvillagejazzfestival.com official 2026 banner (uvjf_2026_website_banner)
UPDATE events SET cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/backfill-ubud-village-jazz-festival-2026.jpg'
WHERE id = '02b307dd-0133-4197-9fc4-037cf0038a45';

-- source: ubudwritersfestival.com official 2026 festival visual (og:image)
UPDATE events SET cover_image_url = 'https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/events/backfill-uwrf-2026.webp'
WHERE id = '41af2df1-c86c-4b32-8e82-6f9960048db1';

-- cleanup: daily series "Spirituality on The Dance Floor w/ Panda" ended 2026-06-04
-- (raw text: "Repeats every day · Until 4 Jun 2026"; end_date already 2026-06-04) — past event, archive.
UPDATE events SET status = 'archived' WHERE id = '4caa64fb-8fc4-401b-bee2-8a743e7e3a63' AND status = 'approved';

-- cleanup: one-off "Kirtan and Cacao" 2026-06-25 duplicates the weekly series row
-- c36d7c5c (same title + The Raw Temple, weekly until 30 Jun) — dedup miss, archive.
UPDATE events SET status = 'archived' WHERE id = '4111c45a-d3cb-4614-825f-16f431b3c4d1' AND status = 'approved';
