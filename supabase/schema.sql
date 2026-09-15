-- The Ubudian — public schema snapshot.
-- Generated 2026-09-15 by scripts/dump-schema.ts from the live database.
-- Reference only: supabase/migrations/ is the source of truth. Do not hand-edit; regenerate.

CREATE TABLE blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text,
  content text NOT NULL,
  cover_image_url text,
  status text DEFAULT 'draft'::text,
  published_at timestamp with time zone,
  meta_title text,
  meta_description text,
  is_placeholder boolean DEFAULT false,
  archetype_tags text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_members_only boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL,
  profile_id uuid,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  num_guests integer NOT NULL DEFAULT 1,
  preferred_date date NOT NULL,
  special_requests text,
  price_per_person integer NOT NULL,
  total_amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd'::text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_payment_status text DEFAULT 'unpaid'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  booking_reference text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE commission_partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  handle text NOT NULL,
  display_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  commission_pct numeric NOT NULL DEFAULT 30.00,
  profile_id uuid,
  bio text,
  avatar_url text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE commission_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  signups_count integer NOT NULL DEFAULT 0,
  gross_cents integer NOT NULL DEFAULT 0,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  paid_at timestamp with time zone,
  payment_method text,
  payment_reference text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE dedup_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_a_id uuid NOT NULL,
  event_b_id uuid NOT NULL,
  match_type text NOT NULL,
  confidence real NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE event_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  source_type text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  is_enabled boolean DEFAULT true,
  fetch_interval_minutes integer DEFAULT 240,
  last_fetched_at timestamp with time zone,
  last_success_at timestamp with time zone,
  last_error text,
  events_ingested_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  auto_approve_enabled boolean DEFAULT false,
  auto_approve_threshold real DEFAULT 0.85,
  PRIMARY KEY (id)
);

CREATE TABLE events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL,
  short_description text,
  cover_image_url text,
  category text NOT NULL,
  venue_name text,
  venue_address text,
  venue_map_url text,
  start_date date NOT NULL,
  end_date date,
  start_time time without time zone,
  end_time time without time zone,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  price_info text,
  external_ticket_url text,
  organizer_name text,
  organizer_contact text,
  organizer_instagram text,
  status text DEFAULT 'pending'::text,
  submitted_by_email text,
  is_trusted_submitter boolean DEFAULT false,
  rejection_reason text,
  is_placeholder boolean DEFAULT false,
  archetype_tags text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  source_id uuid,
  source_event_id text,
  source_url text,
  content_fingerprint text,
  raw_message_id uuid,
  llm_parsed boolean DEFAULT false,
  quality_score real,
  content_flags text[] DEFAULT '{}'::text[],
  latitude double precision,
  longitude double precision,
  ai_approved_at timestamp with time zone,
  moderation_reason text,
  is_core boolean NOT NULL DEFAULT false,
  last_refreshed_at timestamp with time zone,
  source_kind text DEFAULT 'manual'::text,
  raw_text_snippet text,
  parser_version text,
  ingested_at timestamp with time zone DEFAULT now(),
  intent_tags text[] NOT NULL DEFAULT '{}'::text[],
  is_members_only boolean NOT NULL DEFAULT false,
  members_only_teaser text,
  event_tier text NOT NULL DEFAULT 'core'::text,
  is_spotlight boolean NOT NULL DEFAULT false,
  embedding vector,
  vibe_tags text[] NOT NULL DEFAULT '{}'::text[],
  last_edited_by_submitter_at timestamp with time zone,
  auto_approved_at timestamp with time zone,
  PRIMARY KEY (id)
);

