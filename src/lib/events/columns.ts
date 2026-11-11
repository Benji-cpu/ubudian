/**
 * Every column of `events` except `embedding`.
 *
 * `select("*")` also returns the pgvector `embedding`, about 13KB of text per
 * row. Public pages read hundreds of rows per view, and that pushed the
 * Supabase free plan over its monthly egress allowance on 11 Nov 2026: the
 * project was restricted and the site showed no events or deals.
 *
 * Use this wherever a page or job reads event rows and does not need the
 * vector. Similarity runs in the `match_events_by_embedding` RPC; only the
 * event detail page reads one row's vector to pass to it.
 *
 * `columns.test.ts` checks this list against `supabase/schema.sql`, so a new
 * column added there fails the test until it is listed here.
 */
export const EVENT_COLUMNS = [
  "id",
  "title",
  "slug",
  "description",
  "short_description",
  "cover_image_url",
  "category",
  "venue_name",
  "venue_address",
  "venue_map_url",
  "start_date",
  "end_date",
  "start_time",
  "end_time",
  "is_recurring",
  "recurrence_rule",
  "price_info",
  "external_ticket_url",
  "organizer_name",
  "organizer_contact",
  "organizer_instagram",
  "status",
  "submitted_by_email",
  "is_trusted_submitter",
  "rejection_reason",
  "is_placeholder",
  "archetype_tags",
  "created_at",
  "updated_at",
  "source_id",
  "source_event_id",
  "source_url",
  "content_fingerprint",
  "raw_message_id",
  "llm_parsed",
  "quality_score",
  "content_flags",
  "latitude",
  "longitude",
  "ai_approved_at",
  "moderation_reason",
  "is_core",
  "last_refreshed_at",
  "source_kind",
  "raw_text_snippet",
  "parser_version",
  "ingested_at",
  "intent_tags",
  "is_members_only",
  "members_only_teaser",
  "event_tier",
  "is_spotlight",
  "vibe_tags",
  "last_edited_by_submitter_at",
  "auto_approved_at",
  // Typed as "*" so each call site keeps the row type it had with select("*").
  // The client has no generated table types; a plain string would type every
  // row as a parse error.
].join(", ") as "*";
