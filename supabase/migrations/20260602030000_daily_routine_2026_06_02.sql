-- Daily routine 2026-06-02
-- Archive duplicate Tuesday 5Rhythms at Paradiso.
--
-- "5Rhythms" (id ac664db4, source: Public Instagram/Apify, Tue 17:00) duplicates
-- "Moving Waves — 5Rhythms with Jada Jane Boh & Sophie Daubisse" (id 3d0e1b0e, source:
-- curator, Tue 15:00). The official 5rhythms.com class registry (MovingWaves-289451)
-- confirms the real class is "Tuesdays 15:00–17:00" at Paradiso Ubud led by Jada Jane
-- Boh & Sophie Daubisse — so the curator's "Moving Waves" row is canonical and the
-- IG-scraped row's 17:00 is the class END time mis-read as a start. Collapse to one.
UPDATE events
SET status = 'archived',
    moderation_reason = 'daily_routine_dup_2026_06_02 dup_of=3d0e1b0e-88fb-4b05-aed3-f2c4581fa9ae',
    updated_at = now()
WHERE id = 'ac664db4-b8e4-437d-83d1-645ba0443912' AND status = 'approved';
