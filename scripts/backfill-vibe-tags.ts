/**
 * Backfill script: tag approved/archived events with 0–4 vibe facets from the
 * controlled VIBE_TAGS vocabulary (src/lib/vibe-tags.ts) via Gemini flash-lite.
 * vibe_tags are the finer, behind-the-scenes facet layer used as an explainable
 * Jaccard sharpener on top of embedding similarity.
 *
 * Unlike archetype tags, an empty result is valid — some events genuinely match
 * no facet, and that's fine.
 *
 * Usage:
 *   npx tsx scripts/backfill-vibe-tags.ts                       # all eligible
 *   npx tsx scripts/backfill-vibe-tags.ts --limit 20            # cap rows
 *   npx tsx scripts/backfill-vibe-tags.ts --dry-run --limit 5   # validate
 *   npx tsx scripts/backfill-vibe-tags.ts --id <eventId>        # one event
 *   npx tsx scripts/backfill-vibe-tags.ts --concurrency 5       # default 3
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { VIBE_TAGS, VIBE_TAG_DESCRIPTIONS, type VibeTag } from "../src/lib/vibe-tags";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface CliArgs {
  limit?: number;
  dryRun: boolean;
  id?: string;
  concurrency: number;
}

function parseArgs(): CliArgs {
  const args: CliArgs = { dryRun: false, concurrency: 3 };
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
  category: string | null;
  vibe_tags: string[] | null;
}

async function loadEvents(args: CliArgs): Promise<EventRow[]> {
  let query = supabase
    .from("events")
    .select("id, title, short_description, description, category, vibe_tags")
    .in("status", ["approved", "archived"]);

  if (args.id) {
    query = query.eq("id", args.id);
  } else {
    query = query.or("vibe_tags.is.null,vibe_tags.eq.{}");
  }

  if (args.limit) query = query.limit(args.limit);
  query = query.order("created_at", { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

const responseSchema = {
  type: SchemaType.OBJECT as const,
  properties: {
    vibe_tags: {
      type: SchemaType.ARRAY as const,
      description: "0–4 vibe facet IDs that precisely describe this event. Empty if none clearly apply.",
      items: { type: SchemaType.STRING as const, enum: [...VIBE_TAGS], format: "enum" as const },
    },
  },
  required: ["vibe_tags"],
};

const VIBE_PROMPT_DEFINITIONS = VIBE_TAGS.map(
  (id) => `- ${id}: ${VIBE_TAG_DESCRIPTIONS[id]}`,
).join("\n");

async function tagEvent(event: EventRow): Promise<VibeTag[]> {
  const model = gemini.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });

  const eventBlock = [
    `Title: ${event.title}`,
    event.category ? `Category: ${event.category}` : null,
    event.short_description ? `Short description: ${event.short_description}` : null,
    event.description ? `Description: ${event.description.slice(0, 1500)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are tagging an Ubud (Bali) conscious-community event with the precise "vibe" facets that describe its practice. Pick only facets that clearly apply (0–4). Many events have one or two. Return an empty array if none fit.

The controlled facet vocabulary:
${VIBE_PROMPT_DEFINITIONS}

Return JSON: { "vibe_tags": [...] }. Each value must be one of the IDs above. No more than 4.

Event:
${eventBlock}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  let parsed: { vibe_tags?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
  }
  const tags = Array.isArray(parsed.vibe_tags)
    ? parsed.vibe_tags.filter((t): t is VibeTag => VIBE_TAGS.includes(t as VibeTag))
    : [];
  return tags.slice(0, 4);
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

async function processEvent(event: EventRow, dryRun: boolean): Promise<{ tags: VibeTag[]; ok: boolean }> {
  try {
    const tags = await withRetry(() => tagEvent(event), event.id.slice(0, 8));
    if (!dryRun) {
      const { error } = await supabase.from("events").update({ vibe_tags: tags }).eq("id", event.id);
      if (error) throw error;
    }
    return { tags, ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${event.id.slice(0, 8)}] FAILED: ${msg.slice(0, 200)}`);
    return { tags: [], ok: false };
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
    `Backfill vibe tags — dryRun=${args.dryRun} limit=${args.limit ?? "all"} concurrency=${args.concurrency}`,
  );

  const events = await loadEvents(args);
  console.log(`Loaded ${events.length} eligible events.`);
  if (events.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const start = Date.now();
  let succeeded = 0;
  let failed = 0;
  let processed = 0;

  await runWithConcurrency(events, args.concurrency, async (event) => {
    const { tags, ok } = await processEvent(event, args.dryRun);
    processed++;
    if (ok) {
      succeeded++;
      console.log(
        `[${processed}/${events.length}] ${event.title.slice(0, 56).padEnd(56)} → [${tags.join(", ")}]`,
      );
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
