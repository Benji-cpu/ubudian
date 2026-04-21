-- Open the floodgates: bulk-approve pending events that came from ingestion,
-- except those the LLM flagged as spam or inappropriate.
--
-- The new pipeline policy (src/lib/ingestion/pipeline.ts) auto-approves
-- ingested events by default; this one-shot backfill brings the existing
-- backlog in line with that policy so the front-end fills immediately.
--
-- User-submitted pending events (source_id IS NULL) are untouched — those
-- still flow through the trusted_submitters path.

UPDATE events
SET status = 'approved'
WHERE status = 'pending'
  AND source_id IS NOT NULL
  AND NOT (content_flags && ARRAY['spam', 'inappropriate']);
