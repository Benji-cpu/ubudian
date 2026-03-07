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
  raw_data?: unknown;
}

/**
 * Result of processing a single raw message through the pipeline.
 */
export interface ProcessResult {
  messageId: string;
  status: "created" | "duplicate" | "not_event" | "failed";
  eventId?: string;
  error?: string;
  eventsCreatedCount?: number;
  duplicatesFoundCount?: number;
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
