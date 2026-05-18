-- /events overhaul — data cleanup that complements the Phase A/B/D/E code
-- changes shipped in the same commit. See
-- `.claude/plans/the-ubudian-open-golden-music.md` for context.
--
-- Five chunks:
--   1. Fix Dance Temple Monday start_time (parser corruption: 16:00 → 18:00).
--   2. Off-brand purge — three narrow archive UPDATEs that match the user's
--      explicit purge scope (bar crawls, adventure tourism, generic basic
--      yoga). Cute community workshops (puppy/family paint, kids art) and
--      conscious-community yoga (Yoga Barn / Paradiso / Moksa) are NOT
--      touched.
--   3. Collapse 18 dup clusters → 1 canonical row each. Picked by:
--      a) row WITH a recurrence_rule beats row without (the parser knew it
--         was recurring);
--      b) otherwise, latest seed_date wins (most recent ingest is most
--         likely to have fresh fields).
--   4. Consolidate Contact Dojo Jam Mon/Wed/Fri three weekly rows into one
--      row with day_of_week:[1,3,5] using the new array-supporting parser.
--   5. Fix the 33 orphans (`is_recurring=true / recurrence_rule=null`):
--      set `is_recurring=false` everywhere they're mis-flagged. The few
--      that ARE genuinely recurring will be re-ingested cleanly under the
--      new pipeline (status='pending', LLM ICP filter, recurring dedup).

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1) Dance Temple Monday: 16:00 → 18:00 (parser corruption)
-- 12 archived siblings all hold 18:00; only the surviving weekly row got 16:00.
UPDATE events
SET start_time = '18:00:00', updated_at = NOW()
WHERE id = '2d757db8-e1ff-4618-9602-9a2bf7f15729';

-- ────────────────────────────────────────────────────────────────────────────
-- 2) Off-brand purge — bar crawls / nightlife (preview count: 3)
UPDATE events
SET status = 'archived',
    moderation_reason = 'off_topic_purge_2026_05',
    updated_at = NOW()
WHERE status = 'approved'
  AND (
    title ILIKE '%bar crawl%' OR title ILIKE '%pub crawl%' OR
    title ILIKE '%nightlife%' OR title ILIKE '%cocktail%' OR
    title ILIKE '%drinks%'
  );

-- Off-brand purge — adventure tourism (preview count: 2)
UPDATE events
SET status = 'archived',
    moderation_reason = 'off_topic_purge_2026_05',
    updated_at = NOW()
WHERE status = 'approved'
  AND (
    title ILIKE '%ATV%' OR title ILIKE '%rafting%' OR
    title ILIKE '%zipline%' OR title ILIKE '%jungle tour%' OR
    title ILIKE '%safari%' OR title ILIKE '%monkey forest%' OR
    title ILIKE '%sightseeing%'
  );

-- Off-brand purge — generic basic yoga (preview count: 1).
-- Explicitly exempt conscious-community yoga venues.
UPDATE events
SET status = 'archived',
    moderation_reason = 'off_topic_purge_2026_05',
    updated_at = NOW()
WHERE status = 'approved'
  AND (title ILIKE 'Basic Yoga%' OR title ILIKE 'Beginner Yoga%')
  AND (venue_name IS NULL OR venue_name NOT IN (
    'The Yoga Barn', 'Paradiso Ubud', 'Moksa Ubud'
  ))
  AND COALESCE(is_core, false) = false;

-- ────────────────────────────────────────────────────────────────────────────
-- 3) Collapse dup clusters. Each block archives the non-canonical sibling(s).
-- Canonical id (kept) is documented in the comment above each statement.

-- Activate Your Feminine Energy @ Blossom Space ×3 → keep latest seed (May 6).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id IN ('8c5de564-5a6d-4207-ace8-a613b5659762', 'e6daa127-e3b5-49d5-a672-e629c7be8e2e');

-- BACHATA SENSUAL – Beg. Lvl 1 @ Ubud Studio ×3 → keep latest (Apr 30).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id IN ('09e1076d-c04a-48c9-9a57-791e8a34f681', 'e3091cf7-71c0-49f5-a80a-417b908e4296');

-- BACHATA SENSUAL – Inter. Lvl ×2 → keep latest (Apr 30).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = '08f12e49-493a-4fd5-89dd-1f861eb901b1';