CREATE TABLE feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'general'::text,
  message text NOT NULL,
  email text,
  page_url text,
  page_title text,
  user_agent text,
  profile_id uuid,
  image_url text,
  status text NOT NULL DEFAULT 'new'::text,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  activity_trail jsonb,
  viewport_width integer,
  viewport_height integer,
  route_params jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE guide_entity_references (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL,
  ref_kind text NOT NULL,
  ref_slug text NOT NULL,
  ref_id uuid,
  position integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE guides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  tier text NOT NULL,
  title text NOT NULL,
  subtitle text,
  hero_quote text,
  intro_md text,
  body_md text NOT NULL,
  intent_tags text[] NOT NULL DEFAULT '{}'::text[],
  archetype_tags text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'draft'::text,
  is_members_only boolean NOT NULL DEFAULT false,
  is_editors_pick boolean NOT NULL DEFAULT false,
  editors_pick_position integer,
  reading_time_min integer,
  hero_image_url text,
  card_image_url text,
  linked_retreat_id uuid,
  related_guide_slugs text[] NOT NULL DEFAULT '{}'::text[],
  field_tested_by text,
  last_updated_at timestamp with time zone,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE image_gc_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  storage_path text NOT NULL,
  original_url text NOT NULL,
  collected_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE ingestion_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'running'::text,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  messages_fetched integer DEFAULT 0,
  messages_parsed integer DEFAULT 0,
  events_created integer DEFAULT 0,
  duplicates_found integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE journey_atoms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text NOT NULL,
  description text,
  short_description text,
  theme_tags text[] DEFAULT '{}'::text[],
  archetype_tags text[] DEFAULT '{}'::text[],
  image_url text,
  affiliate_url text,
  event_id uuid,
  practitioner_id uuid,
  partner_id uuid,
  latitude double precision,
  longitude double precision,
  google_maps_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_credit text,
  image_credit_url text,
  PRIMARY KEY (id)
);

CREATE TABLE journey_day_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  journey_day_id uuid NOT NULL,
  slot_window text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  is_optional boolean DEFAULT false,
  atom_kinds text[] DEFAULT '{}'::text[],
  theme_tags text[] DEFAULT '{}'::text[],
  curated_atom_id uuid,
  prompt text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE journey_days (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL,
  day_number integer NOT NULL,
  day_type text NOT NULL DEFAULT 'light'::text,
  theme text NOT NULL,
  theme_subtitle text,
  intention text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  background_image_url text,
  PRIMARY KEY (id)
);

CREATE TABLE journey_testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL,
  attendee_name text NOT NULL,
  attendee_origin text,
  quote text NOT NULL,
  journey_day_referenced integer,
  avatar_url text,
  sort_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE journeys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  subtitle text,
  tier text NOT NULL DEFAULT 'living_guide'::text,
  length_days integer NOT NULL,
  archetype_tags text[] DEFAULT '{}'::text[],
  cover_image_url text,
  hero_quote text,
  summary text,
  whats_included text,
  who_its_for text,
  practical_info text,
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  host_name text,
  host_role text,
  host_avatar_url text,
  cohort_size_min smallint,
  cohort_size_max smallint,
  villa_neighbourhood text,
  price_per_person_cents integer,
  next_cohort_starts_at date,
  next_cohort_ends_at date,
  next_cohort_status text,
  curator_note text,
  PRIMARY KEY (id)
);

CREATE TABLE newsletter_editions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  slug text NOT NULL,
  preview_text text,
  content_json jsonb,
  html_content text,
  featured_story_id uuid,
  sponsor_name text,
  sponsor_image_url text,
  sponsor_url text,
  sponsor_text text,
  status text DEFAULT 'draft'::text,
  beehiiv_post_id text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text,
  birthday date,
  instagram_handle text,
  beehiiv_subscriber_id text,
  status text DEFAULT 'active'::text,
  source text DEFAULT 'website'::text,
  archetype text,
  subscribed_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  description text,
  affiliate_url text,
  commission_rate numeric,
  contact_whatsapp text,
  contact_email text,
  base_location text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  archetype_tags text[] NOT NULL DEFAULT '{}'::text[],
  intent_tags text[] NOT NULL DEFAULT '{}'::text[],
  hero_image_url text,
  short_description text,
  PRIMARY KEY (id)
);

CREATE TABLE payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid,
  payment_type text NOT NULL,
  booking_id uuid,
  subscription_id uuid,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  stripe_charge_id text,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  receipt_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE places (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  description text,
  short_description text,
  photo_urls text[] NOT NULL DEFAULT '{}'::text[],
  hero_image_url text,
  address text,
  neighbourhood text,
  latitude numeric,
  longitude numeric,
  google_maps_url text,
  website_url text,
  instagram_handle text,
  opening_hours text,
  price_range text,
  theme_tags text[] NOT NULL DEFAULT '{}'::text[],
  archetype_tags text[] NOT NULL DEFAULT '{}'::text[],
  intent_tags text[] NOT NULL DEFAULT '{}'::text[],
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE practitioners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  modalities text[] DEFAULT '{}'::text[],
  bio text,
  photo_url text,
  contact_whatsapp text,
  contact_email text,
  contact_instagram text,
  base_location text,
  theme_tags text[] DEFAULT '{}'::text[],
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  archetype_tags text[] NOT NULL DEFAULT '{}'::text[],
  intent_tags text[] NOT NULL DEFAULT '{}'::text[],
  hero_image_url text,
  short_description text,
  PRIMARY KEY (id)
);

