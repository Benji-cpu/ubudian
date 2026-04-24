-- Dedup hardening: clean up active duplicate event pairs, add venue aliases,
-- switch content_fingerprint to title+date only, enforce a unique constraint
-- on (source_id, normalized_title, start_date) to defeat race conditions.

-- 1a. Archive the newer of each active duplicate pair
UPDATE events SET status = 'archived', updated_at = now()
WHERE id IN (
  '4fa6ca71-4c9e-4a55-b1f1-271f1c902450', -- Creative Voices (newer)
  '35be597f-a0ec-44b3-b79e-24b220dae0e3', -- Healing Clay Workshop (newer)
  '6b94f76d-cdfb-491d-a0b0-7f0d006f872f', -- Women'spreneur Circle (newer)
  'fbb7d5db-4b5d-4410-ac64-770da7f56915'  -- Dissolve Eros (newer)
);

-- 1b. Mark the corresponding dedup_matches rows as confirmed_dup
UPDATE dedup_matches
SET status = 'confirmed_dup',
    resolved_at = now(),
    metadata = coalesce(metadata, '{}'::jsonb) || '{"resolved_by":"system-cleanup"}'::jsonb
WHERE id IN (
  '4e0d0552-4536-41dd-ac0d-82c0ab8f126a', -- Creative Voices
  'd2be48fd-f5d1-4c1b-85c1-6058f7ac97f9', -- Healing Clay Workshop
  '30906ec2-2b6b-482b-af69-4018e30c467c', -- Women'spreneur Circle
  'c4d65a86-a29d-417b-a608-8d22bb6161d4'  -- Dissolve Eros
);

-- 1c. Venue aliases for the known spelling variants that caused these dupes
INSERT INTO venue_aliases (canonical_name, alias) VALUES
  ('Blossom Space Ubud', 'Blossom Ubud'),
  ('Blossom Space Ubud', 'Blossom Space'),
  ('Paradiso Ubud', 'PARADISO'),
  ('Paradiso Ubud', 'Paradiso'),
  ('Lotunduh, Ubud', 'Lotunduh')
ON CONFLICT DO NOTHING;

-- Mark the matching unresolved_venues rows as resolved so they drop out of admin review
UPDATE unresolved_venues
SET status = 'resolved'
WHERE raw_name IN ('Blossom Ubud', 'Blossom Space Ubud', 'Blossom Space',
                   'PARADISO', 'Paradiso', 'Paradiso Ubud',
                   'Lotunduh', 'Lotunduh, Ubud');

-- 1d. Backfill content_fingerprint using the new title+date-only algorithm.
-- Mirrors JS normalizeForComparison: lower → strip non-word/non-space → collapse
-- whitespace → trim. Matches src/lib/ingestion/similarity.ts normalizeForComparison.
UPDATE events
SET content_fingerprint = encode(
  digest(
    btrim(regexp_replace(
      regexp_replace(lower(title), '[^a-z0-9_[:space:]]', '', 'g'),
      '[[:space:]]+', ' ', 'g'
    )) || '|' || start_date::text,
    'sha256'
  ),
  'hex'
);

-- 1e. Unique functional index: one active event per (source, normalized title, date).
-- Partial index excludes archived events so cleanup dupes (and future archives) don't
-- block the constraint. Normalization matches JS normalizeForComparison exactly.
CREATE UNIQUE INDEX IF NOT EXISTS events_source_title_date_uniq
  ON events (
    source_id,
    btrim(regexp_replace(
      regexp_replace(lower(title), '[^a-z0-9_[:space:]]', '', 'g'),
      '[[:space:]]+', ' ', 'g'
    )),
    start_date
  )
  WHERE source_id IS NOT NULL AND status <> 'archived';
