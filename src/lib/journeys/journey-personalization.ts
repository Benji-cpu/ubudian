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
import type { ArchetypeId, Journey } from "@/types";

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
