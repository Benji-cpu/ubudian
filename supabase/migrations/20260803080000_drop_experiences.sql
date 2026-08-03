-- Retire the `experiences` concept.
--
-- /experiences/[slug] was repointed at the `journeys` table (commits 334e9c7,
-- 65b94f1) and the `experiences` table never got a replacement route. Five live
-- surfaces kept building `/experiences/{experiences.slug}` URLs into it — the
-- quiz results page, the post-quiz results component, the dashboard, the events
-- category banner, and the post-quiz spread EMAIL — so every one of those links
-- resolved to a journeys lookup that could not match.
--
-- The table held a single seed row (deleted in 20260803070000), so nothing of
-- value is lost. All application code referencing it was removed in the same
-- commit as this migration.
--
-- The site now has exactly two long-form products instead of three overlapping
-- ones: `tours` (day trips, Stripe checkout, currently flag-disabled) and
-- `journeys` (multi-day retreats, served at /experiences).

DROP TABLE IF EXISTS experiences CASCADE;

-- saved_spreads.experience_ids was written alongside event_ids by the quiz
-- submit route and never read by anything. The spread is events-only now.
ALTER TABLE saved_spreads
  DROP COLUMN IF EXISTS experience_ids;
