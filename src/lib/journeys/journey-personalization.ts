/**
 * Journey personalization — given a user's quiz result (primary + secondary
 * archetype), rank a list of journeys by how well they match.
 *
 * Logic: a journey scores 2 points for primary archetype overlap and 1 point
 * for secondary. Ties broken by `sort_order` (admin-set), then `updated_at`
 * desc (freshness).
 *
 * Used by:
 *   - `/experiences` (logged-in personalised ordering above the Quiz CTA)
 *   - `/dashboard/journey` (Milestone 2 — "your journey" suggestion)
 *
 * If the user has no quiz result, returns the journeys in admin sort_order.
 */
import type { ArchetypeId, Journey, JourneyAtom } from "@/types";

export interface UserArchetypeContext {
  primary: ArchetypeId | null;
  secondary?: ArchetypeId | null;
}

/**
 * Stable rank — does NOT mutate input. Returns a new array.
 */
export function rankJourneysByArchetype(
  journeys: Journey[],
  ctx: UserArchetypeContext,
): Journey[] {
  if (!ctx.primary) {
    return [...journeys].sort(byAdminOrder);
  }

  const primary = ctx.primary;
  const secondary = ctx.secondary ?? null;

  const scored = journeys.map((j) => {
    const tags = j.archetype_tags ?? [];
    let score = 0;
    if (tags.includes(primary)) score += 2;
    if (secondary && tags.includes(secondary)) score += 1;
    return { journey: j, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return byAdminOrder(a.journey, b.journey);
  });

  return scored.map((s) => s.journey);
}

function byAdminOrder(a: Journey, b: Journey): number {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return b.updated_at.localeCompare(a.updated_at);
}

/**
 * Rank atoms within a slot by archetype overlap with the user's quiz result.
 * Stable — does NOT mutate input.
 *
 * Scoring mirrors `rankJourneysByArchetype`: 2 for primary tag overlap, 1
 * for secondary. Ties keep slot-resolver order (already ranked by theme-tag
 * overlap × recency). Anonymous users (no `primary`) get the input unchanged.
 */
export function rankAtomsForUser(
  atoms: JourneyAtom[],
  ctx: UserArchetypeContext,
): JourneyAtom[] {
  if (!ctx.primary || atoms.length <= 1) return atoms;
  const primary = ctx.primary;
  const secondary = ctx.secondary ?? null;
  // Preserve input order for ties via index-stable sort.
  return atoms
    .map((atom, index) => {
      const tags = atom.archetype_tags ?? [];
      let score = 0;
      if (tags.includes(primary)) score += 2;
      if (secondary && tags.includes(secondary)) score += 1;
      return { atom, score, index };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    })
    .map((s) => s.atom);
}
