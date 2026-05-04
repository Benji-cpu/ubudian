-- Add diagnostic metadata to events so admins can quickly trace where each
-- event came from (seeded migration, LLM-parsed message, public submission,
-- or manual entry) and audit the original source when something looks wrong.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS source_kind TEXT
    CHECK (source_kind IN ('seed','llm','manual','submission')) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS raw_text_snippet TEXT,
  ADD COLUMN IF NOT EXISTS parser_version  TEXT,
  ADD COLUMN IF NOT EXISTS source_url      TEXT,
  ADD COLUMN IF NOT EXISTS ingested_at     TIMESTAMPTZ DEFAULT NOW();

UPDATE events SET source_kind = 'seed' WHERE is_core = true   AND source_kind = 'manual';
UPDATE events SET source_kind = 'llm'  WHERE llm_parsed = true AND source_kind = 'manual';
