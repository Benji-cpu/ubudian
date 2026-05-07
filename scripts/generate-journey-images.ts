/**
 * One-off: generate brand-tuned cover images for journeys, day-card backgrounds,
 * and atom thumbnails via Stability AI Core, upload to Supabase storage, then
 * write the resulting public URLs into the appropriate columns.
 *
 * Run:  npx tsx scripts/generate-journey-images.ts
 *
 * Required env: STABILITY_AI_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
 *               SUPABASE_SERVICE_ROLE_KEY.
 *
 * Idempotency: pass `--only=<slot-id>` to regenerate a single slot. By default
 * the script SKIPS any slot whose target column is already non-null, so re-runs
 * are safe and free.
 *
 * Style is locked: deep green / gold / terracotta palette, painterly,
 * cinematic, no text, no faces unless ceremonial silhouettes. The point is
 * atmosphere, not a literal travel-brochure shot.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const STABILITY_API_URL =
  "https://api.stability.ai/v2beta/stable-image/generate/core";

const STYLE_LOCK =
  "painterly cinematic photograph, golden hour Ubud Bali light, deep green and gold and terracotta palette, soft mist, atmospheric, depth of field, no text, no logos";

type Aspect = "16:9" | "1:1";

interface Spec {
  id: string;                 // slug-style identifier for logs
  prompt: string;             // the *subject* — STYLE_LOCK is appended
  aspect: Aspect;
  // Where to write the resulting URL
  target: { table: "journeys" | "journey_days" | "journey_atoms"; column: string; whereId: string };
}

// ---------------------------------------------------------------------------
// Image plan — 21 images
// ---------------------------------------------------------------------------
const SPECS: Spec[] = [
  // -- Journey covers (16:9, hero on detail page + card on listing)
  {
    id: "cover:7-day-awakening",
    prompt: "A cacao ceremony in low candlelight, copper cups arranged on a wooden floor, smoke rising from incense, an intimate Ubud temple space, no people in the foreground",
    aspect: "16:9",
    target: { table: "journeys", column: "cover_image_url", whereId: "00000000-0000-0000-0000-00000000704c" },
  },
  {
    id: "cover:3-day-reset",
    prompt: "Terraced Ubud rice paddies at dawn, mist drifting across the green, a stone path winding through, palm fronds at the edge",
    aspect: "16:9",
    target: { table: "journeys", column: "cover_image_url", whereId: "00000000-0000-0000-0000-0000000003ad" },
  },

  // -- Day backgrounds (16:9, low opacity behind text)
  {
    id: "day-bg:reset-d1-land",
    prompt: "An open wooden villa porch at evening, lanterns lit, jungle behind, a low table set for dinner, soft warm light",
    aspect: "16:9",
    target: { table: "journey_days", column: "background_image_url", whereId: "00000000-0000-0000-0000-0000000003a1" },
  },
  {
    id: "day-bg:reset-d2-plunge",
    prompt: "An open-air bamboo yoga shala in early morning light, a single rolled mat in the foreground, jungle visible through the structure",
    aspect: "16:9",
    target: { table: "journey_days", column: "background_image_url", whereId: "00000000-0000-0000-0000-0000000003a2" },
  },
  {
    id: "day-bg:reset-d3-exit",
    prompt: "A wooden massage table strewn with frangipani petals, soft natural light, neutral linen draped, peaceful and quiet",
    aspect: "16:9",
    target: { table: "journey_days", column: "background_image_url", whereId: "00000000-0000-0000-0000-0000000003a3" },
  },
  {
    id: "day-bg:awakening-d1-settle",
    prompt: "A long wooden dining table set with candles and ceramic plates, open sides looking onto jungle, evening warm light",
    aspect: "16:9",
    target: { table: "journey_days", column: "background_image_url", whereId: "00000000-0000-0000-0000-00000000701a" },
  },
  {
    id: "day-bg:awakening-d2-body",
    prompt: "Silhouettes of yoga practitioners at sunrise, a hilltop shala with a view of mist over rice terraces, no faces visible",
    aspect: "16:9",
    target: { table: "journey_days", column: "background_image_url", whereId: "00000000-0000-0000-0000-00000000702a" },
  },
  {
    id: "day-bg:awakening-d3-open-chest",
    prompt: "A cacao ceremony circle in low candlelight, copper cups in concentric arrangement, smoke and warm amber light, intimate",
    aspect: "16:9",
    target: { table: "journey_days", column: "background_image_url", whereId: "00000000-0000-0000-0000-00000000703a" },
  },
  {
    id: "day-bg:awakening-d4-rest",
    prompt: "A still pool reflecting palm trees and mossy stone walls, midday light, no people, deeply quiet",
    aspect: "16:9",
    target: { table: "journey_days", column: "background_image_url", whereId: "00000000-0000-0000-0000-00000000704a" },
  },
  {
    id: "day-bg:awakening-d5-move",
    prompt: "A dance floor lit with warm amber lights, blurred figures in motion, no faces, energy and movement",
    aspect: "16:9",
    target: { table: "journey_days", column: "background_image_url", whereId: "00000000-0000-0000-0000-00000000705a" },
  },
  {
    id: "day-bg:awakening-d6-threshold",
    prompt: "A stone Balinese temple gateway draped with offerings of frangipani and palm, morning mist, dappled light through trees",
    aspect: "16:9",
    target: { table: "journey_days", column: "background_image_url", whereId: "00000000-0000-0000-0000-00000000706a" },
  },
  {
    id: "day-bg:awakening-d7-carry",
    prompt: "A closing circle of candles arranged on a wooden floor, low warm light, intimate and reverent, no people",
    aspect: "16:9",
    target: { table: "journey_days", column: "background_image_url", whereId: "00000000-0000-0000-0000-00000000707a" },
  },

  // -- Place atom thumbnails (1:1)
  {
    id: "atom:tirta-empul",
    prompt: "A row of stone water-purification fountains at a traditional Balinese temple, water arcing into a pool, ancient and quiet",
    aspect: "1:1",
    target: { table: "journey_atoms", column: "image_url", whereId: "00000000-0000-0000-0000-00000000a001" },
  },
  {
    id: "atom:goa-gajah",
    prompt: "An ancient stone cave entrance carved with weathered figures, moss and dappled light, a single offering at the threshold",
    aspect: "1:1",
    target: { table: "journey_atoms", column: "image_url", whereId: "00000000-0000-0000-0000-00000000a002" },
  },
  {
    id: "atom:campuhan-ridge",
    prompt: "A grassy ridge path running between rice terraces at sunrise, low golden light, mist in the valley below",
    aspect: "1:1",
    target: { table: "journey_atoms", column: "image_url", whereId: "00000000-0000-0000-0000-00000000a003" },
  },
  {
    id: "atom:pyramids-of-chi",
    prompt: "The interior of a sacred geometric pyramid space with brass sound bowls and gongs arranged for a ceremony, candlelight",
    aspect: "1:1",
    target: { table: "journey_atoms", column: "image_url", whereId: "00000000-0000-0000-0000-00000000a004" },
  },
  {
    id: "atom:yoga-barn",
    prompt: "An open-air bamboo yoga shala overlooking jungle and rice paddies, mats laid out, morning light filtering through",
    aspect: "1:1",
    target: { table: "journey_atoms", column: "image_url", whereId: "00000000-0000-0000-0000-00000000a005" },
  },

  // -- Restaurant atom thumbnails (1:1)
  {
    id: "atom:moksa",
    prompt: "A garden-to-table plant-based meal on ceramic plates, fresh herbs and root vegetables, dappled natural light, foliage at the edge",
    aspect: "1:1",
    target: { table: "journey_atoms", column: "image_url", whereId: "00000000-0000-0000-0000-00000000a301" },
  },
  {
    id: "atom:hujan-locale",
    prompt: "A heritage two-storey colonial Ubud building at warm evening light, candles in the windows, indoor-outdoor dining",
    aspect: "1:1",
    target: { table: "journey_atoms", column: "image_url", whereId: "00000000-0000-0000-0000-00000000a302" },
  },
  {
    id: "atom:locavore-nxt",
    prompt: "A small carefully composed plate of hyperlocal Indonesian ingredients, intimate fine-dining setting, soft directional light",
    aspect: "1:1",
    target: { table: "journey_atoms", column: "image_url", whereId: "00000000-0000-0000-0000-00000000a303" },
  },
  {
    id: "atom:mozaic",
    prompt: "An elegant garden dining room blending French and Balinese aesthetics, ceremony in pacing, soft golden light",
    aspect: "1:1",
    target: { table: "journey_atoms", column: "image_url", whereId: "00000000-0000-0000-0000-00000000a304" },
  },
];

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------
async function generate(prompt: string, aspect: Aspect): Promise<Buffer> {
  const apiKey = process.env.STABILITY_AI_API_KEY;
  if (!apiKey) throw new Error("STABILITY_AI_API_KEY not configured");

  const formData = new FormData();
  formData.append("prompt", `${prompt}. ${STYLE_LOCK}`);
  formData.append("output_format", "png");
  formData.append("aspect_ratio", aspect);

  const res = await fetch(STABILITY_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "image/*" },
    body: formData,
  });

  if (!res.ok) throw new Error(`Stability ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadAndPublic(buffer: Buffer, slotId: string): Promise<string> {
  const safeName = slotId.replace(/[^a-z0-9-]/gi, "-");
  const path = `experiences/${Date.now()}-${safeName}.png`;
  const { error } = await supabase.storage
    .from("images")
    .upload(path, buffer, { contentType: "image/png", upsert: false });
  if (error) throw new Error(`Upload ${slotId}: ${error.message}`);
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

async function currentValue(target: Spec["target"]): Promise<string | null> {
  const { data } = await supabase
    .from(target.table)
    .select(target.column)
    .eq("id", target.whereId)
    .maybeSingle();
  // The Supabase JS types don't know our dynamic column, so cast through unknown.
  return ((data as Record<string, string | null> | null)?.[target.column] ?? null);
}

async function writeUrl(target: Spec["target"], url: string): Promise<void> {
  const { error } = await supabase
    .from(target.table)
    .update({ [target.column]: url })
    .eq("id", target.whereId);
  if (error) throw new Error(`Update ${target.table}.${target.column} ${target.whereId}: ${error.message}`);
}

async function main() {
  const argOnly = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
  const argForce = process.argv.includes("--force");

  console.log(`Generating ${argOnly ? "1 spec" : `${SPECS.length} specs`}…\n`);

  for (const spec of SPECS) {
    if (argOnly && spec.id !== argOnly) continue;

    if (!argForce) {
      const existing = await currentValue(spec.target);
      if (existing) {
        console.log(`SKIP  ${spec.id} — already populated`);
        continue;
      }
    }

    process.stdout.write(`GEN   ${spec.id}…`);
    try {
      const buf = await generate(spec.prompt, spec.aspect);
      const url = await uploadAndPublic(buf, spec.id);
      await writeUrl(spec.target, url);
      console.log(` OK\n      ${url}`);
    } catch (err) {
      console.log(` FAIL\n      ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
