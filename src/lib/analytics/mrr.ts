import { MEMBERSHIP_MONTHLY_CENTS, MEMBERSHIP_YEARLY_CENTS } from "@/lib/constants";

/**
 * Estimate monthly recurring revenue (in cents) from active-subscription
 * counts per billing interval.
 *
 * `subscriptions` has no amount column, so this is derived from the count of
 * active subs and the known Insider prices. Yearly subs are normalised to a
 * monthly figure (annual price ÷ 12). The result is an ESTIMATE — surface it
 * labelled as such, not as a Stripe-authoritative number.
 */
export function estimateMrrCents({
  monthly,
  yearly,
}: {
  monthly: number;
  yearly: number;
}): number {
  const monthlyPart = monthly * MEMBERSHIP_MONTHLY_CENTS;
  const yearlyPart = yearly * Math.round(MEMBERSHIP_YEARLY_CENTS / 12);
  return monthlyPart + yearlyPart;
}

/** Format a cents amount as a whole-dollar / two-decimal USD string. */
export function formatUsd(cents: number, { decimals = true }: { decimals?: boolean } = {}): string {
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
}
