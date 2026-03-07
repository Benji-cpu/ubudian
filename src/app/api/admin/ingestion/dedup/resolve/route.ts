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

    // If confirmed duplicate, archive the newer event
    if (resolution === "confirmed_dup") {
      const supabase = createAdminClient();
      const { data: match } = await supabase
        .from("dedup_matches")
        .select("event_a_id, event_b_id")
        .eq("id", matchId)
        .single();

      if (match) {
        // Archive the event that was created later (event_b is typically newer)
        const { data: eventA } = await supabase
          .from("events")
          .select("created_at")
          .eq("id", match.event_a_id)
          .single();
        const { data: eventB } = await supabase
          .from("events")
          .select("created_at")
          .eq("id", match.event_b_id)
          .single();

        if (eventA && eventB) {
          const newerEventId =
            new Date(eventA.created_at) > new Date(eventB.created_at)
              ? match.event_a_id
              : match.event_b_id;

          await supabase
            .from("events")
            .update({ status: "archived" })
            .eq("id", newerEventId);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[dedup/resolve] Error:", err);
    return NextResponse.json({ error: "Failed to resolve match" }, { status: 500 });
  }
}
