/**
 * Core ingestion pipeline orchestrator.
 *
 * Flow: create run → fetch raw messages → classify → parse → dedup → insert events → close run
 *
 * Each source adapter calls `runIngestion()` which handles the full lifecycle.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { queryWithRetry } from "@/lib/supabase/retry";
import { slugify } from "@/lib/utils";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { classifyAndParseMessage, parseEventFromText, parseEventFromImage, LLMApiError } from "./llm-parser";
import { findDuplicates, recordDedupMatch } from "./dedup";
import { normalizeVenue } from "./venue-normalizer";
import { generateFingerprint } from "./fingerprint";
import { getAdapter } from "./source-adapter";
import { validateAndNormalizeDate } from "./date-validator";
import { logHealthEvent } from "./health-utils";
import { logActivity } from "./activity-log";
import type { IngestionRunResult, ParsedEvent, ProcessResult, RawMessage } from "./types";

/**
 * Run the full ingestion pipeline for a given source.
 */
export async function runIngestion(sourceId: string): Promise<IngestionRunResult> {
  const supabase = createAdminClient();
  const errors: Array<{ messageId?: string; error: string }> = [];

  // Load source config
  const { data: source, error: sourceError } = await queryWithRetry(
    () =>
      supabase
        .from("event_sources")
        .select("*")
        .eq("id", sourceId)
        .single(),
    "pipeline-load-source"
  );

  if (sourceError || !source) {
    return {
      runId: "",
      sourceId,
      status: "failed",
      messagesFetched: 0,
      messagesParsed: 0,
      eventsCreated: 0,
      eventsAutoApproved: 0,
      duplicatesFound: 0,
      errorsCount: 1,
      errors: [{ error: `Source not found: ${sourceError?.message || "unknown"}` }],
    };
  }

  // Get the adapter for this source
  const adapter = getAdapter(source.slug);
  if (!adapter) {
    return {
      runId: "",
      sourceId,
      status: "failed",
      messagesFetched: 0,
      messagesParsed: 0,
      eventsCreated: 0,
      eventsAutoApproved: 0,
      duplicatesFound: 0,
      errorsCount: 1,
      errors: [{ error: `No adapter registered for source: ${source.slug}` }],
    };
  }

  // Create ingestion run
  const { data: run, error: runError } = await supabase
    .from("ingestion_runs")
    .insert({
      source_id: sourceId,
      status: "running",
    })
    .select("id")
    .single();

  if (runError || !run) {
    return {
      runId: "",
      sourceId,
      status: "failed",
      messagesFetched: 0,
      messagesParsed: 0,
      eventsCreated: 0,
      eventsAutoApproved: 0,
      duplicatesFound: 0,
      errorsCount: 1,
      errors: [{ error: `Failed to create run: ${runError?.message}` }],
    };
  }

  const runId = run.id;
  let messagesFetched = 0;
  let messagesParsed = 0;
  let eventsCreated = 0;
  let eventsAutoApproved = 0;
  let duplicatesFound = 0;

  // Merge auto-approve settings into source config for downstream use
  const effectiveConfig: Record<string, unknown> = {
    ...(source.config || {}),
    _autoApproveEnabled: source.auto_approve_enabled ?? false,
    _autoApproveThreshold: source.auto_approve_threshold ?? 0.85,
    _sourceName: source.name,
  };

  try {
    const startTime = Date.now();

    // Fetch raw messages from adapter
    const since = source.last_fetched_at ? new Date(source.last_fetched_at) : undefined;
    const rawMessages = await adapter.fetchMessages(source.config || {}, since);
    messagesFetched = rawMessages.length;

    // Store raw messages and process each
    for (const rawMsg of rawMessages) {
      try {
        // Check for duplicate external_id from same source
        if (rawMsg.external_id) {
          const { data: existingMsg } = await supabase
            .from("raw_ingestion_messages")
            .select("id")
            .eq("source_id", sourceId)
            .eq("external_id", rawMsg.external_id)
            .limit(1);

          if (existingMsg?.length) {
            duplicatesFound++;
            continue;
          }
        }

        // Store raw message
        const { data: storedMsg, error: storeError } = await supabase
          .from("raw_ingestion_messages")
          .insert({
            source_id: sourceId,
            run_id: runId,
            external_id: rawMsg.external_id || null,
            content_text: rawMsg.content_text || null,
            content_html: rawMsg.content_html || null,
            image_urls: rawMsg.image_urls || null,
            sender_name: rawMsg.sender_name || null,
            sender_id: rawMsg.sender_id || null,
            chat_name: rawMsg.chat_name || null,
            raw_data: rawMsg.raw_data || null,
            status: "pending",
          })
          .select("id")
          .single();

        if (storeError || !storedMsg) {
          errors.push({ error: `Failed to store message: ${storeError?.message}` });
          continue;
        }

        // Process the message through the pipeline
        const result = await processRawMessage(
          storedMsg.id,
          rawMsg,
          sourceId,
          effectiveConfig
        );

        if (result.status === "created") {
          eventsCreated++;
          eventsAutoApproved += result.eventsAutoApproved ?? 0;
          messagesParsed++;
        } else if (result.status === "duplicate") {
          duplicatesFound++;
          messagesParsed++;
        } else if (result.status === "not_event") {
          messagesParsed++;
        } else if (result.status === "failed") {
          errors.push({ messageId: storedMsg.id, error: result.error || "Unknown error" });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error processing message";
        errors.push({ error: errorMsg });
      }
    }

    // Close the run as completed
    await supabase
      .from("ingestion_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        messages_fetched: messagesFetched,
        messages_parsed: messagesParsed,
        events_created: eventsCreated,
        duplicates_found: duplicatesFound,
        errors_count: errors.length,
        error_log: errors,
      })
      .eq("id", runId);

    // Log recovery if source previously had an error
    if (source.last_error) {
      await logActivity({
        category: "source_recovered",
        title: `${source.name} recovered`,
        details: {
          source_name: source.name,
          previous_error: source.last_error,
        },
        sourceId,
      });
    }

    // Update source timestamps
    await supabase
      .from("event_sources")
      .update({
        last_fetched_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        last_error: null,
        events_ingested_count: (source.events_ingested_count || 0) + eventsCreated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId);

    await logActivity({
      category: "run_summary",
      title: `${source.name}: ${eventsCreated} events from ${messagesFetched} messages`,
      details: {
        source_name: source.name,
        run_id: runId,
        messages_fetched: messagesFetched,
        messages_parsed: messagesParsed,
        events_created: eventsCreated,
        duplicates: duplicatesFound,
        errors_count: errors.length,
        duration_s: Math.round((Date.now() - startTime) / 1000),
      },
      sourceId,
    });

    return {
      runId,
      sourceId,
      status: "completed",
      messagesFetched,
      messagesParsed,
      eventsCreated,
      eventsAutoApproved,
      duplicatesFound,
      errorsCount: errors.length,
      errors,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Pipeline failed";

    // Close the run as failed
    await supabase
      .from("ingestion_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        messages_fetched: messagesFetched,
        messages_parsed: messagesParsed,
        events_created: eventsCreated,
        duplicates_found: duplicatesFound,
        errors_count: errors.length + 1,
        error_log: [...errors, { error: errorMsg }],
      })
      .eq("id", runId);

    // Update source with error
    await supabase
      .from("event_sources")
      .update({
        last_fetched_at: new Date().toISOString(),
        last_error: errorMsg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId);

    // Fire-and-forget in error path — don't compound latency during failures
    logActivity({
      category: "source_error",
      severity: "error",
      title: `${source.name} failed: ${errorMsg}`,
      details: {
        source_name: source.name,
        error_message: errorMsg,
        run_id: runId,
      },
      sourceId,
    });

    return {
      runId,
      sourceId,
      status: "failed",
      messagesFetched,
      messagesParsed,
      eventsCreated,
      eventsAutoApproved,
      duplicatesFound,
      errorsCount: errors.length + 1,
      errors: [...errors, { error: errorMsg }],
    };
  }
}

/**
 * Process a single raw message through classification → parsing → dedup → event creation.
 */
export async function processRawMessage(
  messageId: string,
  rawMsg: RawMessage,
  sourceId: string,
  sourceConfig: Record<string, unknown>
): Promise<ProcessResult> {
  const supabase = createAdminClient();
  const contentText = rawMsg.content_text || "";
  const hasImages = rawMsg.image_urls && rawMsg.image_urls.length > 0;

  // If adapter already provides pre-parsed data (API sources), skip LLM
  if (sourceConfig._preParsed && rawMsg.raw_data) {
    const parsedEvents = rawMsg.raw_data as ParsedEvent[];
    if (parsedEvents.length > 0) {
      return createEventFromParsed(messageId, parsedEvents[0], sourceId, false, sourceConfig);
    }
  }

  // Step 1+2: Classify and parse in a single LLM call (text), or parse directly (images/pre-structured)
  let parsedEvents: ParsedEvent[] = [];

  try {
    if (hasImages) {
      // Image messages: skip classify — parseEventFromImage returns [] when no event found
      for (const imageUrl of rawMsg.image_urls!) {
        parsedEvents = await parseEventFromImage(imageUrl, contentText);
        if (parsedEvents.length > 0) {
          // The analyzed image IS the event flyer — use it as cover image
          for (const evt of parsedEvents) {
            if (!evt.cover_image_url) {
              evt.cover_image_url = imageUrl;
            }
          }
          break;
        }
      }

      // Text fallback if all images yielded nothing
      if (parsedEvents.length === 0 && contentText) {
        if (sourceConfig._skipClassification) {
          parsedEvents = await parseEventFromText(contentText);
        } else {
          const result = await classifyAndParseMessage(contentText);
          if (result.is_event && result.confidence >= 0.5) {
            parsedEvents = result.events;
          }
          // If not event, parsedEvents stays [] — falls through to "no events" handling below
        }
        // Text parsed successfully from image message — use first image as cover
        if (parsedEvents.length > 0) {
          for (const evt of parsedEvents) {
            if (!evt.cover_image_url) {
              evt.cover_image_url = rawMsg.image_urls![0];
            }
          }
        }
      }
    } else if (contentText) {
      if (sourceConfig._skipClassification) {
        // Pre-structured source — parse text directly without classification
        parsedEvents = await parseEventFromText(contentText);
      } else {
        // Combined classify+parse in one call — replaces separate classify then parse
        const result = await classifyAndParseMessage(contentText);
        if (!result.is_event || result.confidence < 0.5) {
          await supabase
            .from("raw_ingestion_messages")
            .update({ status: "not_event", updated_at: new Date().toISOString() })
            .eq("id", messageId);
          return { messageId, status: "not_event" };
        }
        parsedEvents = result.events;
      }
    }

    if (parsedEvents.length === 0) {
      // Images with no events are legitimate (e.g. food photos) — not a failure
      const status = hasImages ? "not_event" : "failed";
      const parseError = status === "failed" ? "LLM returned no events" : null;

      await supabase
        .from("raw_ingestion_messages")
        .update({
          status,
          parse_error: parseError,
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      return { messageId, status, error: parseError || undefined };
    }
  } catch (err) {
    if (err instanceof LLMApiError) {
      // LLM API failure — mark as retryable "failed"
      await supabase
        .from("raw_ingestion_messages")
        .update({
          status: "failed",
          parse_error: `LLM error: ${err.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      return { messageId, status: "failed", error: err.message };
    }

    const errorMsg = err instanceof Error ? err.message : "Parse error";
    await supabase
      .from("raw_ingestion_messages")
      .update({
        status: "failed",
        parse_error: errorMsg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    return { messageId, status: "failed", error: errorMsg };
  }

  // Store parsed data on the message
  await supabase
    .from("raw_ingestion_messages")
    .update({
      parsed_event_data: parsedEvents,
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId);

  // Process all parsed events from the message
  let aggregateStatus: ProcessResult["status"] = "failed";
  let firstEventId: string | undefined;
  const allEventIds: string[] = [];
  let eventsCreatedCount = 0;
  let eventsAutoApprovedCount = 0;
  let duplicatesFoundCount = 0;
  let lastError: string | undefined;

  for (const parsed of parsedEvents) {
    const result = await createEventFromParsed(messageId, parsed, sourceId, true, sourceConfig);

    if (result.status === "created") {
      eventsCreatedCount++;
      eventsAutoApprovedCount += result.eventsAutoApproved ?? 0;
      if (result.eventId) allEventIds.push(result.eventId);
      if (!firstEventId) firstEventId = result.eventId;
      aggregateStatus = "created"; // "created" wins
    } else if (result.status === "duplicate") {
      duplicatesFoundCount++;
      if (aggregateStatus !== "created") aggregateStatus = "duplicate";
    } else if (result.status === "failed") {
      lastError = result.error;
      // Only keep "failed" if nothing better happened
    } else if (result.status === "not_event") {
      if (aggregateStatus === "failed") aggregateStatus = "not_event";
    }
  }

  // Update message status based on aggregate result
  const messageStatus = aggregateStatus === "created" ? "parsed" : aggregateStatus === "duplicate" ? "duplicate" : "failed";
  const updateData: Record<string, unknown> = {
    status: messageStatus,
    event_id: firstEventId || null,
    updated_at: new Date().toISOString(),
  };

  // Store multi-event metadata
  if (allEventIds.length > 0 || eventsCreatedCount > 0 || duplicatesFoundCount > 0) {
    updateData.parsed_event_data = {
      events: parsedEvents,
      _all_event_ids: allEventIds,
      _events_created_count: eventsCreatedCount,
      _duplicates_found_count: duplicatesFoundCount,
    };
  }

  await supabase
    .from("raw_ingestion_messages")
    .update(updateData)
    .eq("id", messageId);

  return {
    messageId,
    status: aggregateStatus,
    eventId: firstEventId,
    error: lastError,
    eventsCreatedCount,
    duplicatesFoundCount,
    eventsAutoApproved: eventsAutoApprovedCount,
  };
}

/**
 * Create an event from parsed data, running dedup first.
 */
export async function createEventFromParsed(
  messageId: string,
  parsed: ParsedEvent,
  sourceId: string,
  llmParsed: boolean,
  sourceConfig: Record<string, unknown> = {}
): Promise<ProcessResult> {
  const supabase = createAdminClient();

  // Validate required fields
  if (!parsed.title || !parsed.start_date) {
    return { messageId, status: "failed", error: "Missing required fields: title or start_date" };
  }

  // Validate and normalize dates
  const startDateResult = validateAndNormalizeDate(parsed.start_date, "start_date");
  if (!startDateResult.valid || !startDateResult.normalized) {
    return { messageId, status: "failed", error: startDateResult.error || "Invalid start_date" };
  }
  parsed.start_date = startDateResult.normalized;

  if (parsed.end_date) {
    const endDateResult = validateAndNormalizeDate(parsed.end_date, "end_date");
    if (!endDateResult.valid) {
      // End date is optional — clear it if invalid rather than failing
      parsed.end_date = null;
    } else {
      parsed.end_date = endDateResult.normalized;
    }
  }

  // Validate category
  const validCategory = EVENT_CATEGORIES.find(
    (c) => c.toLowerCase() === (parsed.category || "").toLowerCase()
  );
  const category = validCategory || "Other";

  // Normalize venue
  const normalizedVenue = await normalizeVenue(parsed.venue_name);

  // Generate fingerprint
  const fingerprint = await generateFingerprint({
    title: parsed.title,
    start_date: parsed.start_date,
    venue_name: normalizedVenue,
  });

  // Run dedup (pass precomputed venue/fingerprint to avoid redundant calls)
  const duplicates = await findDuplicates({
    title: parsed.title,
    start_date: parsed.start_date,
    venue_name: normalizedVenue,
    source_url: parsed.source_url,
    source_id: sourceId,
    source_event_id: parsed.source_event_id,
    description: parsed.description,
  }, { normalizedVenue, fingerprint });

  // If high-confidence duplicate, skip creation but store audit trail
  if (duplicates.length > 0 && duplicates[0].confidence >= 0.9) {
    const topMatch = duplicates[0];
    await supabase
      .from("raw_ingestion_messages")
      .update({
        parsed_event_data: {
          ...((typeof parsed === "object" ? parsed : {}) as Record<string, unknown>),
          _dedup_skipped: true,
          _dedup_matched_event_id: topMatch.eventId,
          _dedup_match_type: topMatch.matchType,
          _dedup_confidence: topMatch.confidence,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    return { messageId, status: "duplicate" };
  }

  // Generate unique slug
  let slug = slugify(parsed.title);
  const { data: existing } = await queryWithRetry(
    () =>
      supabase
        .from("events")
        .select("slug")
        .eq("slug", slug)
        .single(),
    "pipeline-slug-check"
  );

  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Determine auto-approve eligibility
  const qualityScore = parsed.quality_score ?? 0;
  const contentFlags = parsed.content_flags ?? [];
  let eventStatus: "pending" | "approved" = "pending";

  if (
    sourceConfig._autoApproveEnabled &&
    qualityScore >= ((sourceConfig._autoApproveThreshold as number) ?? 0.85) &&
    contentFlags.length === 0
  ) {
    eventStatus = "approved";
  }

  // Insert the event
  const { data: newEvent, error: insertError } = await queryWithRetry(
    () =>
      supabase
        .from("events")
        .insert({
          title: parsed.title,
          slug,
          description: parsed.description || parsed.title,
          short_description: parsed.short_description || null,
          category,
          venue_name: normalizedVenue || parsed.venue_name || null,
          venue_address: parsed.venue_address || null,
          venue_map_url: parsed.venue_map_url || null,
          start_date: parsed.start_date,
          end_date: parsed.end_date || null,
          start_time: parsed.start_time || null,
          end_time: parsed.end_time || null,
          is_recurring: parsed.is_recurring || false,
          recurrence_rule: parsed.recurrence_rule || null,
          price_info: parsed.price_info || null,
          external_ticket_url: parsed.external_ticket_url || null,
          organizer_name: parsed.organizer_name || null,
          organizer_contact: parsed.organizer_contact || null,
          organizer_instagram: parsed.organizer_instagram || null,
          cover_image_url: parsed.cover_image_url || null,
          status: eventStatus,
          source_id: sourceId,
          source_event_id: parsed.source_event_id || null,
          source_url: parsed.source_url || null,
          content_fingerprint: fingerprint,
          raw_message_id: messageId,
          llm_parsed: llmParsed,
          quality_score: qualityScore || null,
          content_flags: contentFlags,
        })
        .select("id")
        .single(),
    "pipeline-insert-event"
  );

  if (insertError || !newEvent) {
    return {
      messageId,
      status: "failed",
      error: `Failed to insert event: ${insertError?.message}`,
    };
  }

  await logActivity({
    category: "event_created",
    title: `Event created: ${parsed.title}`,
    details: {
      event_id: newEvent.id,
      event_title: parsed.title,
      category,
      venue: normalizedVenue || parsed.venue_name || null,
      source_name: (sourceConfig._sourceName as string) || null,
      auto_approved: eventStatus === "approved",
    },
    sourceId,
  });

  // Record any lower-confidence dedup matches for admin review
  for (const dup of duplicates) {
    if (dup.confidence >= 0.5) {
      await recordDedupMatch(newEvent.id, dup);
    }
  }

  return {
    messageId,
    status: "created",
    eventId: newEvent.id,
    eventsAutoApproved: eventStatus === "approved" ? 1 : 0,
  };
}
