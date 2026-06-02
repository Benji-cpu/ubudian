/**
 * Backfill script: compute a Gemini text-embedding-004 vector for every
 * approved/archived event that doesn't have one yet, and write it to
 * events.embedding (pgvector). Powers "more like this", the per-user taste
 * vector, the quiz spread's semantic widening, and the clustering analysis.
 *
 * Run embeddings FIRST (before vibe-tag vocabulary work) so the clustering
 * step has the whole corpus to read patterns from.
 *
 * Usage:
 *   npx tsx scripts/embed-events-backfill.ts                       # all eligible
 *   npx tsx scripts/embed-events-backfill.ts --limit 20            # cap rows
 *   npx tsx scripts/embed-events-backfill.ts --dry-run --limit 5   # validate
 *   npx tsx scripts/embed-events-backfill.ts --id <eventId>        # one event
 *   npx tsx scripts/embed-events-backfill.ts --concurrency 5       # default 5
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * GEMINI_API_KEY.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { embedText, embedEventText, toPgVector } from "../src/lib/embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface CliArgs {
  limit?: number;
  dryRun: boolean;
  id?: string;
  concurrency: number;
}

function parseArgs(): CliArgs {
  const args: CliArgs = { dryRun: false, concurrency: 5 };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--limit" && argv[i + 1]) args.limit = parseInt(argv[++i], 10);
    else if (argv[i] === "--id" && argv[i + 1]) args.id = argv[++i];
    else if (argv[i] === "--concurrency" && argv[i + 1])
      args.concurrency = parseInt(argv[++i], 10);
  }
  return args;
}

interface EventRow {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
}

async function loadEvents(args: CliArgs): Promise<EventRow[]> {
  let query = supabase
    .from("events")
    .select("id, title, short_description, description")
    .in("status", ["approved", "archived"]);

  if (args.id) {
    query = query.eq("id", args.id);
  } else {
    query = query.is("embedding", null);
  }

  if (args.limit) query = query.limit(args.limit);
  query = query.order("created_at", { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const MAX = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === MAX) break;
      const delay = Math.min(2000 * 2 ** (attempt - 1) + Math.random() * 1000, 8000);
      console.warn(`[${label}] attempt ${attempt} failed: ${msg.slice(0, 120)} — retrying in ${Math.round(delay)}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

async function processEvent(event: EventRow, dryRun: boolean): Promise<boolean> {
  try {
    const text = embedEventText(event);
    const values = await withRetry(() => embedText(text, "RETRIEVAL_DOCUMENT"), event.id.slice(0, 8));
    if (!dryRun) {
      const { error } = await supabase
        .from("events")
        .update({ embedding: toPgVector(values) })
        .eq("id", event.id);
      if (error) throw error;
    }
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${event.id.slice(0, 8)}] FAILED: ${msg.slice(0, 200)}`);
    return false;
  }
}

/** Tiny semaphore — runs `tasks` with at-most `concurrency` in flight. */
async function runWithConcurrency<T, R>(
  tasks: T[],
  concurrency: number,
  fn: (task: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(tasks.length);
  let next = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const i = next++;
      if (i >= tasks.length) return;
      results[i] = await fn(tasks[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const args = parseArgs();
  console.log(
    `Embed events — dryRun=${args.dryRun} limit=${args.limit ?? "all"} concurrency=${args.concurrency}`,
  );

  const events = await loadEvents(args);
  console.log(`Loaded ${events.length} events needing an embedding.`);
  if (events.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const start = Date.now();
  let succeeded = 0;
  let failed = 0;
  let processed = 0;

  await runWithConcurrency(events, args.concurrency, async (event) => {
    const ok = await processEvent(event, args.dryRun);
    processed++;
    if (ok) {
      succeeded++;
      console.log(`[${processed}/${events.length}] embedded ${event.title.slice(0, 70)}`);
    } else {
      failed++;
    }
  });

  const seconds = Math.round((Date.now() - start) / 1000);
  console.log(
    `\nDone in ${seconds}s — succeeded=${succeeded} failed=${failed} ${args.dryRun ? "(dry run, nothing written)" : ""}`,
  );
  process.exit(failed > 0 && !args.dryRun ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
