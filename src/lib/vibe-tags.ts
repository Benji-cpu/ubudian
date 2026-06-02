/**
 * Controlled "vibe" vocabulary — the finer, behind-the-scenes facet layer that
 * sits beneath the user-facing `category` / `intent_tags`. Derived from k-means
 * clustering of the event embedding corpus (scripts/cluster-events.ts), so the
 * facets reflect groupings that actually exist rather than a guessed taxonomy.
 *
 * Used three ways:
 *   1. The LLM parser tags new events with 0–4 of these at ingest.
 *   2. The backfill script tags the existing corpus.
 *   3. Similarity uses them as an explainable Jaccard tiebreaker on top of the
 *      embedding cosine ("more like this" leans on the vector; vibe overlap
 *      sharpens + explains it).
 *
 * Single source of truth — the parser schema, backfill, and ranking all import
 * VIBE_TAGS from here. Keep self-contained (no heavy deps) so a tsx script can
 * import it via relative path.
 */

export const VIBE_TAGS = [
  // movement & dance
  "ecstatic-dance",
  "5rhythms",
  "contact-improv",
  "conscious-movement",
  "partner-dance",
  // ceremony & sound
  "cacao-ceremony",
  "sound-bath",
  "kirtan-mantra",
  "breathwork",
  // tantra & energy
  "tantra",
  "kundalini-activation",
  // inner work & circles
  "shadow-work",
  "womens-circle",
  "mens-circle",
  "meditation-stillness",
  "energy-healing",
  // discovery tier
  "live-music",
  "art-exhibition",
  "food-gathering",
] as const;

export type VibeTag = (typeof VIBE_TAGS)[number];

/** Short definitions used in the LLM tagging prompt (parser + backfill). */
export const VIBE_TAG_DESCRIPTIONS: Record<VibeTag, string> = {
  "ecstatic-dance":
    "Freeform barefoot conscious dance, usually DJ-led, no talking, no alcohol — Dance Temple, ecstatic dance ceremonies.",
  "5rhythms":
    "5Rhythms wave practice (flowing/staccato/chaos/lyrical/stillness) and closely-related mapped conscious-dance forms.",
  "contact-improv":
    "Contact improvisation — weight-sharing, partnering, floorwork, somatic partner dance (Dissolve, Kinetic, Trinity).",
  "conscious-movement":
    "Somatic / freeform / authentic / movement-medicine practice not captured by the named dance forms above — solo improv, embodiment.",
  "partner-dance":
    "Social partner dance taught or danced as a couple — bachata, salsa, zouk, tango.",
  "cacao-ceremony":
    "Ceremonial cacao as the heart of the gathering — heart-opening, intention, often paired with sound or dance.",
  "sound-bath":
    "Gong baths, singing-bowl journeys, sound healing where participants lie and receive.",
  "kirtan-mantra":
    "Devotional chanting — kirtan, mantra, bhakti, call-and-response sacred song.",
  "breathwork":
    "Conscious connected breathing, holotropic-style journeys, or pranayama-led breath practice.",
  tantra:
    "Tantra, sacred sexuality, embodied intimacy, conscious-touch temples — couples or circle format.",
  "kundalini-activation":
    "Kundalini activation / energy-transmission sessions (KAP and similar).",
  "shadow-work":
    "Shadow, parts, or trauma-aware deep psychological work — standalone or held within dance/ceremony.",
  "womens-circle":
    "Women's circles, womb work, feminine-embodiment gatherings.",
  "mens-circle":
    "Men's circles, brotherhood, masculine-embodiment gatherings.",
  "meditation-stillness":
    "Seated meditation, silent sits, vipassana-style stillness practice.",
  "energy-healing":
    "Reiki, pranic healing, bodywork, or subtle-energy healing sessions.",
  "live-music":
    "Live music, concerts, jazz, or performance as the primary draw (discovery tier).",
  "art-exhibition":
    "Gallery openings, exhibitions, studio visits, artist talks (discovery tier).",
  "food-gathering":
    "Communal meals, supper clubs, food festivals, maker markets, foraging dinners (discovery tier).",
};
