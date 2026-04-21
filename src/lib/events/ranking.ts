/**
 * Blended ranking for events.
 *
 * Pure, side-effect-free scoring: given an event and some context, return
 * a number where higher = more prominent. Used to order the agenda feed,
 * pick the hero, and populate the For You rail.
 *
 * Inputs: start_date (sooner scores higher within a sensible window),
 * quality_score (LLM-assessed completeness + clarity), save_count
 * (community signal), archetype match (personalization).
 */

import type { ArchetypeId, Event } from "@/types";

export interface RankingContext {
  /** Reference "now" for time-decay math. Defaults to Date.now(). */
  now?: Date;
  /** Viewer's archetype IDs from quiz result. */
  viewerArchetypes?: ArchetypeId[];
  /** Optional save_count lookup when events carry it as a separate field. */
  saveCountByEventId?: Map<string, number>;
}

export interface ScoredEvent<T extends Event = Event> {
  event: T;
  score: number;
  components: {
    time: number;
    quality: number;
    popularity: number;
    personalization: number;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Time component: peaks for events happening in the next 0–3 days,
 * declines gradually out to ~21 days, and is near zero for distant
 * or long-past events. Past events in the last day still carry a
 * small signal so "happening now" isn't zeroed.
 *
 * Comparison is done at day granularity so an event whose start_date
 * is today scores as "today" regardless of the time of day.
 */
export function timeComponent(startDate: string, now = new Date()): number {
  // Parse YYYY-MM-DD as a local calendar date, not UTC midnight.
  const [y, m, d] = startDate.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const startMidnight = new Date(y, m - 1, d).getTime();

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const daysOut = Math.round((startMidnight - todayMidnight) / DAY_MS);

  // Already past (full day in the past): tiny if yesterday, zero otherwise.
  if (daysOut < -1) return 0;
  if (daysOut === -1) return 0.5;

  // Sweet spot 0–3 days: near 1.0.
  if (daysOut <= 3) return 1.0 - daysOut * 0.03;

  // Smooth decline: 1/(1 + (daysOut - 3)/7). At 10 days ~ 0.5, at 21 days ~ 0.28.
  return 1 / (1 + (daysOut - 3) / 7);
}

export function popularityComponent(saveCount: number): number {
  if (!Number.isFinite(saveCount) || saveCount <= 0) return 0;
  return Math.log10(1 + saveCount);
}

export function personalizationComponent(
  eventArchetypes: ArchetypeId[] | null | undefined,
  viewerArchetypes: ArchetypeId[] | undefined
): number {
  if (!viewerArchetypes || viewerArchetypes.length === 0) return 0;
  if (!eventArchetypes || eventArchetypes.length === 0) return 0;
  const viewerSet = new Set(viewerArchetypes);
  let overlap = 0;
  for (const tag of eventArchetypes) {
    if (viewerSet.has(tag)) overlap++;
  }
  if (overlap === 0) return 0;
  return Math.min(1, overlap / viewerArchetypes.length);
}

export function scoreEvent<T extends Event & { save_count?: number }>(
  event: T,
  ctx: RankingContext = {}
): ScoredEvent<T> {
  const now = ctx.now ?? new Date();

  const time = timeComponent(event.start_date, now);
  const quality = typeof event.quality_score === "number" ? clamp01(event.quality_score) : 0.5;
  const saveCount =
    ctx.saveCountByEventId?.get(event.id) ??
    (typeof event.save_count === "number" ? event.save_count : 0);
  const popularity = popularityComponent(saveCount);
  const personalization = personalizationComponent(event.archetype_tags, ctx.viewerArchetypes);

  const score =
    time + // 0–1
    0.8 * quality + // 0–0.8
    0.6 * popularity + // ~0–1.5 in practice
    1.2 * personalization; // 0–1.2

  return {
    event,
    score,
    components: { time, quality, popularity, personalization },
  };
}

export function rankEvents<T extends Event & { save_count?: number }>(
  events: T[],
  ctx: RankingContext = {}
): ScoredEvent<T>[] {
  return events
    .map((e) => scoreEvent(e, ctx))
    .sort((a, b) => b.score - a.score);
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
