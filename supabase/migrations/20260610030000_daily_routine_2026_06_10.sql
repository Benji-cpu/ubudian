-- Daily routine 2026-06-10 — drove pending (21) to zero. Applied via MCP; this
-- file is the git audit trail.
-- Dups: single-edition rows of recurring events that escaped the recurring-parent
-- dedup. Off-ICP: language class.
UPDATE events SET status='archived', moderation_reason='daily_routine_dup_2026_06_10', updated_at=now()
WHERE id IN (
  'b195a235-4f8a-49d4-8010-f7eb4abb8baf', -- Dissolve Play (telegram Oct 25) = recurring Dissolve::Play
  '231b9a6f-a354-4635-b087-517ab667fce0', -- Dissolve::PLAY (todo Jun 20) = recurring Dissolve::Play
  'a074ac7d-dad1-4d52-adac-01688e5063b4'  -- Yoga Beyond The Mat (telegram Nov 3) = the Oct 1 recurring row
);
UPDATE events SET status='archived', moderation_reason='daily_routine_offtopic_2026_06_10', updated_at=now()
WHERE id = '8502b944-d864-4a0a-aec3-0660b2c694be'; -- Indonesia Language Class

UPDATE events SET status='approved', updated_at=now() WHERE status='pending';
