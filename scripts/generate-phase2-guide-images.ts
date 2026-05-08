/**
 * Phase-2: brand-locked imagery for the 4 + 4 new guides.
 *
 * Run:  npx tsx scripts/generate-phase2-guide-images.ts
 *       npx tsx scripts/generate-phase2-guide-images.ts --only=guide:visa-runs-card
 *
 * Idempotent: re-runs skip slots whose storage object already exists, so the
 * default behaviour is "fill in any holes" with no extra Stability spend.
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
  filename: string;
  prompt: string;
  aspect: Aspect;
}

const SPECS: Spec[] = [
  // ─────────────────────────  PRACTICAL  ─────────────────────────
  {
    id: "guide:renting-villa-card",
    filename: "covers/renting-villa-card.jpg",
    aspect: "3:2",
    prompt:
      "An open-plan Ubud villa interior, linen curtains drifting in a breeze, terracotta tiles, a single low coffee table with a bowl of green papaya, jungle visible through open doorways, no people",
  },
  {
    id: "guide:visa-runs-card",
    filename: "covers/visa-runs-card.jpg",
    aspect: "3:2",
    prompt:
      "A passport open on a worn wooden desk beside a small porcelain coffee cup, a stack of fresh stamps faintly visible, brass-trimmed window with rain-blurred jungle behind, intimate and quiet",
  },
  {
    id: "guide:money-card",
    filename: "covers/money-card.jpg",
    aspect: "3:2",
    prompt:
      "A weathered hand exchanging Indonesian rupiah notes at a tiny family-run shop counter, woven palm-leaf walls, a small offering of frangipani on a corner shelf, warm afternoon light, no faces visible",
  },
  {
    id: "guide:scooter-etiquette-card",
    filename: "covers/scooter-etiquette-card.jpg",
    aspect: "3:2",
    prompt:
      "A scooter parked at the edge of an Ubud back lane at sunset, a single helmet hung on the handlebar, palm fronds arching overhead, golden dust caught in a low shaft of light, no people",
  },

  // ─────────────────────────  INTENT  ─────────────────────────
  {
    id: "guide:finding-community-hero",
    filename: "covers/finding-community-hero.jpg",
    aspect: "16:9",
    prompt:
      "An open bamboo communal hall at dusk, twenty cushions arranged in a circle, a single tea tray at the centre, lanterns hanging from the rafters, the jungle a dark green silhouette behind",
  },
  {
    id: "guide:finding-community-card",
    filename: "covers/finding-community-card.jpg",
    aspect: "3:2",
    prompt:
      "A close-up of three porcelain cups arranged on a low wooden table, steam rising, candle in the background, two pairs of hands meeting in the gesture of pouring tea, warm intimate light",
  },
  {
    id: "guide:meeting-teacher-hero",
    filename: "covers/meeting-teacher-hero.jpg",
    aspect: "16:9",
    prompt:
      "A small temple courtyard in early morning mist, a low stone altar with frangipani offerings, a single oil lamp burning, light shafts cutting through the canopy, no people, hushed and devotional",
  },
  {
    id: "guide:meeting-teacher-card",
    filename: "covers/meeting-teacher-card.jpg",
    aspect: "3:2",
    prompt:
      "An open palm holding a single white frangipani, golden afternoon light through bamboo, the texture of the petal catching light, soft focus background of a temple wall",
  },
  {
    id: "guide:living-beautifully-hero",
    filename: "covers/living-beautifully-hero.jpg",
    aspect: "16:9",
    prompt:
      "A small open-fronted Ubud villa at golden hour, breakfast laid on a wooden table — papaya, dragonfruit, a small earthenware coffee pot — overlooking a stepped emerald rice valley, no people",
  },
  {
    id: "guide:living-beautifully-card",
    filename: "covers/living-beautifully-card.jpg",
    aspect: "3:2",
    prompt:
      "A simple linen-draped daybed on a verandah, a single book left open beside a clay water pitcher, soft warm afternoon light, palm shadows across the page, no people",
  },
  {
    id: "guide:local-culture-hero",
    filename: "covers/local-culture-hero.jpg",
    aspect: "16:9",
    prompt:
      "A young Balinese boy practicing a gamelan instrument in a bamboo pavilion at twilight, an older musician beside him, low warm light, focus on hands and instrument, faces obscured",
  },
  {
    id: "guide:local-culture-card",
    filename: "covers/local-culture-card.jpg",
    aspect: "3:2",
    prompt:
      "Hands arranging canang sari offerings on a moss-covered stone wall, marigolds and incense, focus on the offering, soft morning light, no faces",
  },
];

async function objectExists(path: string): Promise<boolean> {
  const dir = path.split("/").slice(0, -1).join("/");
  const file = path.split("/").pop()!;
  const { data } = await supabase.storage.from("images").list(dir, {
    limit: 1000,
    search: file,
  });
  return Boolean(data?.some((entry) => entry.name === file));
}

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
    .upload(path, buffer, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.replace("--only=", "") : null;
  const force = process.argv.includes("--force");

  const targets = only ? SPECS.filter((s) => s.id === only) : SPECS;
  console.log(`Phase-2 guide imagery — ${targets.length} target(s).\n`);

  for (const spec of targets) {
    const path = `guides/${spec.filename}`;
    process.stdout.write(`  ${spec.id} (${spec.aspect}) … `);

    if (!force && (await objectExists(path))) {
      console.log("SKIP (exists)");
      continue;
    }

    try {
      const url = await generateOne(spec);
      console.log("OK");
      console.log(`    ${url}`);
    } catch (err) {
      console.log(`FAIL — ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
