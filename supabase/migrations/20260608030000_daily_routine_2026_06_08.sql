-- Daily routine 2026-06-08 — triage 64 pending (4 days accumulated). Applied via
-- MCP; this file is the git audit trail. Megatix start_times were backfilled first
-- (separator-bug fix, see scripts/scrape/megatix-harvest.mjs).
UPDATE events SET status='archived', moderation_reason='daily_routine_dup_2026_06_08', updated_at=now()
WHERE id IN (
  'dc64397d-36cd-4b8b-a8fa-0e198a6c780d', '0219297e-1672-4692-8ab4-50ff6bec3543',
  '1325c652-8081-4c8c-b046-ef0752993e6b', '1bdb1ac6-bc5b-42cc-b463-c6cd2179b397'
);
UPDATE events SET status='archived', moderation_reason='daily_routine_offtopic_2026_06_08', updated_at=now()
WHERE id IN (
  '617e4b1b-da1b-449d-a9fb-ffc66010c4a5', '25d2bc45-7a00-4dd1-8f20-b5e720114a40',
  'c26f0841-8f1e-43da-bfc2-2cf063d4b477', '9a8e5e6d-ea77-4389-b99e-d11a83bf2d13',
  '50eab69a-862b-4471-a9a4-a1533eaff260', '1f97b4f9-4d71-4718-9631-414b71ebae6d',
  '975e7acd-e51f-4847-a1bd-2be4a2bf647c', '4208feb1-ad16-4cfa-bf7d-1f4c917335b1'
);
UPDATE events SET status='approved', updated_at=now() WHERE status='pending';
