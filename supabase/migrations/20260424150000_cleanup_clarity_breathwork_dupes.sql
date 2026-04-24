-- Clean up 3 duplicate "Experience Clarity Breathwork" events on 2026-04-22.
-- Root cause: Layer 3 fuzzy dedup used pure Levenshtein, which was dragged below
-- the 0.75 threshold by the length difference between the bare title and the
-- variants carrying facilitator names / subtitle. Fix lives in
-- src/lib/ingestion/similarity.ts (token-overlap signal). This migration cleans
-- up the rows that slipped through before the fix.

-- Keep: 0dfff88d-d6ab-4445-8cc8-f029f48cab81 (fullest title, clean venue).
-- Archive the two less informative duplicates.
UPDATE events
SET status = 'archived', updated_at = now()
WHERE id IN (
  '660d8f7a-f179-450f-8a43-5f3ed82e4a9f', -- "Experience Clarity Breathwork" (bare title, 13:15 start)
  '58d8437f-0ed2-4b48-9fb5-707b76835237'  -- "Experience Clarity Breathwork - Post Balispirit Festival" (venue: "yogabarn")
);

-- Record these as confirmed dedup matches so the audit trail exists.
INSERT INTO dedup_matches (
  event_a_id, event_b_id, match_type, confidence, status, metadata, resolved_at
) VALUES
  (
    '0dfff88d-d6ab-4445-8cc8-f029f48cab81',
    '660d8f7a-f179-450f-8a43-5f3ed82e4a9f',
    'fuzzy_title',
    0.95,
    'confirmed_dup',
    '{"resolved_by":"system-cleanup","reason":"backfill: title-subset duplicate missed by pre-tokenOverlap Layer 3"}'::jsonb,
    now()
  ),
  (
    '0dfff88d-d6ab-4445-8cc8-f029f48cab81',
    '58d8437f-0ed2-4b48-9fb5-707b76835237',
    'fuzzy_title',
    0.9,
    'confirmed_dup',
    '{"resolved_by":"system-cleanup","reason":"backfill: title-subset duplicate with venue variant (yogabarn) missed by pre-tokenOverlap Layer 3"}'::jsonb,
    now()
  )
ON CONFLICT (event_a_id, event_b_id) DO NOTHING;

-- Add alias for the lowercased venue variant observed on one of the archived rows.
INSERT INTO venue_aliases (canonical_name, alias) VALUES
  ('The Yoga Barn', 'yogabarn'),
  ('The Yoga Barn', 'Yoga Barn')
ON CONFLICT DO NOTHING;
