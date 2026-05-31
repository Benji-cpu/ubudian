-- Daily routine triage — 2026-05-31 (Sunday)
-- Pending queue had 1 event; maintenance digest flagged 2 "broken" links.
-- Web-verified (megatix.co.id/events/mudra-kirtan + kirtanwithanu both 200-but-stale;
-- intuitiveflow.com schedule) that Anu Karoliina's "Shakti Bhakti" KIRTAN runs every
-- THURSDAY 6–7:30pm at The Cobra Room @ Mudra Cafe. Intuitive Flow is her FLOW-YOGA
-- venue, not a kirtan venue — so the approved "Intuitive Flow Wed" row is a curator
-- venue/day mis-attribution and the pending "Mudra Thu" row is the canonical event.

-- 1) Approve the canonical Mudra Thursday kirtan. Both megatix slugs are stale
--    ("This event has already taken place") — the series posts dated per-edition slugs
--    that rot weekly, so clear the user-facing CTA and publish the recurring card
--    without a dead ticket link (source_url retained for provenance only; not link-checked).
UPDATE events
SET status = 'approved',
    external_ticket_url = NULL,
    moderation_reason = 'ai_routine_approved_2026-05-31: canonical weekly Thu kirtan @ Mudra Cobra Room (web-verified). Cleared stale megatix CTA (mudra-kirtan = already-taken-place); series uses per-edition slugs.'
WHERE id = 'f0d8cca8-6902-445f-bc8d-f83dc97c59dc'
  AND status = 'pending';

-- 2) Archive the mis-attributed Intuitive Flow Wednesday duplicate.
UPDATE events
SET status = 'archived',
    moderation_reason = 'ai_routine_dup_2026-05-31: mis-attributed venue/day. Anu Karoliina kirtan is Thursdays @ Mudra Cobra Room (canonical f0d8cca8); Intuitive Flow is her flow-yoga venue, not a kirtan venue. Web-verified.'
WHERE id = 'bc0af456-b459-4ed3-bba6-803043bdba92'
  AND status = 'approved';

-- 3) Clear stale ticket CTA on the future (Jun 25) New Moon Kirtan @ Dragon Tea Temple.
--    megatix.co.id/events/new-moon-kirtan-sacred-tea returns 200 but "already taken place"
--    (per-edition slug rot). Keep the event — real venue, future date, recurring series.
UPDATE events
SET external_ticket_url = NULL,
    moderation_reason = 'ai_routine_url_cleared_2026-05-31: stale megatix slug (already-taken-place); event kept (future Jun 25, real venue).'
WHERE id = '4c495d1b-b5f9-436b-bce4-a47d22590cf6'
  AND status = 'approved';

-- 4) Archive 4 concluded single-day approved events (May 29/30) that the nightly
--    archivePastApprovedEvents() missed — the maintenance route's archival step
--    reported "0 archived" (transient throw caught as 0). These don't leak to users
--    (the /events page applies an in-memory nowInBali filter) but pollute admin +
--    dedup. A redundant second sweep is now wired into the ingestion-health cron.
UPDATE events
SET status = 'archived',
    moderation_reason = 'archived_past_date_2026-05-31 (routine cleanup; nightly archival missed)'
WHERE status = 'approved'
  AND is_recurring = false
  AND start_date < '2026-05-31'
  AND (end_date IS NULL OR end_date < '2026-05-31');
