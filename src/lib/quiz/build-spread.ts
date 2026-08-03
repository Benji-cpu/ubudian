import type { ArchetypeId, Event } from "@/types";
import { getEventsForArchetype } from "@/lib/quiz-helpers";

/**
 * The curated "custom spread" a quiz taker is handed: the events picked for
 * their archetype. Pure + reusable — the results page renders it client-side
 * and the submit route renders it into the email server-side, both from the
 * same definition so what they see matches what they're sent.
 *
 * Tag-based via quiz-helpers (archetype_tags is now populated, so Tier-1 matches
 * carry the weight; category fallback fills the rest).
 *
 * This also carried an `experiences` list. That table was superseded by
 * `journeys` when /experiences/[slug] was repointed, and it was never migrated
 * — so the spread was building links into a route that no longer served that
 * table, including in the outbound email.
 */
export interface Spread {
  events: Event[];
}

export function buildSpread(
  primary: ArchetypeId,
  events: Event[],
  opts: { eventLimit?: number } = {}
): Spread {
  return {
    events: getEventsForArchetype(events, primary, opts.eventLimit ?? 6),
  };
}
