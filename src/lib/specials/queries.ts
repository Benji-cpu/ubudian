import { createAdminClient } from "@/lib/supabase/admin";
import { nowInBali } from "@/lib/events/bali-time";
import type { Special } from "@/types";
import { PUBLIC_SPECIAL_COLUMNS } from "./index";
import { cachedRead, CACHE_TAGS } from "@/lib/cached-read";

/**
 * Every special a visitor may see: status `live` and not past `expires_on`
 * (Bali date). Read with the admin client but only the public columns, so
 * the private contact fields never reach a page.
 */
export async function getLiveSpecials(): Promise<Special[]> {
  return (await readLiveSpecials()) ?? [];
}

/** The same read, but null when it fails, for a count that must not show a false 0 (/for-venues). */
export async function readLiveSpecials(): Promise<Special[] | null> {
  try {
    return await readLiveSpecialRows(nowInBali().dateStr);
  } catch (err) {
    console.error("getLiveSpecials:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * The database read, cached for 5 minutes per Bali date: a newly listed deal
 * shows within 5 minutes. Throws on error (never cached).
 */
const readLiveSpecialRows = cachedRead(
  async (today: string): Promise<Special[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("specials")
      .select(PUBLIC_SPECIAL_COLUMNS)
      .eq("status", "live")
      .gte("expires_on", today)
      .order("venue_name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Special[];
  },
  "live-specials-v1",
  { seconds: 300, tag: CACHE_TAGS.specials }
);
