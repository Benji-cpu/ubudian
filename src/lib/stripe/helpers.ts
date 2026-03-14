import { getStripe } from "./server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Get or create a Stripe customer for a given profile.
 * Stores `stripe_customer_id` on the profiles table.
 */
export async function getOrCreateStripeCustomer(
  profileId: string,
  email: string,
  name?: string | null
): Promise<string> {
  const supabase = createAdminClient();

  // Check if profile already has a Stripe customer
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", profileId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create new Stripe customer
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { profile_id: profileId },
  });

  // Store on profile
  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", profileId);

  return customer.id;
}

/**
 * Format cents as a display price string (e.g. 5500 → "$55.00")
 */
export function formatUsdPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Generate a human-readable booking reference like UBD-2026-ABC123
 */
export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for readability
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `UBD-${year}-${code}`;
}
