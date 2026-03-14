import { createClient } from "@/lib/supabase/server";
import type { Subscription } from "@/types";

/**
 * Get the active subscription for a user (Server Component helper).
 */
export async function getActiveSubscription(profileId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (data as Subscription) ?? null;
}

/**
 * Check if a user is an active Insider member.
 */
export async function isInsider(profileId: string): Promise<boolean> {
  const sub = await getActiveSubscription(profileId);
  return sub !== null;
}
