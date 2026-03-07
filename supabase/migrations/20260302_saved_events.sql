-- ============================================
-- SAVED EVENTS TABLE
-- ============================================

CREATE TABLE saved_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, event_id)
);

ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own saved events
CREATE POLICY "Users can read own saved events"
  ON saved_events FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Users can save events
CREATE POLICY "Users can save events"
  ON saved_events FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Users can unsave events
CREATE POLICY "Users can unsave events"
  ON saved_events FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Admins can manage all saved events
CREATE POLICY "Admins can manage saved events"
  ON saved_events FOR ALL
  USING (public.is_admin());

-- Performance index
CREATE INDEX idx_saved_events_profile ON saved_events(profile_id);

-- ============================================
-- NEW RLS POLICY ON EVENTS
-- Users can see their own submitted events (all statuses)
-- ============================================

CREATE POLICY "Users can read own submitted events"
  ON events FOR SELECT
  TO authenticated
  USING (submitted_by_email = (SELECT email FROM profiles WHERE id = auth.uid()));
