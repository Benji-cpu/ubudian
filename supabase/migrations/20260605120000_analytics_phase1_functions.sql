-- Analytics Phase 1: admin dashboard aggregation functions.
--
-- Surfaces business metrics over data we ALREADY store (no new tracking):
-- account growth, logins, save leaderboards, archetype distribution, revenue.
--
-- Every function is SECURITY DEFINER (needs to read auth.users / cross-user
-- rows) but bodied with `WHERE public.is_admin()`, so a non-admin caller gets
-- zeros / empty results — defense-in-depth on top of the /admin route gate.
-- EXECUTE is revoked from PUBLIC and granted only to `authenticated`.
--
-- Day buckets use `AT TIME ZONE 'Asia/Makassar'` so evening-Bali activity is
-- counted on the Bali calendar day, not pushed into the next UTC day.

-- --------------------------------------------------------------------------
-- Supporting indexes (tables are tiny today, but these keep the page cheap
-- under Vercel's 10s budget as data grows).
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles (created_at);
CREATE INDEX IF NOT EXISTS idx_saved_events_event
  ON public.saved_events (event_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at
  ON public.newsletter_subscribers (subscribed_at);

-- --------------------------------------------------------------------------
-- 1. Accounts created per Bali day (gap-filled series for a clean sparkline).
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_accounts_per_day(days int DEFAULT 30)
RETURNS TABLE (day date, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH series AS (
    SELECT generate_series(
      ((now() AT TIME ZONE 'Asia/Makassar')::date - (days - 1))::timestamp,
      ((now() AT TIME ZONE 'Asia/Makassar')::date)::timestamp,
      interval '1 day'
    )::date AS day
  ),
  counts AS (
    SELECT (created_at AT TIME ZONE 'Asia/Makassar')::date AS day, count(*) AS c
    FROM public.profiles
    WHERE public.is_admin()
      AND created_at >= (now() - make_interval(days => days))
    GROUP BY 1
  )
  SELECT s.day, COALESCE(c.c, 0)::bigint
  FROM series s
  LEFT JOIN counts c ON c.day = s.day
  ORDER BY s.day;
$$;

-- --------------------------------------------------------------------------
-- 2. Newsletter subscribers per Bali day (gap-filled series).
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_newsletter_per_day(days int DEFAULT 90)
RETURNS TABLE (day date, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH series AS (
    SELECT generate_series(
      ((now() AT TIME ZONE 'Asia/Makassar')::date - (days - 1))::timestamp,
      ((now() AT TIME ZONE 'Asia/Makassar')::date)::timestamp,
      interval '1 day'
    )::date AS day
  ),
  counts AS (
    SELECT (subscribed_at AT TIME ZONE 'Asia/Makassar')::date AS day, count(*) AS c
    FROM public.newsletter_subscribers
    WHERE public.is_admin()
      AND subscribed_at >= (now() - make_interval(days => days))
    GROUP BY 1
  )
  SELECT s.day, COALESCE(c.c, 0)::bigint
  FROM series s
  LEFT JOIN counts c ON c.day = s.day
  ORDER BY s.day;
$$;

-- --------------------------------------------------------------------------
-- 3. Save leaderboards (count + label join), one per saveable entity.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_top_saved_events(lim int DEFAULT 8)
RETURNS TABLE (entity_id uuid, title text, slug text, saves bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id, e.title, e.slug, count(*)::bigint
  FROM public.saved_events s
  JOIN public.events e ON e.id = s.event_id
  WHERE public.is_admin()
  GROUP BY e.id, e.title, e.slug
  ORDER BY count(*) DESC, e.title ASC
  LIMIT lim;
$$;

CREATE OR REPLACE FUNCTION public.analytics_top_saved_journeys(lim int DEFAULT 8)
RETURNS TABLE (entity_id uuid, title text, slug text, saves bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT j.id, j.title, j.slug, count(*)::bigint
  FROM public.saved_journeys s
  JOIN public.journeys j ON j.id = s.journey_id
  WHERE public.is_admin()
  GROUP BY j.id, j.title, j.slug
  ORDER BY count(*) DESC, j.title ASC
  LIMIT lim;
$$;

CREATE OR REPLACE FUNCTION public.analytics_top_saved_guides(lim int DEFAULT 8)
RETURNS TABLE (entity_id uuid, title text, slug text, saves bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.title, g.slug, count(*)::bigint
  FROM public.saved_guides s
  JOIN public.guides g ON g.id = s.guide_id
  WHERE public.is_admin()
  GROUP BY g.id, g.title, g.slug
  ORDER BY count(*) DESC, g.title ASC
  LIMIT lim;
$$;

-- --------------------------------------------------------------------------
-- 4. Archetype distribution across registered profiles.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_archetype_distribution()
RETURNS TABLE (archetype text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(NULLIF(primary_archetype, ''), 'Unset') AS archetype, count(*)::bigint
  FROM public.profiles
  WHERE public.is_admin()
  GROUP BY 1
  ORDER BY count(*) DESC, archetype ASC;
$$;

-- --------------------------------------------------------------------------
-- 5. Newsletter signups grouped by acquisition source.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_signups_by_source()
RETURNS TABLE (source text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(NULLIF(source, ''), 'unknown') AS source, count(*)::bigint
  FROM public.newsletter_subscribers
  WHERE public.is_admin()
  GROUP BY 1
  ORDER BY count(*) DESC, source ASC;
$$;

-- --------------------------------------------------------------------------
-- 6. Login activity from auth.users — AGGREGATES ONLY, never per-user rows.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_login_stats()
RETURNS TABLE (active_1d bigint, active_7d bigint, active_30d bigint, never_signed_in bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT
    count(*) FILTER (WHERE last_sign_in_at >= now() - interval '1 day'),
    count(*) FILTER (WHERE last_sign_in_at >= now() - interval '7 days'),
    count(*) FILTER (WHERE last_sign_in_at >= now() - interval '30 days'),
    count(*) FILTER (WHERE last_sign_in_at IS NULL)
  FROM auth.users
  WHERE public.is_admin();
$$;

-- --------------------------------------------------------------------------
-- 7. Revenue summary. `subscriptions` has no amount column, so MRR is derived
--    app-side from these interval counts against a price map (see constants).
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_revenue_summary()
RETURNS TABLE (
  active_subs_monthly bigint,
  active_subs_yearly bigint,
  bookings_realized bigint,
  payments_succeeded bigint,
  revenue_collected_cents bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM public.subscriptions
       WHERE status IN ('active','trialing') AND interval = 'month'),
    (SELECT count(*) FROM public.subscriptions
       WHERE status IN ('active','trialing') AND interval = 'year'),
    (SELECT count(*) FROM public.bookings
       WHERE status IN ('confirmed','completed')),
    (SELECT count(*) FROM public.payments WHERE status = 'succeeded'),
    (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'succeeded')
  WHERE public.is_admin();
$$;

-- --------------------------------------------------------------------------
-- Lock down EXECUTE: revoke from PUBLIC, grant only to authenticated.
-- --------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.analytics_accounts_per_day(int)     FROM PUBLIC;
REVOKE ALL ON FUNCTION public.analytics_newsletter_per_day(int)   FROM PUBLIC;
REVOKE ALL ON FUNCTION public.analytics_top_saved_events(int)     FROM PUBLIC;
REVOKE ALL ON FUNCTION public.analytics_top_saved_journeys(int)   FROM PUBLIC;
REVOKE ALL ON FUNCTION public.analytics_top_saved_guides(int)     FROM PUBLIC;
REVOKE ALL ON FUNCTION public.analytics_archetype_distribution()  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.analytics_signups_by_source()       FROM PUBLIC;
REVOKE ALL ON FUNCTION public.analytics_login_stats()             FROM PUBLIC;
REVOKE ALL ON FUNCTION public.analytics_revenue_summary()         FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.analytics_accounts_per_day(int)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_newsletter_per_day(int)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_top_saved_events(int)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_top_saved_journeys(int)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_top_saved_guides(int)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_archetype_distribution()  TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_signups_by_source()       TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_login_stats()             TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_revenue_summary()         TO authenticated;
