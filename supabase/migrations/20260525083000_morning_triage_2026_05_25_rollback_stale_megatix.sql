-- Rollback today's stale-megatix approvals + a previously-approved stale listing.
-- Curator was extrapolating future dates from archived Megatix slugs (2021/2023/2024/2025
-- listings that show "This event has already taken place"). Pattern caught during
-- morning spot-check. See docs/morning-prompt-log.md 2026-05-25.

UPDATE events SET
  status='archived',
  moderation_reason='ai_approver_off_topic_2026-05-25_curator_year_rolled_stale_megatix',
  updated_at=now()
WHERE id IN (
  '8c023cb1-97c4-441a-b9e1-38e66961ff6e',  -- AYNI — megatix listing is Jun 2023
  'cc7e0203-7073-4ff6-9c4f-d851f531a031',  -- New Moon Cacao Levi Banner — megatix listing is Jun 2021
  'f8f91928-b949-4ed6-a47e-08b6ad34a323',  -- Ecstatic Dance in the Dark — megatix listing is Mar 2023
  'a0db5ac3-4d0e-4710-af6e-7927df069e46'   -- SUPERMOON — megatix listing is Jun 2025 (was previously approved)
);