CREATE TABLE profiles (
  id uuid NOT NULL,
  email text,
  display_name text,
  avatar_url text,
  role text DEFAULT 'user'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  stripe_customer_id text,
  ics_token text,
  primary_archetype text,
  user_segment text,
  welcomed_at timestamp with time zone,
  email_opt_out boolean NOT NULL DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE quiz_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid,
  email text,
  primary_archetype text NOT NULL,
  secondary_archetype text,
  scores jsonb NOT NULL,
  answers jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  user_segment text,
  PRIMARY KEY (id)
);

CREATE TABLE raw_ingestion_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  run_id uuid,
  external_id text,
  content_text text,
  content_html text,
  image_urls text[],
  sender_name text,
  sender_id text,
  raw_data jsonb,
  status text NOT NULL DEFAULT 'pending'::text,
  parsed_event_data jsonb,
  parse_error text,
  event_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  chat_name text,
  PRIMARY KEY (id)
);

CREATE TABLE saved_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  event_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE saved_guides (
  profile_id uuid NOT NULL,
  guide_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, guide_id)
);

CREATE TABLE saved_journeys (
  profile_id uuid NOT NULL,
  journey_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, journey_id)
);

CREATE TABLE saved_spreads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  quiz_result_id uuid,
  primary_archetype text NOT NULL,
  secondary_archetype text,
  event_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE site_settings (
  id integer NOT NULL DEFAULT 1,
  blog_enabled boolean NOT NULL DEFAULT false,
  stories_enabled boolean NOT NULL DEFAULT false,
  tours_enabled boolean NOT NULL DEFAULT false,
  newsletter_archive_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  guides_enabled boolean NOT NULL DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE sponsor_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_name text,
  contact_email text NOT NULL,
  contact_whatsapp text,
  website_url text,
  tier_interest text,
  message text,
  status text NOT NULL DEFAULT 'new'::text,
  admin_notes text,
  sponsor_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE sponsors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  tagline text,
  description text,
  logo_url text,
  hero_image_url text,
  website_url text,
  instagram_handle text,
  contact_email text,
  contact_whatsapp text,
  tier text NOT NULL DEFAULT 'patron'::text,
  status text NOT NULL DEFAULT 'active'::text,
  category_sponsor text,
  monthly_amount_cents integer,
  starts_on date,
  ends_on date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  claimed_by_profile_id uuid,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  stripe_subscription_status text,
  PRIMARY KEY (id)
);

CREATE TABLE sponsorship_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL,
  event_type text NOT NULL,
  context_entity_type text,
  context_entity_id uuid,
  dedupe_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE sponsorships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE stories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  subject_name text NOT NULL,
  subject_instagram text,
  subject_tagline text,
  photo_urls text[],
  narrative text NOT NULL,
  theme_tags text[],
  status text DEFAULT 'draft'::text,
  published_at timestamp with time zone,
  meta_title text,
  meta_description text,
  is_placeholder boolean DEFAULT false,
  archetype_tags text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_members_only boolean DEFAULT false,
  related_organizer_name text,
  PRIMARY KEY (id)
);

CREATE TABLE subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  stripe_subscription_id text NOT NULL,
  stripe_customer_id text NOT NULL,
  stripe_price_id text,
  status text NOT NULL DEFAULT 'incomplete'::text,
  plan_name text NOT NULL DEFAULT 'Ubudian Insider'::text,
  interval text NOT NULL DEFAULT 'month'::text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  payment_country text,
  payment_last4 text,
  review_status text NOT NULL DEFAULT 'auto_approved'::text,
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  commission_partner_id uuid,
  commission_attribution_source text,
  PRIMARY KEY (id)
);

CREATE TABLE tours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL,
  short_description text,
  photo_urls text[],
  itinerary text,
  duration text,
  price_per_person integer,
  max_group_size integer,
  theme text,
  whats_included text,
  what_to_bring text,
  guide_name text,
  booking_whatsapp text,
  booking_email text,
  is_active boolean DEFAULT true,
  is_placeholder boolean DEFAULT false,
  archetype_tags text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  stripe_price_id text,
  PRIMARY KEY (id)
);

