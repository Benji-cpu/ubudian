import type { SponsorTier } from "@/types";

/**
 * Stripe Price IDs for each sponsorship tier — wired via env vars so the same
 * code path serves test mode (local) and live mode (prod) without source edits.
 *
 * Create these prices once in Stripe (live mode) and set:
 *   STRIPE_PRICE_SPONSOR_PATRON  = price_... ($75/mo recurring)
 *   STRIPE_PRICE_SPONSOR_PARTNER = price_... ($300/mo recurring)
 *   STRIPE_PRICE_SPONSOR_ANCHOR  = price_... ($750/mo recurring)
 */
export function getSponsorPriceId(tier: SponsorTier): string | null {
  switch (tier) {
    case "patron":
      return process.env.STRIPE_PRICE_SPONSOR_PATRON?.trim() || null;
    case "partner":
      return process.env.STRIPE_PRICE_SPONSOR_PARTNER?.trim() || null;
    case "anchor":
      return process.env.STRIPE_PRICE_SPONSOR_ANCHOR?.trim() || null;
  }
}

export const SPONSOR_TIER_PRICE_LABEL: Record<SponsorTier, string> = {
  patron: "$75/mo",
  partner: "$300/mo",
  anchor: "$750/mo",
};
