export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  stripe_customer_id: string | null;
  ics_token: string | null;
  created_at: string;
  updated_at: string;
  primary_archetype?: string | null;
  user_segment?: string | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_placeholder: boolean;
  is_members_only: boolean;
  archetype_tags: ArchetypeId[];
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  title: string;
  slug: string;
  subject_name: string;
  subject_instagram: string | null;
  subject_tagline: string | null;
  photo_urls: string[];
  narrative: string;
  theme_tags: string[];
  status: "draft" | "published" | "archived";
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_placeholder: boolean;
  is_members_only: boolean;
  archetype_tags: ArchetypeId[];
  related_organizer_name: string | null;
  created_at: string;
  updated_at: string;
}

export type GuideTier = "practical" | "intent";
export type GuideStatus = "draft" | "published" | "archived";
export type GuideIntent =
  | "romance"
  | "community"
  | "spirit"
  | "living"
  | "local_culture";
export type GuideShortcodeKind =
  | "event"
  | "practitioner"
  | "place"
  | "partner"
  | "story"
  | "retreat";

export interface Guide {
  id: string;
  slug: string;
  tier: GuideTier;
  title: string;
  subtitle: string | null;
  hero_quote: string | null;
  intro_md: string | null;
  body_md: string;
  intent_tags: GuideIntent[];
  archetype_tags: ArchetypeId[];
  status: GuideStatus;
  is_members_only: boolean;
  is_editors_pick: boolean;
  editors_pick_position: number | null;
  reading_time_min: number | null;
  hero_image_url: string | null;
  card_image_url: string | null;
  linked_retreat_id: string | null;
  related_guide_slugs: string[];
  field_tested_by: string | null;
  last_updated_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string | null;
  cover_image_url: string | null;
  category: string;
  venue_name: string | null;
  venue_address: string | null;
  venue_map_url: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  price_info: string | null;
  external_ticket_url: string | null;
  organizer_name: string | null;
  organizer_contact: string | null;
  organizer_instagram: string | null;
  status: "pending" | "approved" | "rejected" | "archived";
  submitted_by_email: string | null;
  is_trusted_submitter: boolean;
  rejection_reason: string | null;
  is_placeholder: boolean;
  is_core: boolean;
  archetype_tags: ArchetypeId[];
  // Ingestion fields
  source_id: string | null;
  source_event_id: string | null;
  source_url: string | null;
  content_fingerprint: string | null;
  raw_message_id: string | null;
  llm_parsed: boolean;
  quality_score: number | null;
  content_flags: string[];
  // Geo (populated by venue geocoding)
  latitude: number | null;
  longitude: number | null;
  // AI moderation audit
  ai_approved_at: string | null;
  moderation_reason: string | null;
  // Diagnostic metadata
  source_kind: "seed" | "llm" | "manual" | "submission" | null;
  raw_text_snippet: string | null;
  parser_version: string | null;
  ingested_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueCoordinates {
  id: string;
  canonical_name: string;
  latitude: number;
  longitude: number;
  geocoded_at: string;
  source: "nominatim" | "manual";
  confidence: number | null;
}

export interface Tour {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string | null;
  photo_urls: string[];
  itinerary: string | null;
  duration: string | null;
  price_per_person: number | null;
  max_group_size: number | null;
  theme: string | null;
  whats_included: string | null;
  what_to_bring: string | null;
  guide_name: string | null;
  booking_whatsapp: string | null;
  booking_email: string | null;
  is_active: boolean;
  is_placeholder: boolean;
  stripe_price_id: string | null;
  archetype_tags: ArchetypeId[];
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  cover_image_url: string | null;
  description: string;
  who_its_for: string | null;
  practical_info: string | null;
  category: string;
  archetype_tags: ArchetypeId[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Journeys (the new "Experiences" — time-bounded curated paths)
// ============================================

export type JourneyTier = "living_guide" | "self_paced" | "signature_cohort";
export type JourneyDayType = "arrival" | "light" | "active" | "rest" | "closing";
export type JourneyDayWindow = "morning" | "afternoon" | "evening";
export type JourneyAtomKind =
  | "event_ref"
  | "accommodation"
  | "restaurant"
  | "practitioner"
  | "place"
  | "ritual"
  | "reflection";
export type PartnerKind =
  | "villa"
  | "hotel"
  | "homestay"
  | "restaurant"
  | "cafe"
  | "studio"
  | "spa"
  | "other";

export type CohortStatus = "open" | "almost_full" | "full" | "waitlist";

export interface Journey {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  tier: JourneyTier;
  length_days: number;
  archetype_tags: ArchetypeId[];
  cover_image_url: string | null;
  hero_quote: string | null;
  summary: string | null;
  whats_included: string | null;
  who_its_for: string | null;
  practical_info: string | null;
  /** Editorial note from the curator — surfaced under the hero quote on the detail page. */
  curator_note: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  host_name: string | null;
  host_role: string | null;
  host_avatar_url: string | null;
  cohort_size_min: number | null;
  cohort_size_max: number | null;
  villa_neighbourhood: string | null;
  price_per_person_cents: number | null;
  next_cohort_starts_at: string | null;
  next_cohort_ends_at: string | null;
  next_cohort_status: CohortStatus | null;
}

export interface JourneyDay {
  id: string;
  journey_id: string;
  day_number: number;
  day_type: JourneyDayType;
  theme: string;
  theme_subtitle: string | null;
  intention: string | null;
  background_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface JourneyDaySlot {
  id: string;
  journey_day_id: string;
  slot_window: JourneyDayWindow;
  position: number;
  is_optional: boolean;
  atom_kinds: JourneyAtomKind[];
  theme_tags: string[];
  curated_atom_id: string | null;
  prompt: string | null;
  created_at: string;
  updated_at: string;
}

export interface JourneyAtom {
  id: string;
  kind: JourneyAtomKind;
  title: string;
  description: string | null;
  short_description: string | null;
  theme_tags: string[];
  archetype_tags: ArchetypeId[];
  image_url: string | null;
  /** Plain-text caption shown under atom images (e.g. "Photo: @hujanlocale", "Representative · visit Hujan Locale"). */
  image_credit: string | null;
  /** Optional link target for the credit caption — usually the venue's site or IG. */
  image_credit_url: string | null;
  affiliate_url: string | null;
  event_id: string | null;
  practitioner_id: string | null;
  partner_id: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Practitioner {
  id: string;
  slug: string;
  name: string;
  modalities: string[];
  bio: string | null;
  photo_url: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  contact_instagram: string | null;
  base_location: string | null;
  theme_tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  slug: string;
  name: string;
  kind: PartnerKind;
  description: string | null;
  affiliate_url: string | null;
  commission_rate: number | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  base_location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JourneyTestimonial {
  id: string;
  journey_id: string;
  attendee_name: string;
  attendee_origin: string | null;
  quote: string;
  journey_day_referenced: number | null;
  avatar_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedJourney {
  profile_id: string;
  journey_id: string;
  created_at: string;
}

/**
 * A `JourneyDay` enriched with its ordered slots and (optionally) the resolved
 * atom candidates per slot — the shape the public journey detail page consumes.
 */
export interface JourneyDayWithSlots extends JourneyDay {
  slots: (JourneyDaySlot & {
    candidates: JourneyAtom[];   // [] when no candidates resolve for this user/date
  })[];
}

/**
 * A full `Journey` enriched with days + their slots + resolved candidates.
 */
export interface JourneyWithDays extends Journey {
  days: JourneyDayWithSlots[];
}

export interface NewsletterEdition {
  id: string;
  subject: string;
  slug: string;
  preview_text: string | null;
  content_json: Record<string, unknown> | null;
  html_content: string | null;
  featured_story_id: string | null;
  sponsor_name: string | null;
  sponsor_image_url: string | null;
  sponsor_url: string | null;
  sponsor_text: string | null;
  status: "draft" | "published" | "archived";
  beehiiv_post_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  first_name: string | null;
  birthday: string | null;
  instagram_handle: string | null;
  beehiiv_subscriber_id: string | null;
  status: "active" | "unsubscribed";
  source: string;
  archetype: ArchetypeId | null;
  subscribed_at: string;
}

export interface TrustedSubmitter {
  email: string;
  approved_count: number;
  auto_approve: boolean;
  created_at: string;
}

// ============================================
// QUIZ TYPES
// ============================================

export type ArchetypeId = "seeker" | "explorer" | "creative" | "connector" | "epicurean";

export type UserSegment = "curious" | "visiting" | "local";

export interface QuizAnswer {
  id: string;
  text: string;
  image_url?: string;
  scores: Record<ArchetypeId, number>;
}

export interface QuizQuestion {
  id: number;
  question: string;
  type: "image" | "text";
  answers: QuizAnswer[];
}

export interface ArchetypeResult {
  id: ArchetypeId;
  name: string;
  tagline: string;
  description: string;
  hero_image: string;
  color: string;
  content_keywords: {
    event_categories: string[];
    tour_themes: string[];
    story_theme_tags: string[];
  };
}

export interface QuizScores {
  seeker: number;
  explorer: number;
  creative: number;
  connector: number;
  epicurean: number;
}

export interface QuizResultRecord {
  id: string;
  profile_id: string | null;
  email: string | null;
  primary_archetype: ArchetypeId;
  secondary_archetype: ArchetypeId | null;
  scores: QuizScores;
  answers: { question_id: number; answer_id: string }[];
  user_segment?: string | null;
  created_at: string;
}

// ============================================
// STRIPE / BOOKING / SUBSCRIPTION TYPES
// ============================================

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "refunded";

export interface Booking {
  id: string;
  tour_id: string;
  profile_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  num_guests: number;
  preferred_date: string;
  special_requests: string | null;
  price_per_person: number; // cents USD
  total_amount: number; // cents USD
  currency: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_payment_status: string;
  status: BookingStatus;
  booking_reference: string;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete";

export interface Subscription {
  id: string;
  profile_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string | null;
  status: SubscriptionStatus;
  plan_name: string;
  interval: "month" | "year";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface Payment {
  id: string;
  profile_id: string | null;
  payment_type: "tour_booking" | "subscription";
  booking_id: string | null;
  subscription_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  stripe_charge_id: string | null;
  amount: number; // cents
  currency: string;
  status: PaymentStatus;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// INGESTION TYPES
// ============================================

export type SourceType = "telegram" | "api" | "scraper" | "whatsapp" | "facebook" | "instagram" | "manual";

export interface EventSource {
  id: string;
  name: string;
  slug: string;
  source_type: SourceType;
  config: Record<string, unknown>;
  is_enabled: boolean;
  fetch_interval_minutes: number;
  last_fetched_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  events_ingested_count: number;
  auto_approve_enabled: boolean;
  auto_approve_threshold: number;
  created_at: string;
  updated_at: string;
}

export type IngestionRunStatus = "running" | "completed" | "failed";

export interface IngestionRun {
  id: string;
  source_id: string;
  status: IngestionRunStatus;
  started_at: string;
  completed_at: string | null;
  messages_fetched: number;
  messages_parsed: number;
  events_created: number;
  duplicates_found: number;
  errors_count: number;
  error_log: unknown[];
  created_at: string;
}

export type RawMessageStatus = "pending" | "parsed" | "not_event" | "failed" | "duplicate";

export interface RawIngestionMessage {
  id: string;
  source_id: string;
  run_id: string | null;
  external_id: string | null;
  content_text: string | null;
  content_html: string | null;
  image_urls: string[] | null;
  sender_name: string | null;
  sender_id: string | null;
  chat_name: string | null;
  raw_data: unknown;
  status: RawMessageStatus;
  parsed_event_data: unknown;
  parse_error: string | null;
  event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueAlias {
  id: string;
  canonical_name: string;
  alias: string;
  created_at: string;
}

export type DedupMatchType = "exact_url" | "fingerprint" | "fuzzy_title" | "semantic";
export type DedupMatchStatus = "pending" | "confirmed_dup" | "not_dup" | "merged";

export interface DedupMatch {
  id: string;
  event_a_id: string;
  event_b_id: string;
  match_type: DedupMatchType;
  confidence: number;
  status: DedupMatchStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type UnresolvedVenueStatus = "unresolved" | "resolved" | "ignored";

export interface UnresolvedVenue {
  id: string;
  raw_name: string;
  normalized_name: string;
  seen_count: number;
  first_seen_at: string;
  last_seen_at: string;
  status: UnresolvedVenueStatus;
  resolved_canonical_name: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

export type ActivityCategory = "event_created" | "event_enriched" | "event_moderation" | "source_error" | "source_recovered" | "group_quiet" | "run_summary";
export type ActivitySeverity = "info" | "warning" | "error";

export interface IngestionActivityLog {
  id: string;
  category: ActivityCategory;
  severity: ActivitySeverity;
  title: string;
  details: Record<string, unknown> | null;
  source_id: string | null;
  created_at: string;
}

export interface SavedEvent {
  id: string;
  profile_id: string;
  event_id: string;
  created_at: string;
}

// ============================================
// FEEDBACK TYPES
// ============================================

export type FeedbackType = "bug" | "suggestion" | "general";
export type FeedbackStatus = "new" | "reviewed" | "actioned" | "dismissed";

export interface ActivityEvent {
  t: number;
  kind: "route" | "click" | "fetch" | "error";
  detail: string;
}

export interface Feedback {
  id: string;
  type: FeedbackType;
  message: string;
  email: string | null;
  page_url: string | null;
  page_title: string | null;
  user_agent: string | null;
  profile_id: string | null;
  image_url: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  pr_url: string | null;
  route_params: Record<string, string> | null;
  viewport_width: number | null;
  viewport_height: number | null;
  activity_trail: ActivityEvent[] | null;
  created_at: string;
}

// ============================================
// PIPELINE HEALTH LOG TYPES
// ============================================

export type HealthLogType = "success" | "warning" | "error" | "info";
export type HealthLogChannel = "telegram" | "whatsapp" | "megatix" | "system";

export interface PipelineHealthLog {
  id: string;
  log_type: HealthLogType;
  channel: HealthLogChannel | null;
  group_name: string | null;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
