import type { ArchetypeId } from "@/types";

export interface StarterPack {
  /** 1-2 sentence framing for the sequence — explains why this order. */
  intro: string;
  /** Slugs in reading order (3 max). */
  slugs: string[];
}

/**
 * Hand-curated 2-3 guide reading orders, keyed by archetype. The point is
 * *sequence*, not just selection — first this, then this, then this. If a
 * starter-pack guide doesn't exist yet, the results page falls back to
 * archetype-matched recommendations.
 */
export const STARTER_PACKS: Record<ArchetypeId, StarterPack> = {
  seeker: {
    intro:
      "Start with the inner-work field, then community, then love. Spirit roots best when the room around it is real.",
    slugs: [
      "meeting-your-spiritual-teacher",
      "finding-community-without-an-algorithm",
      "falling-in-love-in-ubud",
    ],
  },
  explorer: {
    intro:
      "Get oriented in the place itself before the inner work. The deeper conversations land differently when you actually know whose home you're in.",
    slugs: [
      "local-culture-honestly",
      "living-beautifully-on-a-budget",
      "finding-community-without-an-algorithm",
    ],
  },
  creative: {
    intro:
      "Build the conditions first — a beautiful, slow, affordable life — then let the work and the people find you.",
    slugs: [
      "living-beautifully-on-a-budget",
      "local-culture-honestly",
      "finding-community-without-an-algorithm",
    ],
  },
  connector: {
    intro:
      "Romance, community, then the deeper work that makes either last. The order matters — connection without ground gets thin.",
    slugs: [
      "falling-in-love-in-ubud",
      "finding-community-without-an-algorithm",
      "meeting-your-spiritual-teacher",
    ],
  },
  epicurean: {
    intro:
      "The arithmetic of a beautiful life first. Then what happens at night and at the edges, once you're rested and curious.",
    slugs: [
      "living-beautifully-on-a-budget",
      "falling-in-love-in-ubud",
      "local-culture-honestly",
    ],
  },
};

export function getStarterPack(archetype: ArchetypeId): StarterPack {
  return STARTER_PACKS[archetype];
}