-- BACHATA SENSUAL – Lady Styling ×2 → keep latest (Apr 27).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = 'ab37fa2e-5eee-4cf8-bbf9-cf270ee8b206';

-- 5Rhythms @ Paradiso Ubud ×2 → keep the one WITH a rule (ac664db4).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = '711b1733-2516-4ea9-932e-773ae846c5e8';

-- Authentic Relating Games ×2 → keep latest seed (May 6).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = '644a117d-da50-4177-a02d-917572150717';

-- Bali Flower Mandala Creation ×2 → keep latest (May 7).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = '4cafd349-ba15-44ec-a8b5-2f9b37b1032c';

-- CBC — Contact Beyond Contact ×2 → keep latest (Apr 27).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = '56adfd2d-399a-4f44-b549-a778a83f5efd';

-- Dissolve :: Play | Intuitive Contact Improv Journey ×2 → keep the one WITH rule (99db7251).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = '9765417b-8ffd-49b5-994e-bdb7859e2648';

-- Gold in the Cracks ×2 → keep latest (Apr 29).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = '41f3be85-ef6c-4685-8b00-7d030263f2a7';

-- Healing Clay Workshop ×2 → keep latest (May 6).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = '568a3e25-f4ac-4687-87fa-02b147d6f253';

-- KIZOMBA FUSION – Beg. Lvl ×2 → keep latest (Apr 27).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = '0631ae64-bd81-4371-9d81-c68a511ae6ed';

-- LA SALSA ON 1 – Beg. Lvl ×2 → keep latest (Apr 27).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = 'c9a5ee31-8b91-4e28-95f6-27a2d6831f67';

-- Making Balinese Offerings ×2 → keep latest (Apr 28).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = '2f063402-bc76-4b57-9f09-eccaa9126b29';

-- SALSA ON 2 – Beg. Lvl ×2 → keep latest (Apr 30).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = 'cfd1f142-1e98-4bbb-8db2-b53ebb637f1f';

-- Songs of the Dragonfly: A Community Devotional Gathering ×2 → keep latest (May 3).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = '5c97aa40-6c97-40e9-ad44-0c63e9f97ae9';

-- Women'spreneur Circle ×2 → keep latest (May 6).
UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05', updated_at = NOW()
WHERE id = '127a1d48-1d4e-47fd-9e26-69fdb1dd38de';

-- ────────────────────────────────────────────────────────────────────────────
-- 4) Contact Dojo Jam @ Moksa Ubud — three weekly rows (Mon/Wed/Fri seeds)
-- collapse to ONE row with multi-day rule using the new array support.
-- Keep `65fa8432-…` (Apr 27 = Monday seed, lexicographically smallest id)
-- and archive the Wed + Fri sibling rows.
UPDATE events
SET recurrence_rule = '{"frequency":"weekly","day_of_week":[1,3,5]}',
    description = COALESCE(NULLIF(description, ''),
      'Contact improv jam at Moksa Ubud — three nights a week (Mon/Wed/Fri). Tea, dance, silence.'),
    updated_at = NOW()
WHERE id = '65fa8432-73ed-4525-9efa-43748c2351f3';

UPDATE events SET status = 'archived', moderation_reason = 'dup_collapse_2026_05_multi_day', updated_at = NOW()
WHERE id IN (
  'c17de35b-143e-4924-9b58-ce7da47aa53b',   -- Fri seed
  '2028b3e8-6a1d-4abc-b2c7-42549332743b'    -- Wed seed
);

-- ────────────────────────────────────────────────────────────────────────────
-- 5) Orphan fix: 33 rows with is_recurring=true but no recurrence_rule.
-- These render at stale seed dates because the front-end query includes them
-- via `is_recurring.eq.true`. The vast majority are mis-flagged one-off
-- events (single-date workshops the parser marked as recurring).
--
-- Safest move: set `is_recurring=false` so they obey the normal start_date
-- floor and disappear from /events once past. Anything that IS genuinely
-- weekly will be re-ingested cleanly under the new pipeline (status='pending',
-- LLM ICP filter, recurring-dedup layer) and arrive with a proper rule.
UPDATE events
SET is_recurring = false, updated_at = NOW()
WHERE is_recurring = true
  AND recurrence_rule IS NULL
  AND status IN ('approved', 'pending');

COMMIT;
