/**
 * Backfill missing event cover images with Stability AI.
 *
 * Targets approved upcoming events where cover_image_url IS NULL. Uses a
 * per-category editorial prompt (Aman / National Geographic register —
 * never new-age / hippie / chakra / mandala) and uploads the generated
 * PNG to the Supabase `images/events/` bucket.
 *
 * Usage:
 *   npx tsx scripts/backfill-event-images-ai.ts --dry-run             # preview
 *   npx tsx scripts/backfill-event-images-ai.ts --dry-run --limit 5
 *   npx tsx scripts/backfill-event-images-ai.ts --limit 5             # generate first 5
 *   npx tsx scripts/backfill-event-images-ai.ts                       # full run
 *   npx tsx scripts/backfill-event-images-ai.ts --id <eventId>
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *               STABILITY_AI_API_KEY.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { generateImage } from "@/lib/stability";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Editorial prompt scaffolds, per category. The shared STYLE_ANCHOR locks
// the gallery to one painterly register — Aman / Bambu Indah / National
// Geographic. NEGATIVE_TERMS keeps stable diffusion away from chakra
// imagery, posed wellness, body-paint, mandalas, neon.
const STYLE_ANCHOR =
  "35mm film photograph, painterly, deep green and warm cream and amber palette, soft natural light, editorial restraint, 16:9 cinematic crop";

const NEGATIVE_TERMS =
  "no text, no logos, no watermarks, no faces facing camera, no chakra symbols, no mandalas, no rainbow gradients, no neon, no sparkles, no decorative scrolls, no posed wellness, no stock yoga";

const CATEGORY_PROMPTS: Record<string, (title: string) => string> = {
  "Dance & Movement": (t) =>
    `${t} — slow-shutter editorial photograph of bare feet on polished concrete in dim Ubud studio, low warm tungsten light, painterly motion blur, no faces, ${STYLE_ANCHOR}, ${NEGATIVE_TERMS}`,
  "Tantra & Intimacy": (t) =>
    `${t} — still-life of two clay teacups and a single beeswax candle on dark linen at dusk, soft amber glow, restrained editorial, intimate, no people, ${STYLE_ANCHOR}, ${NEGATIVE_TERMS}`,
  "Yoga & Meditation": (t) =>
    `${t} — single woven mat and brass bowl in shaft of morning light through bamboo, deep green shadow, restrained editorial, no people, ${STYLE_ANCHOR}, ${NEGATIVE_TERMS}`,
  "Breathwork & Healing": (t) =>
    `${t} — empty bolster and folded linen in dim Ubud pavilion, single oil lamp, painterly stillness, no people, ${STYLE_ANCHOR}, ${NEGATIVE_TERMS}`,
  "Sound & Music": (t) =>
    `${t} — single bronze gong against deep green wall in candlelight, painterly still-life, no people, ${STYLE_ANCHOR}, ${NEGATIVE_TERMS}`,
  "Plant Medicine & Ceremony": (t) =>
    `${t} — frangipani flower on dark stone with single beeswax candle and unlit incense stick, painterly still-life, restrained, ${STYLE_ANCHOR}, ${NEGATIVE_TERMS}`,
  "Workshops & Talks": (t) =>
    `${t} — empty wooden bench and notebook on woven mat in Ubud open-air pavilion at dusk, warm lantern, observational editorial, no people, ${STYLE_ANCHOR}, ${NEGATIVE_TERMS}`,
  "Food & Gathering": (t) =>
    `${t} — hand-thrown ceramic bowls and dark stoneware on linen at golden hour, painterly food editorial, no people, ${STYLE_ANCHOR}, ${NEGATIVE_TERMS}`,
  "Art & Creativity": (t) =>
    `${t} — open sketchbook and brass-handled tools on weathered teak desk by an open shutter, soft daylight, editorial still-life, no people, ${STYLE_ANCHOR}, ${NEGATIVE_TERMS}`,
  "Nature & Outdoors": (t) =>
    `${t} — terraced rice fields under low cloud at dawn, painterly editorial landscape, deep greens and warm cream sky, no people, ${STYLE_ANCHOR}, ${NEGATIVE_TERMS}`,
  "Community & Connection": (t) =>
    `${t} — long wooden bench under a banyan tree at dusk, two empty enamel mugs, painterly editorial, no people, ${STYLE_ANCHOR}, ${NEGATIVE_TERMS}`,
};

const DEFAULT_PROMPT = (title: string, category: string) =>
  `${title} — Ubud editorial still-life evoking ${category.toLowerCase()}, painterly composition, deep green and warm cream palette, no people, ${STYLE_ANCHOR}, ${NEGATIVE_TERMS}`;

interface CliArgs {
  limit?: number;
  dryRun: boolean;
  verbose: boolean;
  id?: string;
  delayMs: number;
}

function parseArgs(): CliArgs {
  const args: CliArgs = { dryRun: false, verbose: false, delayMs: 1500 };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--verbose" || a === "-v") args.verbose = true;
    else if (a === "--limit" && argv[i + 1]) {
      args.limit = parseInt(argv[++i], 10);
    } else if (a === "--id" && argv[i + 1]) {
      args.id = argv[++i];
    } else if (a === "--delay" && argv[i + 1]) {
      args.delayMs = parseInt(argv[++i], 10);
    }
  }
  return args;
}

interface EventRow {
  id: string;
  title: string;
  category: string;
  short_description: string | null;
  start_date: string;
  cover_image_url: string | null;
}

async function fetchTargets(args: CliArgs): Promise<EventRow[]> {
  const today = new Date().toISOString().slice(0, 10);

  let q = supabase
    .from("events")
    .select("id, title, category, short_description, start_date, cover_image_url")
    .eq("status", "approved")
    .is("cover_image_url", null)
    .gte("start_date", today)
    .order("start_date", { ascending: true });

  if (args.id) {
    q = supabase
      .from("events")
      .select(
        "id, title, category, short_description, start_date, cover_image_url"
      )
      .eq("id", args.id);
  }

  const { data, error } = await q;
  if (error) throw error;
  let rows = (data ?? []) as EventRow[];
  if (args.limit) rows = rows.slice(0, args.limit);
  return rows;
}

function buildPrompt(event: EventRow): string {
  const builder = CATEGORY_PROMPTS[event.category];
  if (builder) return builder(event.title);
  return DEFAULT_PROMPT(event.title, event.category);
}

function safeFileName(eventId: string): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `events/${eventId}-${stamp}-${rand}.png`;
}

async function uploadToStorage(
  buffer: Buffer,
  fileName: string
): Promise<string | null> {
  const { error } = await supabase.storage
    .from("images")
    .upload(fileName, buffer, {
      contentType: "image/png",
      upsert: false,
    });
  if (error) {
    console.error(`  Upload failed: ${error.message}`);
    return null;
  }
  const { data } = supabase.storage.from("images").getPublicUrl(fileName);
  return data.publicUrl || null;
}

async function processEvent(event: EventRow, args: CliArgs): Promise<boolean> {
  const prompt = buildPrompt(event);

  if (args.verbose) {
    console.log(`  Prompt: ${prompt.slice(0, 220)}…`);
  }

  if (args.dryRun) {
    console.log(`  [dry-run] would generate image for "${event.title}"`);
    return true;
  }

  const buffer = await generateImage(prompt);
  const fileName = safeFileName(event.id);
  const publicUrl = await uploadToStorage(buffer, fileName);
  if (!publicUrl) return false;

  const { error: updateError } = await supabase
    .from("events")
    .update({ cover_image_url: publicUrl })
    .eq("id", event.id);

  if (updateError) {
    console.error(`  DB update failed: ${updateError.message}`);
    return false;
  }

  console.log(`  ✓ ${publicUrl}`);
  return true;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs();

  if (!args.dryRun && !process.env.STABILITY_AI_API_KEY) {
    console.error(
      "STABILITY_AI_API_KEY not configured. Set it in .env.local or use --dry-run."
    );
    process.exit(1);
  }

  console.log(
    `\n🎨 Backfilling event images via Stability AI` +
      (args.dryRun ? " (DRY RUN)" : "") +
      (args.limit ? ` (limit ${args.limit})` : "")
  );

  const events = await fetchTargets(args);

  if (events.length === 0) {
    console.log("\nNo events need backfilling. ✨");
    return;
  }

  console.log(`\nFound ${events.length} event(s) without imagery:\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    console.log(
      `[${i + 1}/${events.length}] ${ev.title} — ${ev.category} — ${ev.start_date}`
    );
    try {
      const ok = await processEvent(ev, args);
      if (ok) success++;
      else failed++;
    } catch (err) {
      failed++;
      console.error(
        `  ✗ ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!args.dryRun && i < events.length - 1) {
      await sleep(args.delayMs);
    }
  }

  console.log(
    `\n📊 Summary: ${success} succeeded, ${failed} failed${args.dryRun ? " (dry run, no changes written)" : ""}`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
