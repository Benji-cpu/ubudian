/**
 * POST /api/cron/curator-ingest
 *
 * Ingestion endpoint for the daily curator agent (see .claude/agents/daily-curator.md).
 *
 * Flow:
 *   1. Claude trigger fires nightly, walks curated sources, applies the vibe
 *      filter, writes curator/inbox/YYYY-MM-DD.json, commits + pushes to main.
 *   2. GH Actions workflow `.github/workflows/curator-ingest.yml` triggers on
 *      that push, reads the inbox JSON, and POSTs it here with CRON_SECRET auth.
 *   3. This route pipes each event through the existing `createEventFromParsed()`
 *      pipeline (dedup, normalisation, geocoding, moderation), then forces
 *      `status='pending'` so the admin queue still owns final approval.
 *
 * Body shape: { date: "YYYY-MM-DD", events: ParsedEvent[], source?: string }
 *
 * `source` (optional, default "curator") lets sibling git-as-bus harvesters
 * reuse this same pre-parsed ingest path under their own event_sources row —
 * e.g. the ToDo.Today GH Actions harvester POSTs { source: "todo-today", ... }
 * so its events dedup/attribute cleanly against their own source. Any slug is
 * accepted as long as the row exists and is a safe identifier.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createEventFromParsed } from "@/lib/ingestion/pipeline";
import { logActivity } from "@/lib/ingestion/activity-log";
import type { ParsedEvent } from "@/lib/ingestion/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_SLUG = "curator";
// Slugs this route is allowed to ingest under (must each have an event_sources row).
// All GH-Actions harvesters POST under their own slug; the route does the per-event
// createEventFromParsed work (dedup, geocode, year-roll guard) and forces pending.
const ALLOWED_SLUGS = new Set([
  "curator",
  "todo-today",
  "megatix",
  "blissbase",
  "soulwise",
  "instagram-public",
]);

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { date?: string; events?: ParsedEvent[]; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sourceSlug =
    body.source && ALLOWED_SLUGS.has(body.source) ? body.source : DEFAULT_SLUG;
  const date = body.date;
  const events = body.events;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Missing or invalid 'date' (YYYY-MM-DD)" }, { status: 400 });
  }
  if (!Array.isArray(events)) {
    return NextResponse.json({ error: "Missing 'events' array" }, { status: 400 });
  }
  if (events.length === 0) {
    return NextResponse.json({ date, ingested: 0, duplicates: 0, failed: 0, skipped: "empty" });
  }

  const supabase = createAdminClient();

  // Resolve the target source row (curator by default; harvesters pass their own)
  const { data: source, error: sourceError } = await supabase
    .from("event_sources")
    .select("id, name")
    .eq("slug", sourceSlug)
    .single();
  if (sourceError || !source) {
    return NextResponse.json(
      { error: `Source '${sourceSlug}' not found in event_sources` },
      { status: 500 }
    );
  }
  const sourceId = source.id as string;

  // Open an ingestion_run for the batch (audit trail mirroring runIngestion())
  const { data: run, error: runError } = await supabase
    .from("ingestion_runs")
    .insert({ source_id: sourceId, status: "running" })
    .select("id")
    .single();
  if (runError || !run) {
    return NextResponse.json(
      { error: `Failed to create ingestion run: ${runError?.message ?? "unknown"}` },
      { status: 500 }
    );
  }
  const runId = run.id as string;

  let ingested = 0;
  let duplicates = 0;
  let failed = 0;
  const errors: Array<{ title?: string; error: string }> = [];
  const eventIds: string[] = [];

  for (const parsed of events) {
    if (!parsed?.title || !parsed?.start_date) {
      failed++;
      errors.push({ title: parsed?.title, error: "missing title or start_date" });
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
        content_text:
          `${parsed.title}\n\n${parsed.description || ""}`.slice(0, 4000),
        raw_data: parsed as unknown as Record<string, unknown>,
        status: "pending",
      })
      .select("id")
      .single();

    if (msgError || !msg) {
      failed++;
      errors.push({ title: parsed.title, error: `raw message insert: ${msgError?.message ?? "unknown"}` });
      continue;
    }

    const messageId = msg.id as string;

    try {
      // Curator-flavoured config: pre-parsed, skip classification, name for logs.
      const result = await createEventFromParsed(messageId, parsed, sourceId, false, {
        _preParsed: true,
        _skipClassification: true,
        _sourceName: source.name,
      });

      if (result.status === "created" && result.eventId) {
        // Force status='pending' regardless of moderation outcome — the curator
        // surfaces, admin confirms. We don't auto-publish until taste is calibrated.
        await supabase
          .from("events")
          .update({ status: "pending", ai_approved_at: null })
          .eq("id", result.eventId);
        ingested++;
        eventIds.push(result.eventId);
      } else if (result.status === "duplicate") {
        duplicates++;
      } else {
        failed++;
        errors.push({ title: parsed.title, error: result.error || `status=${result.status}` });
      }
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : "unknown error";
      errors.push({ title: parsed.title, error: message });
    }
  }

  // Close the run
  await supabase
    .from("ingestion_runs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
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
      last_fetched_at: new Date().toISOString(),
      last_success_at: new Date().toISOString(),
      last_error: failed > 0 && ingested === 0 ? `all ${failed} events failed` : null,
      events_ingested_count: ingested,
      updated_at: new Date().toISOString(),
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

  return NextResponse.json({
    date,
    runId,
    ingested,
    duplicates,
    failed,
    errors: errors.slice(0, 20),
    eventIds: eventIds.slice(0, 50),
  });
}
