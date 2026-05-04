/**
 * Backfill script: find Megatix matches for upcoming approved events that
 * have no cover image, and fill in cover_image_url / external_ticket_url /
 * source_url from the Megatix listing.
 *
 * Many events came in via WhatsApp/Telegram/manual entry without an image,
 * but the same event is published on Megatix with a high-quality cover.
 * This script searches Megatix by title and patches matched events.
 *
 * Usage:
 *   npx tsx scripts/backfill-megatix-images.ts                # real run
 *   npx tsx scripts/backfill-megatix-images.ts --dry-run      # preview
 *   npx tsx scripts/backfill-megatix-images.ts --limit 10
 *   npx tsx scripts/backfill-megatix-images.ts --verbose
 *   npx tsx scripts/backfill-megatix-images.ts --id <eventId>
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import {
  fetchSearchPage,
  fetchEventDetail,
} from "@/lib/ingestion/adapters/megatix";
import {
  stringSimilarity,
  normalizeForComparison,
  tokenOverlap,
} from "@/lib/ingestion/similarity";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const MIN_SCORE = 0.75;
const FETCH_DELAY_MS = 750;

interface CliArgs {
  limit?: number;
  dryRun: boolean;
  verbose: boolean;
  id?: string;
}

function parseArgs(): CliArgs {
  const args: CliArgs = { dryRun: false, verbose: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--verbose" || argv[i] === "-v") args.verbose = true;
    else if (argv[i] === "--limit" && argv[i + 1]) {
      args.limit = parseInt(argv[++i], 10);
    } else if (argv[i] === "--id" && argv[i + 1]) {
      args.id = argv[++i];
    }
  }
  return args;
}

interface CandidateEvent {
  id: string;
  title: string;
  venue_name: string | null;
  start_date: string;
  cover_image_url: string | null;
  external_ticket_url: string | null;
  source_url: string | null;
}

async function loadCandidates(args: CliArgs): Promise<CandidateEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  const select =
    "id, title, venue_name, start_date, cover_image_url, external_ticket_url, source_url";

  if (args.id) {
    const { data, error } = await supabase
      .from("events")
      .select(select)
      .eq("id", args.id);
    if (error) throw new Error(`Failed to load event ${args.id}: ${error.message}`);
    return (data ?? []) as CandidateEvent[];
  }

  let query = supabase
    .from("events")
    .select(select)
    .eq("status", "approved")
    .is("cover_image_url", null)
    .gte("start_date", today)
    .order("start_date", { ascending: true });

  if (args.limit) query = query.limit(args.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load candidates: ${error.message}`);
  return (data ?? []) as CandidateEvent[];
}

function dateMatchScore(targetISO: string, candidateISO: string | null): number {
  if (!candidateISO) return 0;
  const a = new Date(targetISO).getTime();
  const b = new Date(candidateISO).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  const diffDays = Math.abs(a - b) / (24 * 60 * 60 * 1000);
  if (diffDays <= 1) return 1;
  if (diffDays <= 7) return 0.5;
  if (diffDays <= 30) return 0.2;
  return 0;
}

interface ScoredCandidate {
  id: number;
  slug: string;
  name: string;
  cover: string | null;
  start_datetime: string | null;
  venue_name: string | null;
  score: number;
  titleSim: number;
  dateScore: number;
}

async function searchMegatixForEvent(
  event: CandidateEvent,
  verbose: boolean
): Promise<ScoredCandidate | null> {
  // Megatix search appears to require an exact substring match. To maximize
  // recall, query with successively shorter forms — full title, then dropped
  // subtitle, then the first significant token alone — and score all hits.
  const queries: string[] = [];
  queries.push(event.title);
  const truncated = event.title.split(/[—:|·"“”]/)[0]?.trim();
  if (truncated && truncated !== event.title && truncated.length >= 4) {
    queries.push(truncated);
  }
  const significantTokens = normalizeForComparison(event.title)
    .split(" ")
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  if (significantTokens.length >= 2) {
    const twoTokens = significantTokens.slice(0, 2).join(" ");
    if (!queries.includes(twoTokens)) queries.push(twoTokens);
  }
  // First significant token alone (catches "Dissolve Play" -> "DISSOLVE :: PLAY")
  if (significantTokens.length >= 1 && significantTokens[0].length >= 4) {
    if (!queries.includes(significantTokens[0])) queries.push(significantTokens[0]);
  }

  const seen = new Set<number>();
  const allHits: ScoredCandidate[] = [];

  for (const term of queries) {
    let response;
    try {
      response = await fetchSearchPage(term, 1);
    } catch (err) {
      if (verbose) {
        console.warn(
          `  [search:${term}] error:`,
          err instanceof Error ? err.message : err
        );
      }
      continue;
    }
    await delay(FETCH_DELAY_MS);

    for (const hit of response.data) {
      if (seen.has(hit.id)) continue;
      seen.add(hit.id);

      const titleNormA = normalizeForComparison(event.title);
      const titleNormB = normalizeForComparison(hit.name);
      const lev = stringSimilarity(titleNormA, titleNormB);
      const overlap = tokenOverlap(event.title, hit.name);
      const titleSim = Math.max(lev, overlap);
      const dateScore = dateMatchScore(event.start_date, hit.start_datetime);
      // Venue is a tiebreaker, not a primary signal — many Megatix events
      // list the venue inconsistently (e.g. "Paradiso - Ubud" vs "Paradiso Ubud").
      const venueSim =
        event.venue_name && hit.venue_name
          ? Math.max(
              stringSimilarity(
                normalizeForComparison(event.venue_name),
                normalizeForComparison(hit.venue_name)
              ),
              tokenOverlap(event.venue_name, hit.venue_name)
            )
          : 0;
      const score = 0.65 * titleSim + 0.25 * dateScore + 0.1 * venueSim;

      allHits.push({
        id: hit.id,
        slug: hit.slug,
        name: hit.name,
        cover: hit.cover,
        start_datetime: hit.start_datetime,
        venue_name: hit.venue_name,
        score,
        titleSim,
        dateScore,
      });
    }
  }

  allHits.sort((a, b) => b.score - a.score);

  if (verbose && allHits.length > 0) {
    console.log(`  top candidates:`);
    for (const c of allHits.slice(0, 3)) {
      console.log(
        `    [${c.score.toFixed(2)}] (title=${c.titleSim.toFixed(2)}, date=${c.dateScore.toFixed(2)}) ${c.name} @ ${c.start_datetime ?? "?"} (${c.venue_name ?? "?"})`
      );
    }
  }

  const best = allHits[0];
  if (!best) return null;
  if (best.score < MIN_SCORE) return null;
  return best;
}

const STOP_WORDS = new Set([
  "the", "and", "with", "for", "from", "into", "your", "you", "our",
  "class", "session", "event", "ubud", "bali",
]);

interface UpdateResult {
  status: "would_update" | "updated" | "no_match" | "no_image" | "error";
  reason?: string;
  fields?: string[];
  match?: ScoredCandidate;
}

async function backfillOne(
  event: CandidateEvent,
  args: CliArgs
): Promise<UpdateResult> {
  const match = await searchMegatixForEvent(event, args.verbose);
  if (!match) return { status: "no_match" };

  // Try to fetch detail to get a complete cover URL (search response sometimes truncates)
  let coverFromDetail: string | null = null;
  try {
    const detail = await fetchEventDetail(match.slug);
    coverFromDetail = detail.cover ?? null;
    await delay(FETCH_DELAY_MS);
  } catch (err) {
    if (args.verbose) {
      console.warn(
        `  detail fetch failed for ${match.slug}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  const cover = coverFromDetail || match.cover;
  if (!cover) {
    return { status: "no_image", match };
  }

  const eventUrl = `https://megatix.co.id/events/${match.slug}`;
  const update: Record<string, string> = {};
  if (!event.cover_image_url) update.cover_image_url = cover;
  if (!event.external_ticket_url) update.external_ticket_url = eventUrl;
  if (!event.source_url) update.source_url = eventUrl;

  const fields = Object.keys(update);
  if (fields.length === 0) {
    return { status: "no_match", reason: "no missing fields", match };
  }

  if (args.dryRun) {
    return { status: "would_update", fields, match };
  }

  const { error } = await supabase
    .from("events")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", event.id);

  if (error) {
    return { status: "error", reason: error.message, match };
  }
  return { status: "updated", fields, match };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs();
  console.log("[backfill-megatix] args:", args);

  const events = await loadCandidates(args);
  console.log(`[backfill-megatix] loaded ${events.length} candidate events`);

  let updated = 0;
  let noMatch = 0;
  let noImage = 0;
  let errors = 0;

  for (const evt of events) {
    console.log(
      `\n[${evt.id}] "${evt.title}" @ ${evt.venue_name ?? "?"} (${evt.start_date})`
    );
    try {
      const result = await backfillOne(evt, args);
      switch (result.status) {
        case "updated":
        case "would_update":
          updated++;
          console.log(
            `  -> ${result.status}: ${result.fields?.join(", ")} (megatix: ${result.match?.name} score=${result.match?.score.toFixed(2)})`
          );
          break;
        case "no_match":
          noMatch++;
          console.log(`  -> no match${result.reason ? ` (${result.reason})` : ""}`);
          break;
        case "no_image":
          noImage++;
          console.log(`  -> match found but no cover image: ${result.match?.name}`);
          break;
        case "error":
          errors++;
          console.error(`  -> error: ${result.reason}`);
          break;
      }
    } catch (err) {
      errors++;
      console.error(
        `  -> threw:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  console.log(
    `\n[backfill-megatix] done. updated=${updated} no_match=${noMatch} no_image=${noImage} errors=${errors}`
  );
}

main().catch((err) => {
  console.error("[backfill-megatix] fatal:", err);
  process.exit(1);
});