CREATE TABLE transactional_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  email text NOT NULL,
  dedupe_key text NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE trusted_submitters (
  email text NOT NULL,
  approved_count integer DEFAULT 0,
  auto_approve boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (email)
);

CREATE TABLE unresolved_venues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  raw_name text NOT NULL,
  normalized_name text NOT NULL,
  seen_count integer DEFAULT 1,
  first_seen_at timestamp with time zone DEFAULT now(),
  last_seen_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'unresolved'::text,
  resolved_canonical_name text,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  PRIMARY KEY (id)
);

CREATE TABLE venue_aliases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  alias text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE venue_coordinates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  geocoded_at timestamp with time zone NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'nominatim'::text,
  confidence real,
  PRIMARY KEY (id)
);

-- RLS policies (86); bodies live in the migrations.
--   blog_posts: Admins can manage blog posts [ALL] {public}
--   blog_posts: Published blog posts are viewable by everyone [SELECT] {public}
--   bookings: Admins can manage bookings [ALL] {public}
--   bookings: Users can read own bookings [SELECT] {authenticated}
--   commission_partners: Admins manage commission partners [ALL] {public}
--   commission_partners: Public can read active commission partners [SELECT] {public}
--   commission_payouts: Admins manage commission payouts [ALL] {public}
--   dedup_matches: Admins can manage dedup matches [ALL] {public}
--   event_sources: Admins can manage event sources [ALL] {public}
--   events: Admins can manage events [ALL] {public}
--   events: Approved events are viewable by everyone [SELECT] {public}
--   events: Authenticated users can submit events [INSERT] {authenticated}
--   events: Users can read own submitted events [SELECT] {authenticated}
--   feedback: Admins can manage feedback [ALL] {public}
--   guide_entity_references: guide_entity_references_admin_all [ALL] {public}
--   guide_entity_references: guide_entity_references_public_read [SELECT] {public}
--   guides: guides_admin_all [ALL] {public}
--   guides: guides_public_read [SELECT] {public}
--   image_gc_log: Admins can view image_gc_log [SELECT] {public}
--   ingestion_runs: Admins can manage ingestion runs [ALL] {public}
--   journey_atoms: Admins can manage journey_atoms [ALL] {public}
--   journey_atoms: Anyone can view active atoms [SELECT] {public}
--   journey_day_slots: Admins can manage journey_day_slots [ALL] {public}
--   journey_day_slots: Anyone can view slots of published journey days [SELECT] {public}
--   journey_days: Admins can manage journey_days [ALL] {public}
--   journey_days: Anyone can view days of published journeys [SELECT] {public}
--   journey_testimonials: Admins can manage testimonials [ALL] {public}
--   journey_testimonials: Anyone can view published testimonials [SELECT] {public}
--   journeys: Admins can manage journeys [ALL] {public}
--   journeys: Anyone can view published journeys [SELECT] {public}
--   newsletter_editions: Admins can manage newsletter editions [ALL] {public}
--   newsletter_editions: Published newsletter editions are viewable by everyone [SELECT] {public}
--   newsletter_subscribers: Admins can manage subscribers [ALL] {public}
--   newsletter_subscribers: Users can read own subscription [SELECT] {authenticated}
--   partners: Admins can manage partners [ALL] {public}
--   partners: Anyone can view active partners [SELECT] {public}
--   payments: Admins can manage payments [ALL] {public}
--   payments: Users can read own payments [SELECT] {authenticated}
--   places: places_admin_all [ALL] {public}
--   places: places_public_read [SELECT] {public}
--   practitioners: Admins can manage practitioners [ALL] {public}
--   practitioners: Anyone can view active practitioners [SELECT] {public}
--   profiles: Profiles are viewable by everyone [SELECT] {public}
--   profiles: Users can update own profile [UPDATE] {public}
--   quiz_results: Admins can manage quiz results [ALL] {public}
--   quiz_results: Users can read own quiz results [SELECT] {public}
--   raw_ingestion_messages: Admins can manage raw messages [ALL] {public}
--   saved_events: Admins can manage saved events [ALL] {public}
--   saved_events: Users can read own saved events [SELECT] {authenticated}
--   saved_events: Users can save events [INSERT] {authenticated}
--   saved_events: Users can unsave events [DELETE] {authenticated}
--   saved_guides: saved_guides_owner_delete [DELETE] {public}
--   saved_guides: saved_guides_owner_insert [INSERT] {public}
--   saved_guides: saved_guides_owner_select [SELECT] {public}
--   saved_journeys: Admins manage saved_journeys [ALL] {public}
--   saved_journeys: Users save their own journeys [INSERT] {public}
--   saved_journeys: Users see their own saved journeys [SELECT] {public}
--   saved_journeys: Users unsave their own journeys [DELETE] {public}
--   saved_spreads: Admins manage spreads [ALL] {public}
--   saved_spreads: Users delete own spreads [DELETE] {authenticated}
--   saved_spreads: Users insert own spreads [INSERT] {authenticated}
--   saved_spreads: Users read own spreads [SELECT] {authenticated}
--   site_settings: site_settings admin update [UPDATE] {public}
--   site_settings: site_settings public read [SELECT] {public}
--   sponsor_leads: Admins manage sponsor leads [ALL] {public}
--   sponsors: Admins can manage sponsors [ALL] {public}
--   sponsors: Anyone can view active sponsors [SELECT] {public}
--   sponsors: Claimed sponsor self-read [SELECT] {public}
--   sponsors: Claimed sponsor self-update [UPDATE] {public}
--   sponsorship_events: Admins read sponsorship events [SELECT] {public}
--   sponsorship_events: Claimed sponsor reads own events [SELECT] {public}
--   sponsorships: Admins can manage sponsorships [ALL] {public}
--   sponsorships: Anyone can view sponsorships [SELECT] {public}
--   stories: Admins can manage stories [ALL] {public}
--   stories: Published stories are viewable by everyone [SELECT] {public}
--   subscriptions: Admins can manage subscriptions [ALL] {public}
--   subscriptions: Users can read own subscriptions [SELECT] {authenticated}
--   tours: Active tours are viewable by everyone [SELECT] {public}
--   tours: Admins can manage tours [ALL] {public}
--   transactional_sends: Admins manage transactional sends [ALL] {public}
--   trusted_submitters: Admins can manage trusted submitters [ALL] {public}
--   unresolved_venues: Admins can manage unresolved venues [ALL] {public}
--   venue_aliases: Admins can manage venue aliases [ALL] {public}
--   venue_aliases: Anyone can read venue aliases [SELECT] {public}
--   venue_coordinates: venue_coordinates_admin_write [ALL] {public}
--   venue_coordinates: venue_coordinates_public_read [SELECT] {public}

