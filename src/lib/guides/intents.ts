import type { ArchetypeId, GuideIntent } from "@/types";

export interface IntentConfig {
  id: GuideIntent;
  label: string;
  blurb: string;
  imageUrl: string;
  archetypeAffinity: ArchetypeId[];
}

const STORAGE_BASE =
  "https://vzooblnkztbjgfbdfzxl.supabase.co/storage/v1/object/public/images/guides";

export const GUIDE_INTENTS: IntentConfig[] = [
  {
    id: "romance",
    label: "Romance & Intimacy",
    blurb: "The Eat-Pray-Love fantasy, honestly. What it actually takes.",
    imageUrl: `${STORAGE_BASE}/intents/romance.jpg`,
    archetypeAffinity: ["connector", "epicurean"],
  },
  {
    id: "community",
    label: "Community & Belonging",
    blurb: "The rooms where Ubud actually meets itself.",
    imageUrl: `${STORAGE_BASE}/intents/community.jpg`,
    archetypeAffinity: ["connector", "seeker"],
  },
  {
    id: "spirit",
    label: "Spirit & Practice",
    blurb: "Separating the real teachers from the costume.",
    imageUrl: `${STORAGE_BASE}/intents/spirit.jpg`,
    archetypeAffinity: ["seeker"],
  },
  {
    id: "living",
    label: "Living Beautifully",
    blurb: "The long-stay arithmetic. Spaciousness without spend.",
    imageUrl: `${STORAGE_BASE}/intents/living.jpg`,
    archetypeAffinity: ["epicurean", "creative"],
  },
  {
    id: "local_culture",
    label: "Local Culture, Honestly",
    blurb: "Beyond the cliché, into the relationships.",
    imageUrl: `${STORAGE_BASE}/intents/local-culture.jpg`,
    archetypeAffinity: ["explorer", "seeker"],
  },
];

export function getIntentConfig(intent: GuideIntent): IntentConfig | null {
  return GUIDE_INTENTS.find((i) => i.id === intent) ?? null;
}

export function isGuideIntent(value: string): value is GuideIntent {
  return GUIDE_INTENTS.some((i) => i.id === value);
}
