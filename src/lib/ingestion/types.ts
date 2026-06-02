/**
 * Internal types for the ingestion pipeline.
 * These are used within the pipeline and adapters, not stored directly in the DB.
 */

/**
 * Structured event data as parsed by the LLM or extracted from an API.
 * This is the intermediate format before it becomes a database event row.
 */
export interface ParsedEvent {
  title: string;
  description: string;
  short_description?: string | null;
  category: string;
  venue_name?: string | null;
  venue_address?: string | null;
  venue_map_url?: string | null;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null;
  start_time?: string | null; // HH:MM
  end_time?: string | null;
  is_recurring?: boolean;
  recurrence_rule?: string | null;
  price_info?: string | null;
  external_ticket_url?: string | null;
  organizer_name?: string | null;
  organizer_contact?: string | null;
  organizer_instagram?: string | null;
  cover_image_url?: string | null;
  // Quality assessment (set by LLM)
  quality_score?: number;
  content_flags?: string[];
  // Guide intent tagging (set by LLM)
  intent_tags?: string[];
  // Archetype + vibe tagging (set by LLM). archetype_tags bridges events to quiz
  // results (1–3 of the 5 archetype IDs); vibe_tags is the finer behind-the-
  // scenes facet layer (0–4 from the controlled VIBE_TAGS vocabulary) used for
  // similarity. The embedding itself is computed async (nightly sweep), not here.
  archetype_tags?: string[];
  vibe_tags?: string[];
  // Feed tier. `discovery` routes the event into the "More happenings in Ubud"
  // section (festivals, gallery openings, markets, food, performance) instead of
  // the core conscious-community agenda. Defaults to `core` when unset. Note:
  // `is_spotlight` (the festival banner) is intentionally NOT settable here —
  // the banner stays an editorial/admin decision.
  event_tier?: "core" | "discovery";
  // Source tracking (set by adapter)
  source_url?: string | null;
  source_event_id?: string | null;
}

/**
 * A raw message fetched from a source, ready for ingestion.
 */
export interface RawMessage {
  external_id?: string;
  content_text?: string;
  content_html?: string;
  image_urls?: string[];
  sender_name?: string;
  sender_id?: string;
  chat_name?: string;
  raw_data?: unknown;
}

/**
 * Result of processing a single raw message through the pipeline.
 */
export interface ProcessResult {
  messageId: string;
  status: "created" | "duplicate" | "not_event" | "failed" | "rejected";
  eventId?: string;
  error?: string;
  eventsCreatedCount?: number;
  duplicatesFoundCount?: number;
  eventsAutoApproved?: number;
}

/**
 * Summary of an ingestion run.
 */
export interface IngestionRunResult {
  runId: string;
  sourceId: string;
  status: "completed" | "failed";
  messagesFetched: number;
  messagesParsed: number;
  eventsCreated: number;
  eventsAutoApproved: number;
  duplicatesFound: number;
  errorsCount: number;
  errors: Array<{ messageId?: string; error: string }>;
}

/**
 * Interface that all source adapters must implement.
 */
export interface SourceAdapter {
  /** Unique identifier matching the event_sources.slug */
  sourceSlug: string;

  /**
   * Fetch raw messages from the source.
   * Called by the pipeline during an ingestion run.
   * @param config - Source-specific configuration from event_sources.config
   * @param since - Optional timestamp to only fetch messages after this time
   */
  fetchMessages(
    config: Record<string, unknown>,
    since?: Date
  ): Promise<RawMessage[]>;
}
