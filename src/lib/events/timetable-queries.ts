import { createAdminClient } from "@/lib/supabase/admin";
import { queryWithRetry } from "@/lib/supabase/retry";
import { cachedRead, CACHE_TAGS } from "@/lib/cached-read";
import { nowInBali } from "./bali-time";
import { visibleListings } from "./listing-checks";
import type { Event } from "@/types";

/**
 * What a public listing page may carry. Not `select("*")`: that ships the
 * 768-float `embedding` and the submitter's private email with every row, and
 * the quiz hands these rows to a client component.
 */
export const PUBLIC_EVENT_COLUMNS =
  "id, title, slug, short_description, cover_image_url, category, venue_name, venue_address, venue_map_url, start_date, end_date, start_time, end_time, is_recurring, recurrence_rule, price_info, external_ticket_url, organizer_name, organizer_contact, organizer_instagram, source_url, status, archetype_tags, intent_tags, latitude, longitude, moderation_reason, is_core, event_tier, is_spotlight, created_at, updated_at";

/**
 * Every public listing that could be on from today: the same read as /events
 * and the homepage (approved, then the gate's rules at read time). It never
 * filters `start_date >= today` alone, which would drop every weekly rhythm.
 */
export async function getPublicListings(): Promise<Event[]> {
  try {
    return visibleListings(await readPublicListingRows(nowInBali().dateStr));
  } catch (err) {
    console.error("getPublicListings:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * The database read behind getPublicListings, cached for 15 minutes per Bali
 * date. The calendar changes once a night, so this is one read every 15
 * minutes however many pages and crawlers ask. Throws on error (never cached).
 */
const readPublicListingRows = cachedRead(
  async (today: string): Promise<Event[]> => {
    const supabase = createAdminClient();
    const { data, error } = await queryWithRetry(
      () =>
        supabase
          .from("events")
          .select(PUBLIC_EVENT_COLUMNS)
          .eq("status", "approved")
          .or(`start_date.gte.${today},is_recurring.eq.true,end_date.gte.${today}`),
      "public-listings"
    );
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Event[];
  },
  "public-listings-v1",
  { seconds: 900, tag: CACHE_TAGS.events }
);

/** When the newest ingest run finished, for the "Checked … Bali time" line. Null hides the line. */
export async function getLastIngestAt(): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .from("ingestion_runs")
    .select("completed_at")
    .eq("status", "completed")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("getLastIngestAt:", error.message);
    return null;
  }
  return (data as { completed_at: string } | null)?.completed_at ?? null;
}