-- Functions (136)
--   analytics_accounts_per_day(days integer)
--   analytics_archetype_distribution()
--   analytics_login_stats()
--   analytics_newsletter_per_day(days integer)
--   analytics_revenue_summary()
--   analytics_signups_by_source()
--   analytics_top_saved_events(lim integer)
--   analytics_top_saved_guides(lim integer)
--   analytics_top_saved_journeys(lim integer)
--   archetype_centroid(p_archetype text)
--   array_to_halfvec(integer[], integer, boolean)
--   array_to_halfvec(double precision[], integer, boolean)
--   array_to_halfvec(real[], integer, boolean)
--   array_to_halfvec(numeric[], integer, boolean)
--   array_to_sparsevec(real[], integer, boolean)
--   array_to_sparsevec(numeric[], integer, boolean)
--   array_to_sparsevec(double precision[], integer, boolean)
--   array_to_sparsevec(integer[], integer, boolean)
--   array_to_vector(double precision[], integer, boolean)
--   array_to_vector(numeric[], integer, boolean)
--   array_to_vector(real[], integer, boolean)
--   array_to_vector(integer[], integer, boolean)
--   avg(vector)
--   avg(halfvec)
--   binary_quantize(halfvec)
--   binary_quantize(vector)
--   cosine_distance(halfvec, halfvec)
--   cosine_distance(vector, vector)
--   cosine_distance(sparsevec, sparsevec)
--   halfvec(halfvec, integer, boolean)
--   halfvec_accum(double precision[], halfvec)
--   halfvec_add(halfvec, halfvec)
--   halfvec_avg(double precision[])
--   halfvec_cmp(halfvec, halfvec)
--   halfvec_combine(double precision[], double precision[])
--   halfvec_concat(halfvec, halfvec)
--   halfvec_eq(halfvec, halfvec)
--   halfvec_ge(halfvec, halfvec)
--   halfvec_gt(halfvec, halfvec)
--   halfvec_in(cstring, oid, integer)
--   halfvec_l2_squared_distance(halfvec, halfvec)
--   halfvec_le(halfvec, halfvec)
--   halfvec_lt(halfvec, halfvec)
--   halfvec_mul(halfvec, halfvec)
--   halfvec_ne(halfvec, halfvec)
--   halfvec_negative_inner_product(halfvec, halfvec)
--   halfvec_out(halfvec)
--   halfvec_recv(internal, oid, integer)
--   halfvec_send(halfvec)
--   halfvec_spherical_distance(halfvec, halfvec)
--   halfvec_sub(halfvec, halfvec)
--   halfvec_to_float4(halfvec, integer, boolean)
--   halfvec_to_sparsevec(halfvec, integer, boolean)
--   halfvec_to_vector(halfvec, integer, boolean)
--   halfvec_typmod_in(cstring[])
--   hamming_distance(bit, bit)
--   handle_new_user()
--   hnsw_bit_support(internal)
--   hnsw_halfvec_support(internal)
--   hnsw_sparsevec_support(internal)
--   hnswhandler(internal)
--   increment_approved_count(submitter_email text)
--   increment_venue_seen_count(p_normalized_name text, p_raw_name text)
--   inner_product(sparsevec, sparsevec)
--   inner_product(vector, vector)
--   inner_product(halfvec, halfvec)
--   is_admin()
--   ivfflat_bit_support(internal)
--   ivfflat_halfvec_support(internal)
--   ivfflathandler(internal)
--   jaccard_distance(bit, bit)
--   l1_distance(halfvec, halfvec)
--   l1_distance(vector, vector)
--   l1_distance(sparsevec, sparsevec)
--   l2_distance(vector, vector)
--   l2_distance(halfvec, halfvec)
--   l2_distance(sparsevec, sparsevec)
--   l2_norm(sparsevec)
--   l2_norm(halfvec)
--   l2_normalize(halfvec)
--   l2_normalize(vector)
--   l2_normalize(sparsevec)
--   match_events_by_embedding(query_embedding vector, match_count integer, exclude_id uuid)
--   places_set_updated_at()
--   sparsevec(sparsevec, integer, boolean)
--   sparsevec_cmp(sparsevec, sparsevec)
--   sparsevec_eq(sparsevec, sparsevec)
--   sparsevec_ge(sparsevec, sparsevec)
--   sparsevec_gt(sparsevec, sparsevec)
--   sparsevec_in(cstring, oid, integer)
--   sparsevec_l2_squared_distance(sparsevec, sparsevec)
--   sparsevec_le(sparsevec, sparsevec)
--   sparsevec_lt(sparsevec, sparsevec)
--   sparsevec_ne(sparsevec, sparsevec)
--   sparsevec_negative_inner_product(sparsevec, sparsevec)
--   sparsevec_out(sparsevec)
--   sparsevec_recv(internal, oid, integer)
--   sparsevec_send(sparsevec)
--   sparsevec_to_halfvec(sparsevec, integer, boolean)
--   sparsevec_to_vector(sparsevec, integer, boolean)
--   sparsevec_typmod_in(cstring[])
--   subvector(halfvec, integer, integer)
--   subvector(vector, integer, integer)
--   sum(vector)
--   sum(halfvec)
--   sync_guide_references(p_guide_id uuid, p_refs jsonb)
--   user_taste_vector(p_profile_id uuid)
--   vector(vector, integer, boolean)
--   vector_accum(double precision[], vector)
--   vector_add(vector, vector)
--   vector_avg(double precision[])
--   vector_cmp(vector, vector)
--   vector_combine(double precision[], double precision[])
--   vector_concat(vector, vector)
--   vector_dims(vector)
--   vector_dims(halfvec)
--   vector_eq(vector, vector)
--   vector_ge(vector, vector)
--   vector_gt(vector, vector)
--   vector_in(cstring, oid, integer)
--   vector_l2_squared_distance(vector, vector)
--   vector_le(vector, vector)
--   vector_lt(vector, vector)
--   vector_mul(vector, vector)
--   vector_ne(vector, vector)
--   vector_negative_inner_product(vector, vector)
--   vector_norm(vector)
--   vector_out(vector)
--   vector_recv(internal, oid, integer)
--   vector_send(vector)
--   vector_spherical_distance(vector, vector)
--   vector_sub(vector, vector)
--   vector_to_float4(vector, integer, boolean)
--   vector_to_halfvec(vector, integer, boolean)
--   vector_to_sparsevec(vector, integer, boolean)
--   vector_typmod_in(cstring[])
