/**
 * Server-side date-range filter for the events feed.
 *
 * The DB stores recurring events with their original (seed) `start_date`,
 * so a weekly Tuesday class authored on 2026-05-12 keeps that date forever
 * even though the *next* occurrence rolls forward each week. Range filters
 * applied at the DB layer (`start_date BETWEEN from AND to`) silently strip
 * those rows out, leaving the user staring at an empty grid. This helper
 * runs after the DB fetch, expands recurring events into their next
 * occurrence inside `[from, to]`, and keeps non-recurring events whose
 * `[start_date, end_date]` span overlaps the window.
 */

import { addDays as addDaysFn } from "date-fns";
import type { Event } from "@/types";
import { rolledForward, sortRolledEvents } from "./buckets";
import { expandRecurrence } from "@/lib/recurrence";

const MAX_WINDOW_DAYS = 60;

/**
 * `from` / `to` are YYYY-MM-DD Bali-local dates (inclusive on both ends).
 * Passing `null` for both is the no-filter path and just rolls every
 * recurring event forward to its next instance (so cards display the
 * correct date and sort lands them in the right place).
 */
export function filterEventsInRange(
  events: Event[],
  from: string | null,
  to: string | null,
  now: Date = new Date()
): Event[] {
  if (!from && !to) return sortRolledEvents(rolledForward(events, now));

  // `expandRecurrence` (and `buckets.ts`) interpret Date objects via the
  // host TZ — `startOfDay`, weekday lookups, etc. Anchor the window in
  // local-midnight terms so the date strings round-trip cleanly regardless
  // of the runner's timezone.
  const rangeStart = parseYmdLocal(from ?? to!);
  const rangeEnd = clampWindow(rangeStart, parseYmdLocal(to ?? from!));
  // expandRecurrence treats its `rangeEnd` as exclusive — add a day so the
  // user-supplied inclusive end date is hit.
  const expansionEnd = addDaysFn(rangeEnd, 1);

  const fromStr = formatYmdLocal(rangeStart);
  const toStr = formatYmdLocal(rangeEnd);

  const out: Event[] = [];
  for (const event of events) {
    if (event.is_recurring && event.recurrence_rule) {
      const hits = expandRecurrence(event, rangeStart, expansionEnd);
      if (hits.length === 0) continue;
      const first = hits[0];
      const firstStr = formatYmdLocal(first);
      const span = spanDays(event.start_date, event.end_date);
      const newEnd =
        span > 0 ? formatYmdLocal(addDaysFn(first, span)) : event.end_date;
      out.push({ ...event, start_date: firstStr, end_date: newEnd });
      continue;
    }

    // Non-recurring: include if [start, end] overlaps [from, to].
    const evStart = event.start_date;
    const evEnd = event.end_date && event.end_date >= evStart ? event.end_date : evStart;
    if (evEnd >= fromStr && evStart <= toStr) {
      out.push(event);
    }
  }

  return sortRolledEvents(out);
}

function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatYmdLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function spanDays(start: string, end: string | null): number {
  if (!end || end <= start) return 0;
  const a = parseYmdLocal(start).getTime();
  const b = parseYmdLocal(end).getTime();
  return Math.round((b - a) / 86_400_000);
}

function clampWindow(start: Date, end: Date): Date {
  if (end < start) return start;
  const max = addDaysFn(start, MAX_WINDOW_DAYS);
  return end > max ? max : end;
}
