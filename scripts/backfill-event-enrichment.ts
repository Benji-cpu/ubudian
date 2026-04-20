/**
 * Backfill script: re-fetch source URLs for existing events that are
 * missing image / price / description / venue / organizer / ticket URL,
 * and fill in the gaps from Open Graph + JSON-LD on the source page.
 *
 * Usage:
 *   npx tsx scripts/backfill-event-enrichment.ts                # all eligible
 *   npx tsx scripts/backfill-event-enrichment.ts --limit 20     # cap rows
 *   npx tsx scripts/backfill-event-enrichment.ts --dry-run      # don't write
 *   npx tsx scripts/backfill-event-enrichment.ts --id <eventId> # one event
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { enrichFromSourceUrl } from "@/lib/ingestion/url-enricher";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface CliArgs {
  limit?: number;
  dryRun: boolean;
  id?: string;
}

function parseArgs(): CliArgs {
  const args: CliArgs = { dryRun: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--limit" && argv[i + 1]) {
      args.limit = parseInt(argv[++i], 10);
    } else if (argv[i] === "--id" && argv[i + 1]) {
      args.id = argv[++i];
    }
  }
  return args;
}

async function loadEligibleEvents(args: CliArgs) {
  let query = supabase
    .from("events")
    .select(
      "id, title, source_url, cover_image_url, short_description, price_info, external_ticket_url, organizer_name, venue_name, venue_address"
    )
    .in("status", ["pending", "approved"])
    .not("source_url", "is", null);

  if (args.id) {
    query = supabase
      .from("events")
      .select(
        "id, title, source_url, cover_image_url, short_description, price_info, external_ticket_url, organizer_name, venue_name, venue_address"
      )
      .eq("id", args.id);
  } else if (args.limit) {
    query = query.limit(args.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load events: ${error.message}`);
  return data ?? [];
}

async function backfillOne(event: Record<string, unknown>, dryRun: boolean) {
  const url = event.source_url as string | null;
  if (!url) return { status: "skipped", reason: "no source_url" };

  const enrichment = await enrichFromSourceUrl(url, event);
  if (enrichment.enrichedFields.length === 0) {
    return { status: "no_changes" };
  }

  if (dryRun) {
    return { status: "would_update", fields: enrichment.enrichedFields };
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of enrichment.enrichedFields) {
    update[k] = (enrichment as unknown as Record<string, unknown>)[k];
  }

  const { error } = await supabase.from("events").update(update).eq("id", event.id);
  if (error) {
    return { status: "error", error: error.message };
  }
  return { status: "updated", fields: enrichment.enrichedFields };
}

async function main() {
  const args = parseArgs();
  console.log("[backfill] args:", args);

  const events = await loadEligibleEvents(args);
  console.log(`[backfill] loaded ${events.length} candidate events`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const evt of events) {
    const id = evt.id as string;
    const title = evt.title as string;
    try {
      const result = await backfillOne(evt, args.dryRun);
      if (result.status === "updated" || result.status === "would_update") {
        updated++;
        console.log(
          `[backfill] ${result.status} ${id} (${title}): ${(result as { fields: string[] }).fields.join(", ")}`
        );
      } else if (result.status === "no_changes") {
        skipped++;
      } else if (result.status === "error") {
        errors++;
        console.error(`[backfill] error ${id}: ${(result as { error: string }).error}`);
      }
    } catch (err) {
      errors++;
      console.error(
        `[backfill] threw on ${id}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  console.log(
    `[backfill] done. updated=${updated} skipped=${skipped} errors=${errors}`
  );
}

main().catch((err) => {
  console.error("[backfill] fatal:", err);
  process.exit(1);
});
