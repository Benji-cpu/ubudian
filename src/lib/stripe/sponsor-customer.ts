import { getStripe } from "./server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Sponsor } from "@/types";

/**
 * Get or create a Stripe customer for a sponsor and persist the id on the
 * sponsor row. Sponsor customers live alongside profile customers in Stripe;
 * we distinguish them via `metadata.sponsor_id`.
 */
export async function getOrCreateSponsorCustomer(sponsor: Sponsor): Promise<string> {
  if (sponsor.stripe_customer_id) return sponsor.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: sponsor.contact_email ?? undefined,
    name: sponsor.name,
    metadata: { sponsor_id: sponsor.id, kind: "sponsor" },
  });

  const supabase = createAdminClient();
  await supabase
    .from("sponsors")
    .update({ stripe_customer_id: customer.id, updated_at: new Date().toISOString() })
    .eq("id", sponsor.id);

  return customer.id;
}
