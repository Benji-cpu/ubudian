-- Archive stale approved events
--
-- The pipeline filters past-date events at INSERT, and the nightly
-- `archivePastPendingEvents` cleanup handles past-date pending rows. Neither
-- touches APPROVED rows whose start_date is in the past — so they sit in
-- status='approved' forever, polluting admin views, search, dedup queries,
-- and any future feature that doesn't re-apply the "today or later" filter
-- the /events page applies in-memory.
--
-- As of 2026-05-20 there are 191 such rows (oldest 2026-03-09). This is a
-- one-time cleanup. The matching code change in alerts.ts +
-- daily-maintenance/route.ts keeps this drained going forward.

BEGIN;

-- Stale approved events: start_date passed, end_date passed (or null), not recurring.
WITH bali_today AS (SELECT (NOW() AT TIME ZONE 'Asia/Makassar')::date AS d)
UPDATE events
SET status = 'archived',
    moderation_reason = 'archived_past_date_2026-05-20',
    updated_at = NOW()
FROM bali_today
WHERE events.status = 'approved'
  AND events.start_date < bali_today.d
  AND (events.end_date IS NULL OR events.end_date < bali_today.d)
  AND events.is_recurring = false;

-- Dead-link 404s from 2026-05-20 maintenance digest. Three of these have
-- obviously corrupted megatix slugs (`movementfff`, `energyhfg`) or a
-- removed embodiedawakeningacademy.com landing page. The fourth (anandasarita
-- TANTRA SACRED TOUCH May 11–18) is past-dated and already handled above —
-- listed here only for the audit trail.
UPDATE events
SET status = 'archived',
    moderation_reason = 'archived_dead_link_2026-05-20',
    updated_at = NOW()
WHERE id IN (
  '0c87a80b-2199-4277-86c4-9c90a8c4ad1f',  -- Somatic Dance Movement (megatix 404)
  '17d42cbf-b6f8-4e20-ba92-40441e8b9fb4',  -- Activate Your Feminine Energy (megatix 404)
  '9d8e35e7-696d-472f-a45f-f008bec483e8'   -- Living Tantra Retreat (embodiedawakeningacademy 404)
)
AND status != 'archived';

COMMIT;
