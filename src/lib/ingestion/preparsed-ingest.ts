/**
 * Ingest a batch of already-parsed events under one `event_sources` row.
 *
 * Shared by `/api/cron/curator-ingest` (the GH Actions harvesters) and
 * `/api/cron/events-bus/ingest` (the events-desk routine). Each event goes
 * through `createEventFromParsed()` (dedup, normalisation, geocoding) and is
 * forced to `pending`: ingest never publishes. The editorial gate
 * (`src/lib/maintenance/auto-approve.ts`) is the only thing that moves an event
 * to `approved`.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { createEventFromParsed } from "@/lib/ingestion/pipeline";
import { logActivity } from "@/lib/ingestion/activity-log";
import type { ParsedEvent } from "@/lib/ingestion/types";

export type PreParsedItemResult =
  | { status: "created"; eventId: string }
  | { status: "duplicate" }
  | { status: "failed"; error: string };

export interface PreParsedIngestResult {
  runId: string;
  ingested: number;
  duplicates: number;
  failed: number;
  errors: Array<{ title?: string; error: string }>;
  eventIds: string[];
  /** One entry per input event, in input order. */
  items: PreParsedItemResult[];
}

export class SourceNotFoundError extends Error {}

export async function ingestPreParsed(
  sourceSlug: string,
  date: string,
  events: ParsedEvent[],
): Promise<PreParsedIngestResult> {
  const supabase = createAdminClient();

  const { data: source, error: sourceError } = await supabase
    .from("event_sources")
    .select("id, name")
    .eq("slug", sourceSlug)
    .single();
  if (sourceError || !source) {
    throw new SourceNotFoundError(`Source '${sourceSlug}' not found in event_sources`);
  }
  const sourceId = source.id as string;

  // Open an ingestion_run for the batch (audit trail mirroring runIngestion())
  const { data: run, error: runError } = await supabase
    .from("ingestion_runs")
    .insert({ source_id: sourceId, status: "running" })
    .select("id")
    .single();
  if (runError || !run) {
    throw new Error(`Failed to create ingestion run: ${runError?.message ?? "unknown"}`);
  }
  const runId = run.id as string;

  let ingested = 0;
  let duplicates = 0;
  let failed = 0;
  const errors: Array<{ title?: string; error: string }> = [];
  const eventIds: string[] = [];
  const items: PreParsedItemResult[] = [];

  const fail = (title: string | undefined, error: string) => {
    failed++;
    errors.push({ title, error });
    items.push({ status: "failed", error });
  };

  for (const parsed of events) {
    if (!parsed?.title || !parsed?.start_date) {
      fail(parsed?.title, "missing title or start_date");
      continue;
    }

    // Insert raw_ingestion_messages row so createEventFromParsed has a real id
    // to update (it sets parsed_event_data, status, etc. on this row).
    const { data: msg, error: msgError } = await supabase
      .from("raw_ingestion_messages")
      .insert({
        source_id: sourceId,
        run_id: runId,
        external_id: parsed.source_event_id || parsed.source_url || null,
        content_text: `${parsed.title}\n\n${parsed.description || ""}`.slice(0, 4000),
        raw_data: parsed as unknown as Record<string, unknown>,
        status: "pending",
      })
      .select("id")
      .single();

    if (msgError || !msg) {
      fail(parsed.title, `raw message insert: ${msgError?.message ?? "unknown"}`);
      continue;
    }

    try {
      const result = await createEventFromParsed(msg.id as string, parsed, sourceId, false, {
        _preParsed: true,
        _skipClassification: true,
        _sourceName: source.name,
      });

      if (result.status === "created" && result.eventId) {
        await supabase
          .from("events")
          .update({ status: "pending", ai_approved_at: null })
          .eq("id", result.eventId);
        ingested++;
        eventIds.push(result.eventId);
        items.push({ status: "created", eventId: result.eventId });
      } else if (result.status === "duplicate") {
        duplicates++;
        items.push({ status: "duplicate" });
      } else {
        fail(parsed.title, result.error || `status=${result.status}`);
      }
    } catch (err) {
      fail(parsed.title, err instanceof Error ? err.message : "unknown error");
    }
  }

  const now = new Date().toISOString();
  await supabase
    .from("ingestion_runs")
    .update({
      status: "completed",
      completed_at: now,
      messages_fetched: events.length,
      messages_parsed: ingested + duplicates,
      events_created: ingested,
      duplicates_found: duplicates,
      errors_count: failed,
      error_log: errors,
    })
    .eq("id", runId);

  await supabase
    .from("event_sources")
    .update({
      last_fetched_at: now,
      last_success_at: now,
      last_error: failed > 0 && ingested === 0 ? `all ${failed} events failed` : null,
      events_ingested_count: ingested,
      updated_at: now,
    })
    .eq("id", sourceId);

  await logActivity({
    category: "run_summary",
    title: `${source.name}: ${ingested} events from ${events.length} candidates (${date})`,
    details: {
      source_name: source.name,
      run_id: runId,
      date,
      events_total: events.length,
      events_created: ingested,
      duplicates,
      failed,
      event_ids: eventIds,
    },
    sourceId,
  });

  return { runId, ingested, duplicates, failed, errors, eventIds, items };
}
