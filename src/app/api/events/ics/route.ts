/**
 * GET /api/events/ics?token=<ics_token>
 *
 * Returns the authenticated profile's saved upcoming events as a subscribable
 * ICS feed. The token is the per-user `profiles.ics_token` value; we look it
 * up via the service-role client to bypass RLS (cross-user read by design —
 * the token itself is the capability).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildICS } from "@/lib/events/ics";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import type { Event } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("ics_token", token)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: saved, error: savedError } = await supabase
    .from("saved_events")
    .select("event:events(*)")
    .eq("profile_id", profile.id);

  if (savedError) {
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }

  const events = ((saved ?? [])
    .map((row) => (row as unknown as { event: Event | null }).event)
    .filter((e): e is Event => !!e && e.status === "approved" && e.start_date >= today)
    .sort((a, b) => {
      if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
      return (a.start_time ?? "").localeCompare(b.start_time ?? "");
    })) as Event[];

  const ics = buildICS(events, {
    calendarName: `${SITE_NAME} — My Agenda`,
    calendarUrl: SITE_URL,
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="ubudian-events.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
