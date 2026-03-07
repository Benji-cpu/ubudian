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
import { runIngestion } from "@/lib/ingestion";

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
    if (source.source_type === "telegram" || source.source_type === "whatsapp") {
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

  // Run ingestion for each due source sequentially to avoid overwhelming APIs
  for (const source of dueSources) {
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

  return NextResponse.json({
    sourcesChecked: sources.length,
    sourcesRun: dueSources.length,
    results,
  });
}
