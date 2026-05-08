/**
 * One-off: generate brand-tuned imagery for the Guides section — 5 intent-rail
 * tiles + hero/card images for the launch seed guides — via Stability AI Core,
 * upload to Supabase storage, log the resulting public URLs.
 *
 * Run:  npx tsx scripts/generate-guide-images.ts
 *
 * Required env: STABILITY_AI_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
 *               SUPABASE_SERVICE_ROLE_KEY.
 *
 * Style is locked: deep green / gold / terracotta, painterly, cinematic, no
 * text, no faces unless ceremonial silhouettes. Aman / COMO / Cereal register —
 * editorial, restrained, atmospheric.
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
  "painterly cinematic photograph, golden hour Ubud Bali light, deep green and gold and terracotta palette, soft mist, atmospheric, depth of field, no text, no logos, editorial luxury, Aman aesthetic";

type Aspect = "16:9" | "1:1" | "4:5" | "3:2" | "9:16";

interface Spec {
  id: string;
  filename: string; // e.g. "intents/romance.jpg"
  prompt: string;
  aspect: Aspect;
}

const SPECS: Spec[] = [
  // --- Intent rail tiles (4:5 portrait) ---
  {
    id: "intent:romance",
    filename: "intents/romance.jpg",
    aspect: "4:5",
    prompt:
      "Two figures silhouetted in a low-lit Ubud restaurant, warm candle on a wooden table, brass details, frangipani petals scattered, soft bokeh through palm leaves",
  },
  {
    id: "intent:community",
    filename: "intents/community.jpg",
    aspect: "4:5",
    prompt:
      "A circle of cushions in a bamboo open-air space at dusk, warm orange lanterns hanging, jungle behind, a single tea pot at the centre, intimate gathering atmosphere",
  },
  {
    id: "intent:spirit",
    filename: "intents/spirit.jpg",
    aspect: "4:5",
    prompt:
      "An offering of frangipani and incense on a moss-covered stone altar, early morning mist in a temple courtyard, soft shafts of light, no people",
  },
  {
    id: "intent:living",
    filename: "intents/living.jpg",
    aspect: "4:5",
    prompt:
      "An open-plan villa interior with linen curtains, a low wooden coffee table, a single ceramic vase, bougainvillea visible through the open doorway, warm afternoon light",
  },
  {
    id: "intent:local-culture",
    filename: "intents/local-culture.jpg",
    aspect: "4:5",
    prompt:
      "A Balinese woman in a traditional sarong arranging canang sari offerings on a stone wall at dawn, intimate hands close-up, marigolds and incense, no face visible",
  },

  // --- "Falling in Love in Ubud" — intent guide ---
  {
    id: "guide:falling-in-love-hero",
    filename: "covers/falling-in-love-hero.jpg",
    aspect: "16:9",
    prompt:
      "A small wooden table for two on a candle-lit terrace overlooking Ubud's rice fields at sunset, two glasses of wine, soft mist rising from the valley, warm gold and emerald palette",
  },
  {
    id: "guide:falling-in-love-card",
    filename: "covers/falling-in-love-card.jpg",
    aspect: "3:2",
    prompt:
      "An intimate ecstatic-dance space at dusk, two figures dancing close in candlelight, warm bokeh, the floor scattered with flower petals, painterly motion blur",
  },

  // --- "Helmet, the police, and the bribe" — practical guide ---
  {
    id: "guide:helmet-card",
    filename: "covers/helmet-card.jpg",
    aspect: "3:2",
    prompt:
      "A scooter parked beside a Ubud rice paddy at midday, a black helmet hanging from the handlebar, palm-leaf shade across the scene, no people, faint pink frangipani on the seat",
  },
];

async function generateOne(spec: Spec): Promise<string> {
  const form = new FormData();
  form.append("prompt", `${spec.prompt}, ${STYLE_LOCK}`);
  form.append("aspect_ratio", spec.aspect);
  form.append("output_format", "jpeg");

  const res = await fetch(STABILITY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STABILITY_AI_API_KEY}`,
      Accept: "image/*",
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`stability ${res.status}: ${text}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  const path = `guides/${spec.filename}`;
  const { error } = await supabase.storage
    .from("images")
    .upload(path, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });
  if (error) {
    throw new Error(`upload ${path}: ${error.message}`);
  }

  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.replace("--only=", "") : null;

  const targets = only ? SPECS.filter((s) => s.id === only) : SPECS;

  console.log(`Generating ${targets.length} image(s)…\n`);

  const results: { id: string; url: string }[] = [];

  for (const spec of targets) {
    process.stdout.write(`  ${spec.id} (${spec.aspect}) … `);
    try {
      const url = await generateOne(spec);
      console.log("OK");
      results.push({ id: spec.id, url });
    } catch (err) {
      console.log(`FAIL — ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log("\nResults:");
  for (const { id, url } of results) {
    console.log(`  ${id}\n    ${url}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
