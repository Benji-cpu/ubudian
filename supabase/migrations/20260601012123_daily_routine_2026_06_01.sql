-- Daily routine triage — 2026-06-01
-- Two archival decisions, both verified against source.

-- 1) Pending: "Inner Meeting — A 3-Day Tantra Retreat" (Jul 12-14)
--    Curator surfaced this from the date-less Megatix slug `inner-meeting` and
--    inferred a 2026 date. The live page (megatix.co.id/events/inner-meeting) is
--    the JULY 12-14 *2024* edition — "This event has already taken place / Sales
--    Closed". Identical Jul 12-14 dates = year-roll artifact, not a real 2026 run.
--    Textbook stale-Megatix year-roll (cf. playbook 2026-05-25). Archive as stale.
UPDATE events
SET status = 'archived',
    moderation_reason = 'ai_approver_stale_megatix_2026-06-01',
    updated_at = now()
WHERE id = 'd068ac68-4b76-44f9-aec1-835a7d01e041'
  AND status = 'pending';

-- 2) Approved leak: "Full Moon Blue Moon Cacao Ceremony with Raio" (2026-05-31,
--    single-day, concluded). Nightly archivePastApprovedEvents() missed it again
--    (same transient-miss class noted 2026-05-31). Doesn't leak to users (in-memory
--    nowInBali render filter) but pollutes admin/dedup. Archive.
UPDATE events
SET status = 'archived',
    moderation_reason = 'past_event_archived_2026-06-01',
    updated_at = now()
WHERE id = 'c126415b-b66a-4459-b7b0-944f4bd44d29'
  AND status = 'approved'
  AND start_date < (now() AT TIME ZONE 'Asia/Makassar')::date;
