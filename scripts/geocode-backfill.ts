/**
 * Backfill script: geocode venues for approved events that are missing
 * latitude/longitude. Groups events by venue_name to minimize Nominatim
 * calls (each canonical name is looked up once, cached, and then applied
 * to every matching event).
 *
 * Usage:
 *   npx tsx scripts/geocode-backfill.ts
 *   npx tsx scripts/geocode-backfill.ts --limit 50
 *   npx tsx scripts/geocode-backfill.ts --dry-run
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "@/lib/supabase/admin";
import { geocodeVenue } from "@/lib/geocoding";

interface CliArgs {
  limit?: number;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = { dryRun: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--limit" && argv[i + 1]) {
      args.limit = parseInt(argv[++i], 10);
    }
  }
  return args;
}

interface EventRow {
  id: string;
  venue_name: string | null;
  venue_address: string | null;
}

async function main() {
  const { limit, dryRun } = parseArgs();
  const supabase = createAdminClient();

  console.log("[geocode-backfill] Fetching approved events missing coordinates...");

  let query = supabase
    .from("events")
    .select("id, venue_name, venue_address")
    .eq("status", "approved")
    .is("latitude", null)
    .not("venue_name", "is", null);

  if (limit) query = query.limit(limit);

  const { data: rows, error } = await query;
  if (error) {
    console.error("[geocode-backfill] Query failed:", error);
    process.exit(1);
  }

  const events = (rows ?? []) as EventRow[];
  console.log(`[geocode-backfill] ${events.length} events need geocoding.`);
  if (events.length === 0) return;

  // Group by venue_name (trimmed) so we geocode each venue once
  const byVenue = new Map<string, { address: string | null; eventIds: string[] }>();
  for (const e of events) {
    const name = (e.venue_name || "").trim();
    if (!name) continue;
    const existing = byVenue.get(name);
    if (existing) {
      existing.eventIds.push(e.id);
      if (!existing.address && e.venue_address) existing.address = e.venue_address;
    } else {
      byVenue.set(name, {
        address: e.venue_address || null,
        eventIds: [e.id],
      });
    }
  }

  console.log(`[geocode-backfill] ${byVenue.size} unique venues to resolve.`);

  let successes = 0;
  let failures = 0;
  let index = 0;
  for (const [venue, info] of byVenue) {
    index++;
    const prefix = `[${index}/${byVenue.size}] ${venue}`;
    try {
      const result = await geocodeVenue(venue, info.address);
      if (!result) {
        console.log(`${prefix} — no match, skipping (${info.eventIds.length} events)`);
        failures++;
        continue;
      }

      console.log(
        `${prefix} -> ${result.latitude.toFixed(5)}, ${result.longitude.toFixed(5)} (${info.eventIds.length} events)`
      );

      if (dryRun) {
        successes++;
        continue;
      }

      const { error: updateError } = await supabase
        .from("events")
        .update({
          latitude: result.latitude,
          longitude: result.longitude,
        })
        .in("id", info.eventIds);

      if (updateError) {
        console.error(`${prefix} — update failed:`, updateError.message);
        failures++;
      } else {
        successes++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${prefix} — threw:`, message);
      failures++;
    }
  }

  console.log(
    `[geocode-backfill] Done. Venues resolved: ${successes}, skipped/failed: ${failures}${
      dryRun ? " (dry-run — no writes)" : ""
    }`
  );
}

main().catch((err) => {
  console.error("[geocode-backfill] Fatal error:", err);
  process.exit(1);
});
