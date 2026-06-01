/**
 * Chronological date grouping for the list view.
 *
 * Replaces the fuzzy "Happening now / Soon / Later" bucketing with simple,
 * scannable calendar groups: Today, Tomorrow, then weekday + date.
 *
 * Operates on events that have ALREADY been rolled forward to their next
 * occurrence (the /events page does this via `filterEventsInRange` before
 * handing the array to the list). So we group on `event.start_date` as-is.
 */

import { format } from "date-fns";
import type { Event } from "@/types";
import { nowInBali } from "./bali-time";
import { compareEventsByStart } from "./buckets";

export interface EventDateGroup {
  /** YYYY-MM-DD key — the effective (rolled-forward) start date. */
  dateKey: string;
  /** "Today · Sun 1 Jun" | "Tomorrow · Mon 2 Jun" | "Sat 7 Jun". */
  label: string;
  events: Event[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Add N days to a YYYY-MM-DD string, returning a YYYY-MM-DD string. */
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const out = new Date(Date.UTC(y, m - 1, d) + days * DAY_MS);
  const yyyy = out.getUTCFullYear();
  const mm = String(out.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(out.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse a YYYY-MM-DD string into a Date whose LOCAL components match. date-fns
 * `format` reads local components, so this avoids the UTC double-shift that
 * `parseISO` would introduce.
 */
function parseYMDLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Group events into ascending calendar-date sections. Multi-day events still
 * in their span (started before today, ending today or later) are pinned to
 * Today so a day-3-of-5 retreat shows under Today rather than its seed date.
 */
export function groupEventsByDate(
  events: Event[],
  now: Date = new Date()
): EventDateGroup[] {
  const todayStr = nowInBali(now).dateStr;
  const tomorrowStr = addDays(todayStr, 1);

  const byKey = new Map<string, Event[]>();

  for (const event of events) {
    const start = event.start_date;
    const end = event.end_date || event.start_date;
    // Already-ended events shouldn't reach here, but guard anyway.
    if (end < todayStr) continue;
    // In-span multi-day event → pin to Today; otherwise its own start date.
    const dateKey = start < todayStr && end >= todayStr ? todayStr : start;
    const list = byKey.get(dateKey);
    if (list) list.push(event);
    else byKey.set(dateKey, [event]);
  }

  const keys = Array.from(byKey.keys()).sort((a, b) => a.localeCompare(b));

  return keys.map((dateKey) => {
    const events = byKey.get(dateKey)!.slice().sort(compareEventsByStart);
    return { dateKey, label: labelFor(dateKey, todayStr, tomorrowStr), events };
  });
}

function labelFor(dateKey: string, todayStr: string, tomorrowStr: string): string {
  const pretty = format(parseYMDLocal(dateKey), "EEE d MMM"); // "Sat 7 Jun"
  if (dateKey === todayStr) return `Today · ${pretty}`;
  if (dateKey === tomorrowStr) return `Tomorrow · ${pretty}`;
  return pretty;
}
