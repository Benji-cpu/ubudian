/**
 * Phase 3: brand-locked imagery for the new public detail pages —
 * practitioners (4), places (3), partners (2). Mirrors the Phase-2
 * style-lock (painterly cinematic, deep-green/gold palette, Aman aesthetic).
 *
 * Practitioner heroes are deliberately symbolic still-lifes — drum, copper
 * bowl, hands in light, TCM herbs — NEVER fabricated faces. The four seeded
 * practitioners are real humans; their actual portraits go in via the admin
 * once consented.
 *
 * Run:  npx tsx scripts/generate-phase3-atom-images.ts
 *       npx tsx scripts/generate-phase3-atom-images.ts --only=practitioner:made-nawa-pranic-healing
 *
 * Idempotent: re-runs skip slots whose storage object already exists.
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

type Aspect = "16:9" | "1:1" | "4:5" | "3:2" | "9:16" | "3:4" | "4:3";

interface Spec {
  id: string;
  table: "practitioners" | "places" | "partners";
  slug: string;
  column: "hero_image_url" | "photo_url";
  filename: string;
  prompt: string;
  aspect: Aspect;
}

const SPECS: Spec[] = [
  // ─────────────────────────  PRACTITIONERS  ─────────────────────────
  // 3:4 portrait crop. Symbolic still-lifes only — never faces.
  {
    id: "practitioner:krishna-pyramids-of-chi",
    table: "practitioners",
    slug: "krishna-pyramids-of-chi",
    column: "hero_image_url",
    filename: "practitioners/krishna-hero.jpg",
    aspect: "3:4",
    prompt:
      "A single ceremonial frame drum resting on a folded silk cloth beside a tall hand-stretched candle, soft amber light, deep shadows, the polished wooden floor of a pyramid breathwork space, no people, contemplative stillness",
  },
  {
    id: "practitioner:nina-pyramids-of-chi",
    table: "practitioners",
    slug: "nina-pyramids-of-chi",
    column: "hero_image_url",
    filename: "practitioners/nina-hero.jpg",
    aspect: "3:4",
    prompt:
      "Two opened palms cupping golden afternoon light, viewed from above, on a linen massage cloth folded with intention, a faint thread of incense smoke rising in the background, gentle and reverent, no faces",
  },
  {
    id: "practitioner:ketut-arsana-ubud-bodyworks",
    table: "practitioners",
    slug: "ketut-arsana-ubud-bodyworks",
    column: "hero_image_url",
    filename: "practitioners/ketut-arsana-hero.jpg",
    aspect: "3:4",
    prompt:
      "A small worn copper bowl of warm coconut oil and a clutch of folded healing herbs on a teak shelf beside a faded photograph of a Balinese ancestor, soft window light, slow afternoon, no people",
  },
  {
    id: "practitioner:made-nawa-pranic-healing",
    table: "practitioners",
    slug: "made-nawa-pranic-healing",
    column: "hero_image_url",
    filename: "practitioners/made-nawa-hero.jpg",
    aspect: "3:4",
    prompt:
      "A neat arrangement of dried Chinese medicinal herbs, a small porcelain teapot, and a single quartz crystal on dark slate, low contemplative light, traditional and clinical at once, no faces",
  },

  // ─────────────────────────  PLACES  ─────────────────────────
  // 16:9 wide hero for detail page hero band.
  {
    id: "place:pura-saraswati",
    table: "places",
    slug: "pura-saraswati",
    column: "hero_image_url",
    filename: "places/pura-saraswati-hero.jpg",
    aspect: "16:9",
    prompt:
      "The lotus ponds of Pura Saraswati temple in Ubud at golden hour, the temple gate behind framed by frangipani, pink lotus flowers in soft focus in the foreground, no people, devotional stillness",
  },
  {
    id: "place:yellow-flower-cafe",
    table: "places",
    slug: "yellow-flower-cafe",
    column: "hero_image_url",
    filename: "places/yellow-flower-hero.jpg",
    aspect: "16:9",
    prompt:
      "A wooden balcony café table looking out over Ubud rice paddies, half a teapot and a single book left open, golden late-afternoon light, jungle valley beyond, no people, contemplative",
  },
  {
    id: "place:paradiso-ubud",
    table: "places",
    slug: "paradiso-ubud",
    column: "hero_image_url",
    filename: "places/paradiso-hero.jpg",
    aspect: "16:9",
    prompt:
      "The empty sprung-floor dance studio at Paradiso Ubud just after a class — sunlight breaking through palm shadows on polished wood, scattered shoes near the door, a stack of cushions in the corner, no people, the breath after movement",
  },

  // ─────────────────────────  PARTNERS  ─────────────────────────
  // 4:3 commercial-but-editorial hero.
  {
    id: "partner:villa-ametis",
    table: "partners",
    slug: "villa-ametis",
    column: "hero_image_url",
    filename: "partners/villa-ametis-hero.jpg",
    aspect: "4:3",
    prompt:
      "A three-bedroom Sayan ridge villa's open-air bath and pool deck overlooking jungle ricefields at dawn, mist on the valley floor, two fresh frangipani on the bath ledge, no people, unhurried luxury",
  },
  {
    id: "partner:lineage-bodywork",
    table: "partners",
    slug: "lineage-bodywork",
    column: "hero_image_url",
    filename: "partners/lineage-bodywork-hero.jpg",
    aspect: "4:3",
    prompt:
      "A traditional Balinese bodywork room with a low wooden massage bench, hand-woven linen draped over it, a brass bowl of warm oil and a single white frangipani beside it, dappled light through bamboo shutters, no people",
  },
];

interface RunOptions {
  only?: string;
}

function parseArgs(): RunOptions {
  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith("--only="));
  return { only: onlyArg ? onlyArg.split("=")[1] : undefined };
}

async function generateForSpec(spec: Spec) {
  const prompt = `${spec.prompt}. ${STYLE_LOCK}`;
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("aspect_ratio", spec.aspect);
  form.append("output_format", "jpeg");

  const res = await fetch(STABILITY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STABILITY_AI_API_KEY!}`,
      Accept: "image/*",
    },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Stability ${spec.id}: ${res.status} ${await res.text()}`);
  }

  const arrayBuf = await res.arrayBuffer();
  const buf = new Uint8Array(arrayBuf);

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(spec.filename, buf, {
      contentType: "image/jpeg",
      upsert: false,
    });
  if (uploadError) {
    throw new Error(`Upload ${spec.filename}: ${uploadError.message}`);
  }

  const { data: pub } = supabase.storage.from("images").getPublicUrl(spec.filename);
  const publicUrl = pub.publicUrl;

  const { error: updateError } = await supabase
    .from(spec.table)
    .update({ [spec.column]: publicUrl })
    .eq("slug", spec.slug);
  if (updateError) {
    throw new Error(`Row update ${spec.id}: ${updateError.message}`);
  }

  console.log(`✓ ${spec.id} → ${publicUrl}`);
}

async function objectExists(filename: string): Promise<boolean> {
  const { data } = await supabase.storage
    .from("images")
    .list(filename.split("/").slice(0, -1).join("/"), {
      search: filename.split("/").pop(),
    });
  return Boolean(data && data.length > 0);
}

async function main() {
  if (!process.env.STABILITY_AI_API_KEY) {
    throw new Error("STABILITY_AI_API_KEY not set in .env.local");
  }
  const { only } = parseArgs();
  const queue = only ? SPECS.filter((s) => s.id === only) : SPECS;

  if (queue.length === 0) {
    console.log(`No specs matched ${only ? `--only=${only}` : ""}`);
    return;
  }

  for (const spec of queue) {
    const exists = await objectExists(spec.filename);
    if (exists) {
      console.log(`· ${spec.id} skipped (already in storage)`);
      continue;
    }
    try {
      await generateForSpec(spec);
    } catch (err) {
      console.error(`✗ ${spec.id}: ${(err as Error).message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
