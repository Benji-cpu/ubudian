-- The Ubudian — Full Database Schema
-- Consolidated migration: tables + RLS + policies + functions + storage + indexes

-- ============================================
-- PROFILES TABLE (linked to auth.users)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',  -- 'user' | 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CONTENT TABLES
-- ============================================

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  is_placeholder BOOLEAN DEFAULT FALSE,
  archetype_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subject_name TEXT NOT NULL,
  subject_instagram TEXT,
  subject_tagline TEXT,
  photo_urls TEXT[],
  narrative TEXT NOT NULL,
  theme_tags TEXT[],
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  is_placeholder BOOLEAN DEFAULT FALSE,
  archetype_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  cover_image_url TEXT,
  category TEXT NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  venue_map_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  price_info TEXT,
  external_ticket_url TEXT,
  organizer_name TEXT,
  organizer_contact TEXT,
  organizer_instagram TEXT,
  status TEXT DEFAULT 'pending',
  submitted_by_email TEXT,
  is_trusted_submitter BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  is_placeholder BOOLEAN DEFAULT FALSE,
  archetype_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  photo_urls TEXT[],
  itinerary TEXT,
  duration TEXT,
  price_per_person INTEGER,
  max_group_size INTEGER,
  theme TEXT,
  whats_included TEXT,
  what_to_bring TEXT,
  guide_name TEXT,
  booking_whatsapp TEXT,
  booking_email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_placeholder BOOLEAN DEFAULT FALSE,
  archetype_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE newsletter_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  preview_text TEXT,
  content_json JSONB,
  html_content TEXT,
  featured_story_id UUID REFERENCES stories(id),
  sponsor_name TEXT,
  sponsor_image_url TEXT,
  sponsor_url TEXT,
  sponsor_text TEXT,
  status TEXT DEFAULT 'draft',
  beehiiv_post_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  birthday DATE,
  instagram_handle TEXT,
  beehiiv_subscriber_id TEXT,
  status TEXT DEFAULT 'active',
  source TEXT DEFAULT 'website',
  archetype TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trusted_submitters (
  email TEXT PRIMARY KEY,
  approved_count INTEGER DEFAULT 0,
  auto_approve BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT,
  primary_archetype TEXT NOT NULL,
  secondary_archetype TEXT,
  scores JSONB NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_submitters ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- BLOG POSTS POLICIES
-- ============================================

CREATE POLICY "Published blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage blog posts"
  ON blog_posts FOR ALL
  USING (public.is_admin());

-- ============================================
-- STORIES POLICIES
-- ============================================

CREATE POLICY "Published stories are viewable by everyone"
  ON stories FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage stories"
  ON stories FOR ALL
  USING (public.is_admin());

-- ============================================
-- EVENTS POLICIES
-- ============================================

CREATE POLICY "Approved events are viewable by everyone"
  ON events FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Authenticated users can submit events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (status = 'pending');

CREATE POLICY "Admins can manage events"
  ON events FOR ALL
  USING (public.is_admin());

-- ============================================
-- TOURS POLICIES
-- ============================================

CREATE POLICY "Active tours are viewable by everyone"
  ON tours FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage tours"
  ON tours FOR ALL
  USING (public.is_admin());

-- ============================================
-- NEWSLETTER EDITIONS POLICIES
-- ============================================

CREATE POLICY "Published newsletter editions are viewable by everyone"
  ON newsletter_editions FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage newsletter editions"
  ON newsletter_editions FOR ALL
  USING (public.is_admin());

-- ============================================
-- NEWSLETTER SUBSCRIBERS POLICIES
-- ============================================

CREATE POLICY "Admins can manage subscribers"
  ON newsletter_subscribers FOR ALL
  USING (public.is_admin());

-- ============================================
-- TRUSTED SUBMITTERS POLICIES
-- ============================================

CREATE POLICY "Admins can manage trusted submitters"
  ON trusted_submitters FOR ALL
  USING (public.is_admin());

-- ============================================
-- QUIZ RESULTS POLICIES
-- ============================================

CREATE POLICY "Admins can manage quiz results"
  ON quiz_results FOR ALL
  USING (public.is_admin());

CREATE POLICY "Users can read own quiz results"
  ON quiz_results FOR SELECT
  USING (profile_id = auth.uid());

-- ============================================
-- TRUSTED SUBMITTER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_approved_count(submitter_email TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.trusted_submitters (email, approved_count, auto_approve, created_at)
  VALUES (submitter_email, 1, FALSE, NOW())
  ON CONFLICT (email) DO UPDATE
  SET approved_count = trusted_submitters.approved_count + 1,
      auto_approve = CASE
        WHEN trusted_submitters.approved_count + 1 >= 5 THEN TRUE
        ELSE trusted_submitters.auto_approve
      END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Admins can delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images' AND public.is_admin());

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_status_start_date ON events(status, start_date);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_newsletter_editions_status ON newsletter_editions(status);
CREATE INDEX idx_quiz_results_email ON quiz_results(email);
CREATE INDEX idx_quiz_results_primary_archetype ON quiz_results(primary_archetype);
CREATE INDEX idx_quiz_results_created_at ON quiz_results(created_at DESC);
