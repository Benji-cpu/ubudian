/**
 * POST /api/admin/ingestion/dedup/resolve
 *
 * Resolve a dedup match as confirmed duplicate, not duplicate, or merged.
 * Admin-only.
 *
 * Body: { matchId: string, resolution: "confirmed_dup" | "not_dup" | "merged" }
 */

import { NextResponse } from "next/server";
import { isAdmin, getCurrentProfile } from "@/lib/auth";
import { resolveMatch } from "@/lib/ingestion";
import { createAdminClient } from "@/lib/supabase/admin";

// Fields copied from newer → older during merge, but only when the older event
// has no value for that field. Keeps the stable (older) event ID while pulling
// in any richer data the re-posted version captured.
const MERGE_FIELDS = [
  "cover_image_url",
  "description",
  "short_description",
  "venue_address",
  "venue_map_url",
  "organizer_name",
  "organizer_contact",
  "organizer_instagram",
  "external_ticket_url",
  "price_info",
  "end_date",
  "end_time",
  "latitude",
  "longitude",
] as const;

type EventRow = Record<string, unknown> & { id: string; created_at: string };

function pickNewerAndOlder(a: EventRow, b: EventRow): { older: EventRow; newer: EventRow } {
  return new Date(a.created_at) <= new Date(b.created_at)
    ? { older: a, newer: b }
    : { older: b, newer: a };
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { matchId, resolution } = await request.json();

    if (!matchId || !["confirmed_dup", "not_dup", "merged"].includes(resolution)) {
      return NextResponse.json(
        { error: "matchId and valid resolution are required" },
        { status: 400 }
      );
    }

    const profile = await getCurrentProfile();
    const resolvedBy = profile?.id || "unknown";

    await resolveMatch(matchId, resolution, resolvedBy);

    if (resolution === "confirmed_dup" || resolution === "merged") {
      const supabase = createAdminClient();
      const { data: match } = await supabase
        .from("dedup_matches")
        .select("event_a_id, event_b_id")
        .eq("id", matchId)
        .single();

      if (match) {
        const selectCols =
          resolution === "merged"
            ? `id, created_at, ${MERGE_FIELDS.join(", ")}`
            : "id, created_at";

        const { data: eventA } = await supabase
          .from("events")
          .select(selectCols)
          .eq("id", match.event_a_id)
          .single<EventRow>();
        const { data: eventB } = await supabase
          .from("events")
          .select(selectCols)
          .eq("id", match.event_b_id)
          .single<EventRow>();

        if (eventA && eventB) {
          const { older, newer } = pickNewerAndOlder(eventA, eventB);

          if (resolution === "merged") {
            const updates: Record<string, unknown> = {};
            for (const field of MERGE_FIELDS) {
              if (isEmpty(older[field]) && !isEmpty(newer[field])) {
                updates[field] = newer[field];
              }
            }
            if (Object.keys(updates).length > 0) {
              await supabase.from("events").update(updates).eq("id", older.id);
            }
          }

          await supabase.from("events").update({ status: "archived" }).eq("id", newer.id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[dedup/resolve] Error:", err);
    return NextResponse.json({ error: "Failed to resolve match" }, { status: 500 });
  }
}
