/**
 * POST /api/cron/events-bus/picks — the routine's picks for a Wed–Tue week.
 * Every event must be approved and fall inside the week (recurring ones by
 * their next date); otherwise the whole set is refused, so a bad id can't
 * quietly shrink the list. Replaces any earlier picks for that week.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEventsBusAuthorised } from "@/lib/events-bus/auth";
import { busPicksSchema } from "@/lib/events-bus/schema";
import { addDays, weekStartFor } from "@/lib/events/picks";
import { rolledForward } from "@/lib/events/buckets";
import { visibleListings } from "@/lib/events/listing-checks";
import type { Event } from "@/types";

export async function POST(request: Request) {
  if (!isEventsBusAuthorised(request.headers.get("authorization"))) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  let body: z.infer<typeof busPicksSchema>;
  try {
    body = busPicksSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ data: null, error: "Invalid picks body" }, { status: 400 });
  }
  if (weekStartFor(body.week_start) !== body.week_start) {
    return NextResponse.json({ data: null, error: "week_start must be a Wednesday" }, { status: 400 });
  }
  const ids = [...new Set(body.picks.map((p) => p.event_id))];
  if (ids.length !== body.picks.length) {
    return NextResponse.json({ data: null, error: "duplicate event_id" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("events").select("*").in("id", ids).eq("status", "approved");
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });

  const weekEnd = addDays(body.week_start, 6);
  const rows = (data ?? []) as Event[];
  const live = new Set(visibleListings(rows).map((e) => e.id));
  // Roll recurring rows to their next date on or after the week's first day.
  const asOf = new Date(`${body.week_start}T04:00:00Z`);
  const inWeek = new Set(
    rolledForward(rows, asOf)
      .filter((e) => live.has(e.id) && e.start_date <= weekEnd && (e.end_date ?? e.start_date) >= body.week_start)
      .map((e) => e.id),
  );
  const bad = ids.filter((id) => !inWeek.has(id));
  if (bad.length) {
    return NextResponse.json({ data: null, error: `not live in that week: ${bad.join(", ")}` }, { status: 422 });
  }

  const { error: delError } = await supabase.from("event_picks").delete().eq("week_start", body.week_start);
  if (delError) return NextResponse.json({ data: null, error: delError.message }, { status: 500 });
  const { error: insError } = await supabase.from("event_picks").insert(
    body.picks.map((p, i) => ({ week_start: body.week_start, event_id: p.event_id, rank: i + 1, why: p.why })),
  );
  if (insError) return NextResponse.json({ data: null, error: insError.message }, { status: 500 });

  return NextResponse.json({ data: { week_start: body.week_start, picks: body.picks.length }, error: null });
}
