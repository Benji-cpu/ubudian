/**
 * GET /api/cron/ingest-events
 *
 * Vercel Cron Job endpoint. Runs every 4 hours.
 * Checks which sources are due based on their fetch_interval_minutes
 * and triggers ingestion runs for each.
 *
 * Protected by CRON_SECRET header.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runIngestion, processRawMessage } from "@/lib/ingestion";
import type { RawMessage } from "@/lib/ingestion";
import "@/lib/ingestion/adapters";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all enabled sources
  const { data: sources, error } = await supabase
    .from("event_sources")
    .select("id, name, slug, fetch_interval_minutes, last_fetched_at, source_type")
    .eq("is_enabled", true);

  if (error || !sources) {
    console.error("[cron/ingest-events] Failed to load sources:", error);
    return NextResponse.json({ error: "Failed to load sources" }, { status: 500 });
  }

  // Filter to sources that are due for fetching
  const now = Date.now();
  const dueSources = sources.filter((source) => {
    // Telegram is push-based, skip for cron
    if (source.source_type === "telegram") {
      return false;
    }

    if (!source.last_fetched_at) return true; // Never fetched

    const lastFetched = new Date(source.last_fetched_at).getTime();
    const intervalMs = (source.fetch_interval_minutes || 240) * 60 * 1000;
    return now - lastFetched >= intervalMs;
  });

  console.log(
    `[cron/ingest-events] ${dueSources.length}/${sources.length} sources due for ingestion`
  );

  const results = [];
  const startTime = Date.now();
  const MAX_ELAPSED_MS = 7000; // leave 3s buffer for Vercel Hobby 10s timeout

  // Run ingestion for each due source sequentially to avoid overwhelming APIs
  for (const source of dueSources) {
    if (Date.now() - startTime > MAX_ELAPSED_MS) {
      console.warn(`[cron/ingest-events] Timeout approaching, skipping ${dueSources.length - results.length} remaining sources`);
      break;
    }

    try {
      console.log(`[cron/ingest-events] Running ingestion for: ${source.name} (${source.slug})`);
      const result = await runIngestion(source.id);
      results.push({
        source: source.name,
        status: result.status,
        eventsCreated: result.eventsCreated,
        duplicatesFound: result.duplicatesFound,
        errorsCount: result.errorsCount,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[cron/ingest-events] Failed for ${source.name}:`, errorMsg);
      results.push({
        source: source.name,
        status: "failed",
        error: errorMsg,
      });
    }
  }

  // Auto-retry stuck pending/failed messages (only those from last 24h to cap retries)
  // Skip if we're already close to the timeout
  if (Date.now() - startTime > MAX_ELAPSED_MS) {
    console.warn("[cron/ingest-events] Timeout approaching, skipping stuck message retries");
    return NextResponse.json({
      sourcesChecked: sources.length,
      sourcesRun: dueSources.length,
      results,
      stuckMessagesRetried: 0,
      timedOut: true,
    });
  }

  const TEN_MINUTES_AGO = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const TWENTY_FOUR_HOURS_AGO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: stuckMessages } = await supabase
    .from("raw_ingestion_messages")
    .select("*")
    .or(`status.eq.failed,and(status.eq.pending,updated_at.lt.${TEN_MINUTES_AGO})`)
    .gte("updated_at", TWENTY_FOUR_HOURS_AGO)
    .order("created_at", { ascending: true })
    .limit(10);

  let retriedCount = 0;
  for (const message of stuckMessages ?? []) {
    if (Date.now() - startTime > MAX_ELAPSED_MS) {
      console.warn("[cron/ingest-events] Timeout approaching, stopping stuck message retries");
      break;
    }

    // Get source config
    const { data: source } = await supabase
      .from("event_sources")
      .select("config")
      .eq("id", message.source_id)
      .single();

    // Preserve previous error context for debugging
    const previousErrors = message.parse_error
      ? [...((message.parsed_event_data as Record<string, unknown>)?._previous_errors as string[] || []), message.parse_error]
      : (message.parsed_event_data as Record<string, unknown>)?._previous_errors as string[] || [];

    // Reset to pending before reprocessing, preserving error history
    await supabase
      .from("raw_ingestion_messages")
      .update({
        status: "pending",
        parse_error: null,
        parsed_event_data: previousErrors.length > 0
          ? { _previous_errors: previousErrors, _retry_count: previousErrors.length }
          : null,
        event_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", message.id);

    const rawMsg: RawMessage = {
      external_id: message.external_id,
      content_text: message.content_text,
      content_html: message.content_html,
      image_urls: message.image_urls,
      sender_name: message.sender_name,
      sender_id: message.sender_id,
      raw_data: message.raw_data,
    };

    try {
      await processRawMessage(message.id, rawMsg, message.source_id, source?.config || {});
      retriedCount++;
    } catch {
      // Already marked failed by pipeline — no action needed
    }
  }

  if ((stuckMessages?.length ?? 0) > 0) {
    console.log(`[cron/ingest-events] Retried ${retriedCount}/${stuckMessages!.length} stuck messages`);
  }

  return NextResponse.json({
    sourcesChecked: sources.length,
    sourcesRun: dueSources.length,
    results,
    stuckMessagesRetried: retriedCount,
  });
}
