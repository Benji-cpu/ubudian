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
import { ingestPreParsed } from "@/lib/ingestion/preparsed-ingest";
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
  "pyramids-of-chi",
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

  try {
    const result = await ingestPreParsed(sourceSlug, date, events);
    return NextResponse.json({
      date,
      runId: result.runId,
      ingested: result.ingested,
      duplicates: result.duplicates,
      failed: result.failed,
      errors: result.errors.slice(0, 20),
      eventIds: result.eventIds.slice(0, 50),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ingest failed" },
      { status: 500 }
    );
  }
}
