/**
 * GET /api/cron/events-bus/export — what the events-desk routine needs to know
 * about the site, fetched by the bus repo's fetch Action into `in/DATE/site.json`
 * (the routine itself can't reach this host).
 *
 *   upcoming        approved + pending events in the next 60 days (dedup list)
 *   weekCandidates  live events this Wed–Tue week, for the picks
 *   signals30       reader taps and ticket clicks per event, last 30 days
 *   picksHistory    the last 6 weeks of picks with their signals
 *   supply30        what was on in the last 30 days, by category and venue
 *   sourceYield30   events created and published per source, last 30 days
 *   suggestions     handles and links readers suggested (new ones; free text
 *                   never leaves the site)
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEventsBusAuthorised } from "@/lib/events-bus/auth";
import { nowInBali } from "@/lib/events/bali-time";
import { rolledForward } from "@/lib/events/buckets";
import { visibleListings } from "@/lib/events/listing-checks";
import { addDays, weekStartFor } from "@/lib/events/picks";
import type { Event } from "@/types";

export const maxDuration = 60;

const host = (u: string | null) => {
  try {
    return u ? new URL(u).hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
};

export async function GET(request: Request) {
  if (!isEventsBusAuthorised(request.headers.get("authorization"))) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const today = nowInBali().dateStr;
  const in60 = addDays(today, 60);
  const ago30 = addDays(today, -30);
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const weekStart = weekStartFor(today);
  const weekEnd = addDays(weekStart, 6);

  const [upcomingRes, approvedRes, signalsRes, picksRes, pastRes, sourcesRes, createdRes, suggRes] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, start_date, start_time, venue_name, status, source_url, organizer_instagram")
      .in("status", ["approved", "pending"])
      .gte("start_date", today)
      .lte("start_date", in60)
      .order("start_date")
      .limit(800),
    supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .or(`start_date.gte.${today},end_date.gte.${today},is_recurring.eq.true`),
    supabase.from("event_signals").select("event_id, kind").gte("created_at", since30).limit(20000),
    supabase
      .from("event_picks")
      .select("week_start, rank, event_id, why, event:events(title, category, venue_name)")
      .gte("week_start", addDays(weekStart, -42))
      .order("week_start", { ascending: false }),
    supabase
      .from("events")
      .select("category, venue_name")
      .eq("status", "approved")
      .gte("start_date", ago30)
      .lt("start_date", today)
      .limit(2000),
    supabase.from("event_sources").select("id, slug"),
    supabase.from("events").select("source_id, status").gte("created_at", since30).limit(5000),
    supabase.from("source_suggestions").select("id, handles, urls, created_at").eq("status", "new").limit(50),
  ]);

  const firstError = [upcomingRes, approvedRes, signalsRes, picksRes, pastRes, sourcesRes, createdRes, suggRes].find((r) => r.error)?.error;
  if (firstError) return NextResponse.json({ data: null, error: firstError.message }, { status: 500 });

  const signals = new Map<string, { interest: number; clicks: number }>();
  for (const s of signalsRes.data ?? []) {
    const c = signals.get(s.event_id) ?? { interest: 0, clicks: 0 };
    if (s.kind === "interest") c.interest++;
    else c.clicks++;
    signals.set(s.event_id, c);
  }
  const sig = (id: string) => signals.get(id) ?? { interest: 0, clicks: 0 };

  const approved = approvedRes.data as Event[];
  const titleOf = new Map(approved.map((e) => [e.id, e]));
  const weekCandidates = rolledForward(visibleListings(approved))
    .filter((e) => e.start_date <= weekEnd && (e.end_date ?? e.start_date) >= weekStart)
    .map((e) => ({
      id: e.id,
      title: e.title,
      start_date: e.start_date,
      start_time: e.start_time,
      venue_name: e.venue_name,
      category: e.category,
      short_description: e.short_description,
      price_info: e.price_info,
      organizer_instagram: e.organizer_instagram,
      source_host: host(e.source_url ?? e.external_ticket_url),
      recurring: !!e.is_recurring,
      ...sig(e.id),
    }));

  const signals30 = [...signals.entries()]
    .map(([id, c]) => ({ id, title: titleOf.get(id)?.title ?? null, category: titleOf.get(id)?.category ?? null, ...c }))
    .sort((a, b) => b.interest + b.clicks - (a.interest + a.clicks))
    .slice(0, 60);

  const tally = (xs: (string | null)[]) => {
    const m = new Map<string, number>();
    for (const x of xs) if (x) m.set(x, (m.get(x) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n }));
  };
  const past = pastRes.data ?? [];

  const slugOf = new Map((sourcesRes.data ?? []).map((s) => [s.id, s.slug]));
  const yieldMap = new Map<string, { created: number; published: number }>();
  for (const e of createdRes.data ?? []) {
    const slug = (e.source_id && slugOf.get(e.source_id)) || "direct";
    const y = yieldMap.get(slug) ?? { created: 0, published: 0 };
    y.created++;
    if (e.status === "approved") y.published++;
    yieldMap.set(slug, y);
  }

  const suggestions = (suggRes.data ?? []).map((s) => ({ handles: s.handles, urls: s.urls, at: s.created_at }));
  const suggIds = (suggRes.data ?? []).map((s) => s.id);
  if (suggIds.length) await supabase.from("source_suggestions").update({ status: "passed" }).in("id", suggIds);

  return NextResponse.json({
    data: {
      today,
      weekStart,
      upcoming: upcomingRes.data ?? [],
      weekCandidates,
      signals30,
      picksHistory: (picksRes.data ?? []).map((p) => ({
        week_start: p.week_start,
        rank: p.rank,
        event_id: p.event_id,
        why: p.why,
        ...(p.event as unknown as { title: string; category: string; venue_name: string }),
        ...sig(p.event_id),
      })),
      supply30: { events: past.length, byCategory: tally(past.map((e) => e.category)), byVenue: tally(past.map((e) => e.venue_name)).slice(0, 20) },
      sourceYield30: Object.fromEntries(yieldMap),
      suggestions,
    },
    error: null,
  });
}
