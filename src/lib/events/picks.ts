/**
 * The week's picks: up to 8 events the events-desk routine chooses every
 * Wednesday (Bali) for the Wednesday–Tuesday week, each with a one-line why.
 * Shown at the top of /events and meant for the Wednesday email.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Event } from "@/types";
import { nowInBali } from "@/lib/events/bali-time";
import { rolledForward } from "@/lib/events/buckets";
import { visibleListings } from "@/lib/events/listing-checks";

/** The Wednesday on or before `ymd` (YYYY-MM-DD). Weeks run Wed–Tue. */
export function weekStartFor(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  const back = (d.getUTCDay() - 3 + 7) % 7; // 3 = Wednesday
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
}

export function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface WeekPick {
  event: Event;
  why: string;
  rank: number;
}

/**
 * This week's picks that are still worth showing: live, publicly listable, and
 * not over yet (recurring ones rolled to their next date). Empty if the routine
 * hasn't picked this week.
 */
export async function getWeekPicks(supabase: SupabaseClient, now: Date = new Date()): Promise<WeekPick[]> {
  const today = nowInBali(now).dateStr;
  const weekStart = weekStartFor(today);
  const { data, error } = await supabase
    .from("event_picks")
    .select("rank, why, event:events(*)")
    .eq("week_start", weekStart)
    .order("rank", { ascending: true });
  if (error || !data) return [];

  const rows = data as unknown as { rank: number; why: string; event: Event | null }[];
  const approved = rows.filter((r) => r.event && r.event.status === "approved");
  const live = new Set(visibleListings(approved.map((r) => r.event!)).map((e) => e.id));
  const rolled = new Map(rolledForward(approved.map((r) => r.event!), now).map((e) => [e.id, e]));
  const weekEnd = addDays(weekStart, 6);
  return approved
    .filter((r) => live.has(r.event!.id) && rolled.has(r.event!.id))
    .filter((r) => rolled.get(r.event!.id)!.start_date <= weekEnd)
    .map((r) => ({ event: rolled.get(r.event!.id)!, why: r.why, rank: r.rank }));
}
