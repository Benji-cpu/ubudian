import type { GuideIntent } from "@/types";

/**
 * Phase 2: events carry native intent_tags. The "live events for [intent]"
 * tail CTA on intent guides links to /events?intents=<id> directly.
 *
 * The category mapping below is kept only as documentation of the conservative
 * backfill that ran in `20260509100000_event_intent_tags.sql` so editors know
 * what was auto-tagged vs left for manual decision.
 */
export const INTENT_TO_BACKFILLED_CATEGORY: Record<GuideIntent, string | null> = {
  romance: "Tantra & Intimacy",
  community: "Circle & Community",
  spirit: "Ceremony & Sound",
  living: null, // Yoga & Meditation overlaps too many intents — left manual
  local_culture: "Art & Culture",
};

export function eventLinkForIntent(intent: GuideIntent): string {
  return `/events?intents=${intent}`;
}
