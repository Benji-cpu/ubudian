-- Lock the analytics_* functions down to signed-in users only.
--
-- The Phase 1 migration revoked EXECUTE from PUBLIC, but Supabase grants
-- EXECUTE to `anon` and `authenticated` directly (via default privileges in
-- the public schema), so the anon role retained access. The functions are
-- already safe — every body is guarded by `WHERE public.is_admin()`, so anon
-- callers only ever get zeros — but these are admin-only metrics, so anon has
-- no business calling them. Revoke explicitly to clear advisor lint 0028.
--
-- `authenticated` keeps EXECUTE: the admin page calls these as the logged-in
-- admin so that auth.uid() resolves and is_admin() returns true. The body
-- guard is the real protection (same pattern as is_admin / sync_guide_references).

REVOKE ALL ON FUNCTION public.analytics_accounts_per_day(int)     FROM anon;
REVOKE ALL ON FUNCTION public.analytics_newsletter_per_day(int)   FROM anon;
REVOKE ALL ON FUNCTION public.analytics_top_saved_events(int)     FROM anon;
REVOKE ALL ON FUNCTION public.analytics_top_saved_journeys(int)   FROM anon;
REVOKE ALL ON FUNCTION public.analytics_top_saved_guides(int)     FROM anon;
REVOKE ALL ON FUNCTION public.analytics_archetype_distribution()  FROM anon;
REVOKE ALL ON FUNCTION public.analytics_signups_by_source()       FROM anon;
REVOKE ALL ON FUNCTION public.analytics_login_stats()             FROM anon;
REVOKE ALL ON FUNCTION public.analytics_revenue_summary()         FROM anon;
