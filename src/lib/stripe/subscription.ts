import { createClient } from "@/lib/supabase/server";
import type { Subscription } from "@/types";

// Stripe statuses that count as "paid up".
const ACTIVE_STATUSES = ["active", "trialing"] as const;

// Review statuses that grant access. 'pending_review' (Indonesian-card hold) and
// 'rejected' do NOT grant access — even though Stripe says the sub is active.
const ACCESS_GRANTED_REVIEW = ["auto_approved", "approved"] as const;

/**
 * Get the active + access-granted subscription for a user (Server Component helper).
 * Returns null for subs that are stuck in pending_review or were rejected.
 */
export async function getActiveSubscription(profileId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .in("status", ACTIVE_STATUSES as unknown as string[])
    .in("review_status", ACCESS_GRANTED_REVIEW as unknown as string[])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (data as Subscription) ?? null;
}

/**
 * Returns the most recent subscription regardless of review_status — used by the
 * member dashboard to show the "we're verifying your payment" banner when a sub
 * is in pending_review. NEVER use this for access checks.
 */
export async function getAnySubscription(profileId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as Subscription) ?? null;
}

/**
 * Check if a user is an active Insider member with access granted.
 * This is the single security choke point for gated content.
 */
export async function isInsider(profileId: string): Promise<boolean> {
  const sub = await getActiveSubscription(profileId);
  return sub !== null;
}
