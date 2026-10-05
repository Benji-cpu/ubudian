-- Events desk tables: admin-only policies like every other table (Ubudian room,
-- 6 Oct). No anon read: the site reads picks and signals server-side with the
-- service role (getWeekPicks is passed the admin client).
DROP POLICY IF EXISTS "picks are public" ON event_picks;
DROP POLICY IF EXISTS "admins manage event_picks" ON event_picks;
CREATE POLICY "admins manage event_picks" ON event_picks FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins manage event_signals" ON event_signals;
CREATE POLICY "admins manage event_signals" ON event_signals FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins manage source_suggestions" ON source_suggestions;
CREATE POLICY "admins manage source_suggestions" ON source_suggestions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admins manage curation_reports" ON curation_reports;
CREATE POLICY "admins manage curation_reports" ON curation_reports FOR ALL USING (is_admin()) WITH CHECK (is_admin());
