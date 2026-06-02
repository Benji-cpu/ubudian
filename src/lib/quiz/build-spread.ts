import type { ArchetypeId, Event, Experience } from "@/types";
import { getEventsForArchetype, getExperiencesForArchetype } from "@/lib/quiz-helpers";

/**
 * The curated "custom spread" a quiz taker is handed: the events + experiences
 * picked for their archetype. Pure + reusable — the results page renders it
 * client-side and the submit route renders it into the email server-side, both
 * from the same definition so what they see matches what they're sent.
 *
 * Tag-based via quiz-helpers (archetype_tags is now populated, so Tier-1 matches
 * carry the weight; category fallback fills the rest).
 */
export interface Spread {
  events: Event[];
  experiences: Experience[];
}

export function buildSpread(
  primary: ArchetypeId,
  events: Event[],
  experiences: Experience[],
  opts: { eventLimit?: number; experienceLimit?: number } = {}
): Spread {
  return {
    events: getEventsForArchetype(events, primary, opts.eventLimit ?? 6),
    experiences: getExperiencesForArchetype(experiences, primary, opts.experienceLimit ?? 3),
  };
}
