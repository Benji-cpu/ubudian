import type { ArchetypeId, GuideIntent } from "@/types";

export interface IntentConfig {
  id: GuideIntent;
  label: string;
  blurb: string;
  imageUrl: string;
  archetypeAffinity: ArchetypeId[];
}

export const GUIDE_INTENTS: IntentConfig[] = [
  {
    id: "romance",
    label: "Romance & Intimacy",
    blurb: "The Eat-Pray-Love fantasy, honestly. What it actually takes.",
    imageUrl: "/images/guides/intents/romance.jpg",
    archetypeAffinity: ["connector", "epicurean"],
  },
  {
    id: "community",
    label: "Community & Belonging",
    blurb: "The rooms where Ubud actually meets itself.",
    imageUrl: "/images/guides/intents/community.jpg",
    archetypeAffinity: ["connector", "seeker"],
  },
  {
    id: "spirit",
    label: "Spirit & Practice",
    blurb: "Separating the real teachers from the costume.",
    imageUrl: "/images/guides/intents/spirit.jpg",
    archetypeAffinity: ["seeker"],
  },
  {
    id: "living",
    label: "Living Beautifully",
    blurb: "The long-stay arithmetic. Spaciousness without spend.",
    imageUrl: "/images/guides/intents/living.jpg",
    archetypeAffinity: ["epicurean", "creative"],
  },
  {
    id: "local_culture",
    label: "Local Culture, Honestly",
    blurb: "Beyond the cliché, into the relationships.",
    imageUrl: "/images/guides/intents/local-culture.jpg",
    archetypeAffinity: ["explorer", "seeker"],
  },
];

export function getIntentConfig(intent: GuideIntent): IntentConfig | null {
  return GUIDE_INTENTS.find((i) => i.id === intent) ?? null;
}

export function isGuideIntent(value: string): value is GuideIntent {
  return GUIDE_INTENTS.some((i) => i.id === value);
}
