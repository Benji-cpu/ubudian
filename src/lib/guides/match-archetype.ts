import type { ArchetypeId, Guide, GuideIntent } from "@/types";
import { GUIDE_INTENTS } from "@/lib/guides/intents";

function intentsForArchetype(archetype: ArchetypeId): GuideIntent[] {
  return GUIDE_INTENTS.filter((intent) =>
    intent.archetypeAffinity.includes(archetype),
  ).map((intent) => intent.id);
}

/**
 * Two-tier match (mirrors getStoriesForArchetype / getEventsForArchetype):
 *   1. Explicit archetype_tags hits.
 *   2. Intent-affinity match (guide carries an intent that this archetype prefers).
 *   3. Backfill with remaining guides until we hit `limit`.
 */
export function getGuidesForArchetype(
  guides: Guide[],
  archetype: ArchetypeId,
  limit = 3,
): Guide[] {
  const preferredIntents = intentsForArchetype(archetype);

  const tagged = guides.filter((g) => g.archetype_tags?.includes(archetype));

  const intentMatch = guides.filter(
    (g) =>
      !tagged.includes(g) &&
      g.intent_tags?.some((tag) => preferredIntents.includes(tag)),
  );

  const combined = [...tagged, ...intentMatch];

  if (combined.length < limit) {
    const remaining = guides.filter((g) => !combined.includes(g));
    combined.push(...remaining.slice(0, limit - combined.length));
  }

  return combined.slice(0, limit);
}
