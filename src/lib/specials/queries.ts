import { createAdminClient } from "@/lib/supabase/admin";
import { nowInBali } from "@/lib/events/bali-time";
import type { Special } from "@/types";
import { PUBLIC_SPECIAL_COLUMNS } from "./index";

/**
 * Every special a visitor may see: status `live` and not past `expires_on`
 * (Bali date). Read with the admin client but only the public columns, so
 * the private contact fields never reach a page.
 */
export async function getLiveSpecials(): Promise<Special[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("specials")
    .select(PUBLIC_SPECIAL_COLUMNS)
    .eq("status", "live")
    .gte("expires_on", nowInBali().dateStr)
    .order("venue_name");
  if (error) {
    console.error("getLiveSpecials:", error.message);
    return [];
  }
  return (data ?? []) as Special[];
}
