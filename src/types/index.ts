export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
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
  archetype_tags: ArchetypeId[];
  created_at: string;
  updated_at: string;
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
  archetype_tags: ArchetypeId[];
  // Ingestion fields
  source_id: string | null;
  source_event_id: string | null;
  source_url: string | null;
  content_fingerprint: string | null;
  raw_message_id: string | null;
  llm_parsed: boolean;
  created_at: string;
  updated_at: string;
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
  archetype_tags: ArchetypeId[];
  created_at: string;
  updated_at: string;
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
  created_at: string;
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

export interface SavedEvent {
  id: string;
  profile_id: string;
  event_id: string;
  created_at: string;
}
