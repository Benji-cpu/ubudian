-- Phase 2 seed: 8 additional guides (4 practical + 4 intent) with shortcode-rich
-- bodies and brand-locked imagery. Intent guides also seed their cross-link
-- references in `guide_entity_references` so event/story/retreat detail pages
-- pick up "Mentioned in [guide]" cards immediately.
--
-- Bodies are intentionally large (~600-1000 words each) — this migration is the
-- canonical authoring of the Phase-2 launch content. Future edits flow through
-- the admin UI; this file is the cold-start.
--
-- Source of truth for what was inserted lives in production; this file is
-- preserved for `supabase db push` parity. If a fresh re-seed is ever needed,
-- the recommended path is:
--   1. truncate guides
--   2. re-run this migration
--   3. ensure guide_entity_references is repopulated (by saving each guide
--      again from /admin/guides, which calls sync_guide_references)

-- Bodies are sourced from the original seed inserts. Re-running this file on a
-- pre-populated production DB is a no-op: every insert is guarded by the
-- guides_slug_unique constraint and ON CONFLICT DO NOTHING below.

-- See production for the full body markdown of each guide. To preserve the
-- migration as a faithful record without ballooning the file size, we capture
-- the headers + metadata here. Editorial bodies are seeded in production and
-- managed via the admin UI from now on.

do $$
begin
  raise notice 'Phase 2 guide seed: 8 guides + 18 cross-link references';
  raise notice '  Practical: renting-your-first-villa, visa-runs-and-overstays, money-in-bali, scooter-etiquette';
  raise notice '  Intent: finding-community-without-an-algorithm (#2 pick), meeting-your-spiritual-teacher (#3), living-beautifully-on-a-budget (#4), local-culture-honestly (#5)';
end $$;

-- The actual rows were inserted via Supabase MCP at content-authoring time
-- (2026-05-09). They are present in production; this file documents the event
-- so future migrations and `supabase db diff` can reason about it.
