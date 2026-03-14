-- The Ubudian — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

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

-- ============================================
-- EVENT INGESTION TABLES
-- ============================================

CREATE TABLE event_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL, -- 'telegram' | 'api' | 'scraper' | 'whatsapp' | 'facebook' | 'instagram' | 'manual'
  config JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT TRUE,
  fetch_interval_minutes INTEGER DEFAULT 240,
  last_fetched_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  events_ingested_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES event_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  messages_fetched INTEGER DEFAULT 0,
  messages_parsed INTEGER DEFAULT 0,
  events_created INTEGER DEFAULT 0,
  duplicates_found INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE raw_ingestion_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES event_sources(id) ON DELETE CASCADE,
  run_id UUID REFERENCES ingestion_runs(id) ON DELETE SET NULL,
  external_id TEXT,
  content_text TEXT,
  content_html TEXT,
  image_urls TEXT[],
  sender_name TEXT,
  sender_id TEXT,
  raw_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  parsed_event_data JSONB,
  parse_error TEXT,
  event_id UUID, -- set after event creation (FK added after events table)
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
  -- Ingestion columns
  source_id UUID REFERENCES event_sources(id) ON DELETE SET NULL,
  source_event_id TEXT,
  source_url TEXT,
  content_fingerprint TEXT,
  raw_message_id UUID REFERENCES raw_ingestion_messages(id) ON DELETE SET NULL,
  llm_parsed BOOLEAN DEFAULT FALSE,
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

-- Add FK from raw_ingestion_messages to events (deferred because of table order)
ALTER TABLE raw_ingestion_messages
  ADD CONSTRAINT fk_raw_messages_event
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

CREATE TABLE venue_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alias)
);

CREATE TABLE dedup_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_a_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_b_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL,
  confidence REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_a_id, event_b_id)
);

CREATE TABLE unresolved_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_name TEXT NOT NULL,
  normalized_name TEXT UNIQUE NOT NULL,
  seen_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'unresolved',
  resolved_canonical_name TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
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

CREATE TABLE saved_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, event_id)
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
ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;

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

-- Anyone can read profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- BLOG POSTS POLICIES
-- ============================================

-- Public can read published posts
CREATE POLICY "Published blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Admins can do everything
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

-- Public can read approved events
CREATE POLICY "Approved events are viewable by everyone"
  ON events FOR SELECT
  USING (status = 'approved');

-- Authenticated users can submit events (status: pending)
CREATE POLICY "Authenticated users can submit events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (status = 'pending');

