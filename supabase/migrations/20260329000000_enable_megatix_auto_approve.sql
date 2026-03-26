-- Enable auto-approve for Megatix source
-- Megatix events are structured API data (always have title, date, venue, description, price)
-- quality_score is now 0.9, threshold 0.85 means all pass
UPDATE event_sources
SET auto_approve_enabled = true,
    auto_approve_threshold = 0.85
WHERE slug = 'megatix';

-- Batch-approve existing pending Megatix events
-- These were ingested with quality_score 0.80 before the threshold change,
-- but are clean structured data that don't need manual review
UPDATE events
SET status = 'approved', updated_at = NOW()
WHERE source_id = (SELECT id FROM event_sources WHERE slug = 'megatix')
  AND status = 'pending';
