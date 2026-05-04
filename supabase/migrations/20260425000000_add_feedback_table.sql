-- Create feedback table (schema.sql defined it but no migration ever ran).
-- Backs POST /api/feedback used by the in-app feedback FAB.

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'general', -- 'bug' | 'suggestion' | 'general'
  message TEXT NOT NULL,
  email TEXT,
  page_url TEXT,
  page_title TEXT,
  user_agent TEXT,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- 'new' | 'reviewed' | 'resolved' | 'dismissed'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage feedback" ON feedback;
CREATE POLICY "Admins can manage feedback"
  ON feedback FOR ALL
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
