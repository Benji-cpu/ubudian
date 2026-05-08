import type { GuideIntent } from "@/types";

/**
 * v1 mapping: each intent maps to its single most-relevant existing event
 * category (events filter takes one category at a time). When events get
 * native intent_tags (Phase 2), this mapping retires.
 */
export const INTENT_TO_PRIMARY_CATEGORY: Record<GuideIntent, string> = {
  romance: "Tantra & Intimacy",
  community: "Circle & Community",
  spirit: "Ceremony & Sound",
  living: "Yoga & Meditation",
  local_culture: "Art & Culture",
};

export function eventLinkForIntent(intent: GuideIntent): string {
  return `/events?category=${encodeURIComponent(INTENT_TO_PRIMARY_CATEGORY[intent])}`;
}