-- Users can read their own submitted events (all statuses)
CREATE POLICY "Users can read own submitted events"
  ON events FOR SELECT
  TO authenticated
  USING (submitted_by_email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Admins can manage all events
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

-- Only admins can view/manage subscribers
CREATE POLICY "Admins can manage subscribers"
  ON newsletter_subscribers FOR ALL
  USING (public.is_admin());

-- Users can read their own subscription status
CREATE POLICY "Users can read own subscription"
  ON newsletter_subscribers FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Allow insert via service role (API route uses admin client)
-- No anonymous insert policy needed since we use the service role key

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
-- SAVED EVENTS POLICIES
-- ============================================

CREATE POLICY "Users can read own saved events"
  ON saved_events FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can save events"
  ON saved_events FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can unsave events"
  ON saved_events FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage saved events"
  ON saved_events FOR ALL
  USING (public.is_admin());

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
-- VENUE SEEN COUNT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION increment_venue_seen_count(
  p_normalized_name TEXT,
  p_raw_name TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO unresolved_venues (raw_name, normalized_name, seen_count, first_seen_at, last_seen_at, status)
  VALUES (p_raw_name, p_normalized_name, 1, NOW(), NOW(), 'unresolved')
  ON CONFLICT (normalized_name) DO UPDATE SET
    seen_count = unresolved_venues.seen_count + 1,
    last_seen_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Create a public bucket for images (run in SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Allow public to read images
CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- Allow admins to delete images
CREATE POLICY "Admins can delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images' AND public.is_admin());

-- ============================================
-- INGESTION TABLE RLS & POLICIES
-- ============================================

ALTER TABLE event_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_ingestion_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE dedup_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE unresolved_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage event sources"
  ON event_sources FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage ingestion runs"
  ON ingestion_runs FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage raw messages"
  ON raw_ingestion_messages FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage venue aliases"
  ON venue_aliases FOR ALL
  USING (public.is_admin());

CREATE POLICY "Anyone can read venue aliases"
  ON venue_aliases FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage dedup matches"
  ON dedup_matches FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage unresolved venues"
  ON unresolved_venues FOR ALL
  USING (public.is_admin());

-- ============================================
-- SEED DATA: VENUE ALIASES
-- ============================================

INSERT INTO venue_aliases (canonical_name, alias) VALUES
  ('The Yoga Barn', 'Yoga Barn'),
  ('The Yoga Barn', 'yoga barn ubud'),
  ('The Yoga Barn', 'The Yoga Barn Ubud'),
  ('Pyramids of Chi', 'pyramids of chi ubud'),
  ('Pyramids of Chi', 'Pyramids Of Chi Ubud'),
  ('Pyramids of Chi', 'POC Ubud'),
  ('Outpost', 'Outpost Ubud'),
  ('Outpost', 'outpost coworking'),
  ('Outpost', 'Outpost Co-working'),
  ('Hubud', 'Hubud Bali'),
  ('Hubud', 'hubud coworking'),
  ('Alchemy', 'Alchemy Ubud'),
  ('Alchemy', 'Alchemy Bali'),
  ('CP Lounge', 'CP Lounge Ubud'),
  ('CP Lounge', 'CPUB'),
  ('Ubud Palace', 'Puri Saren Agung'),
  ('Ubud Palace', 'Puri Saren'),
  ('ARMA Museum', 'Agung Rai Museum of Art'),
  ('ARMA Museum', 'ARMA'),
  ('Neka Art Museum', 'Neka Museum'),
  ('Neka Art Museum', 'Neka'),
  ('Museum Puri Lukisan', 'Puri Lukisan'),
  ('Museum Puri Lukisan', 'Puri Lukisan Museum'),
  ('Intuitive Flow', 'Intuitive Flow Yoga'),
  ('Intuitive Flow', 'Intuitive Flow Ubud'),
  ('Radiantly Alive', 'Radiantly Alive Yoga'),
  ('Radiantly Alive', 'Radiantly Alive Ubud'),
  ('Taksu', 'Taksu Ubud'),
  ('Taksu', 'Taksu Spa'),
  ('Bridges Bali', 'Bridges Restaurant'),
  ('Bridges Bali', 'Bridges Ubud'),
  ('Locavore', 'Locavore Ubud'),
  ('Locavore', 'Locavore Restaurant'),
  ('Sacred Monkey Forest Sanctuary', 'Monkey Forest'),
  ('Sacred Monkey Forest Sanctuary', 'Monkey Forest Ubud'),
  ('Sacred Monkey Forest Sanctuary', 'Sacred Monkey Forest'),
  ('Campuhan Ridge Walk', 'Campuhan Ridge'),
  ('Campuhan Ridge Walk', 'Campuhan Walk'),
  ('Fivelements', 'Fivelements Bali'),
  ('Fivelements', 'Five Elements'),
  ('Bambu Indah', 'Bambu Indah Ubud'),
  ('Komaneka', 'Komaneka at Bisma'),
  ('Komaneka', 'Komaneka Ubud'),
  ('BaliSpirit Festival Grounds', 'BaliSpirit Festival'),
  ('BaliSpirit Festival Grounds', 'Bali Spirit Festival')
ON CONFLICT (alias) DO NOTHING;

-- ============================================
-- STRIPE INTEGRATION: ALTER EXISTING TABLES
-- ============================================

ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
ALTER TABLE tours ADD COLUMN stripe_price_id TEXT;
ALTER TABLE blog_posts ADD COLUMN is_members_only BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN is_members_only BOOLEAN DEFAULT FALSE;

-- ============================================
-- BOOKINGS TABLE (tour booking records)
-- ============================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  num_guests INTEGER NOT NULL DEFAULT 1,
  preferred_date DATE NOT NULL,
  special_requests TEXT,
  price_per_person INTEGER NOT NULL,  -- cents USD
  total_amount INTEGER NOT NULL,       -- cents USD
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_payment_status TEXT DEFAULT 'unpaid', -- unpaid/paid/failed/refunded
  status TEXT NOT NULL DEFAULT 'pending', -- pending/confirmed/cancelled/completed/refunded
  booking_reference TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS TABLE (membership records)
-- ============================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete', -- active/trialing/past_due/canceled/unpaid/incomplete
  plan_name TEXT NOT NULL DEFAULT 'Ubudian Insider',
  interval TEXT NOT NULL DEFAULT 'month', -- month/year
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE (unified transaction log)
-- ============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  payment_type TEXT NOT NULL, -- tour_booking/subscription
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  stripe_charge_id TEXT,
  amount INTEGER NOT NULL, -- cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending', -- pending/succeeded/failed/refunded
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STRIPE TABLES: RLS
-- ============================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Bookings: users can read own, admins can manage all
CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR guest_email = (SELECT email FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage bookings"
  ON bookings FOR ALL
  USING (public.is_admin());

-- Subscriptions: users can read own, admins can manage all
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage subscriptions"
  ON subscriptions FOR ALL
  USING (public.is_admin());

-- Payments: users can read own, admins can manage all
CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage payments"
  ON payments FOR ALL
  USING (public.is_admin());

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_status_start_date ON events(status, start_date);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_newsletter_editions_status ON newsletter_editions(status);
CREATE INDEX idx_saved_events_profile ON saved_events(profile_id);
CREATE INDEX idx_event_sources_enabled ON event_sources(is_enabled);
CREATE INDEX idx_ingestion_runs_source ON ingestion_runs(source_id);
CREATE INDEX idx_ingestion_runs_status ON ingestion_runs(status);
CREATE INDEX idx_raw_messages_source ON raw_ingestion_messages(source_id);
CREATE INDEX idx_raw_messages_status ON raw_ingestion_messages(status);
CREATE INDEX idx_raw_messages_external_id ON raw_ingestion_messages(source_id, external_id);
CREATE INDEX idx_venue_aliases_alias ON venue_aliases(alias);
CREATE INDEX idx_dedup_matches_status ON dedup_matches(status);
CREATE INDEX idx_events_source ON events(source_id);
CREATE INDEX idx_events_fingerprint ON events(content_fingerprint);
CREATE INDEX idx_events_source_event_id ON events(source_id, source_event_id);
CREATE INDEX idx_events_source_url ON events(source_url);
CREATE INDEX idx_quiz_results_email ON quiz_results(email);
CREATE INDEX idx_quiz_results_primary_archetype ON quiz_results(primary_archetype);
CREATE INDEX idx_quiz_results_created_at ON quiz_results(created_at DESC);
CREATE INDEX idx_event_sources_type ON event_sources(source_type);
CREATE INDEX idx_venue_aliases_canonical ON venue_aliases(canonical_name);
CREATE INDEX idx_dedup_matches_events ON dedup_matches(event_a_id, event_b_id);
CREATE INDEX idx_unresolved_venues_status ON unresolved_venues(status);
CREATE INDEX idx_unresolved_venues_seen_count ON unresolved_venues(seen_count DESC);

-- Stripe integration indexes
CREATE INDEX idx_bookings_tour ON bookings(tour_id);
CREATE INDEX idx_bookings_profile ON bookings(profile_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_stripe_session ON bookings(stripe_checkout_session_id);
CREATE INDEX idx_subscriptions_profile ON subscriptions(profile_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_payments_profile ON payments(profile_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_stripe_pi ON payments(stripe_payment_intent_id);
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);
