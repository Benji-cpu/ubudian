/**
 * Time bucketing for the agenda feed.
 *
 * Groups events into discrete, human-meaningful windows relative to now:
 *
 *   happening_now  — started (start_date <= today) but not yet finished
 *                    (end_date null or >= today)
 *   today          — starting later today (start_date == today, and not
 *                    already in happening_now)
 *   tomorrow       — starting tomorrow
 *   weekend        — starting on the next upcoming Sat or Sun (skipped if
 *                    those are already covered by today/tomorrow)
 *   next_week      — starting in the next 7 days but not in earlier buckets
 *   later          — everything else in the future
 *
 * Each event lands in exactly one bucket. Past events without a forward
 * end_date are excluded.
 */

import type { Event } from "@/types";

export type EventBucket =
  | "happening_now"
  | "today"
  | "tomorrow"
  | "weekend"
  | "next_week"
  | "later";

export type BucketedEvents = Record<EventBucket, Event[]>;

const DAY_MS = 24 * 60 * 60 * 1000;

export function bucketEventsByTime(events: Event[], now = new Date()): BucketedEvents {
  const buckets: BucketedEvents = {
    happening_now: [],
    today: [],
    tomorrow: [],
    weekend: [],
    next_week: [],
    later: [],
  };

  const todayStr = toDateString(now);
  const tomorrow = new Date(now.getTime() + DAY_MS);
  const tomorrowStr = toDateString(tomorrow);

  // Saturday = 6, Sunday = 0
  const weekendDates = upcomingWeekendDates(now);

  for (const event of events) {
    const bucket = pickBucket(event, now, todayStr, tomorrowStr, weekendDates);
    if (bucket) buckets[bucket].push(event);
  }

  // Each bucket is sorted by start_date then start_time for a stable render.
  for (const key of Object.keys(buckets) as EventBucket[]) {
    buckets[key].sort(compareEvents);
  }

  return buckets;
}

function pickBucket(
  event: Event,
  now: Date,
  todayStr: string,
  tomorrowStr: string,
  weekendDates: Set<string>
): EventBucket | null {
  const start = event.start_date;
  const end = event.end_date || event.start_date;

  // Drop past events (end before today) unless they're still running today.
  if (end < todayStr) return null;

  // Happening now — started, still running
  if (start <= todayStr && end >= todayStr) {
    // If start is strictly before today, or start is today but time has passed
    if (start < todayStr || hasEventStarted(event, now)) {
      return "happening_now";
    }
  }

  if (start === todayStr) return "today";
  if (start === tomorrowStr) return "tomorrow";
  if (weekendDates.has(start)) return "weekend";

  const startDate = new Date(start + "T00:00:00");
  const daysOut = Math.floor((startDate.getTime() - startOfDay(now).getTime()) / DAY_MS);
  if (daysOut <= 7) return "next_week";

  return "later";
}

function hasEventStarted(event: Event, now: Date): boolean {
  if (!event.start_time) return false;
  const [h, m] = event.start_time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  const today = startOfDay(now);
  const startTime = new Date(today);
  startTime.setHours(h, m, 0, 0);
  return now.getTime() >= startTime.getTime();
}

function upcomingWeekendDates(now: Date): Set<string> {
  const dates = new Set<string>();
  const today = startOfDay(now);
  for (let offset = 0; offset <= 7; offset++) {
    const d = new Date(today.getTime() + offset * DAY_MS);
    const dow = d.getDay();
    if (dow === 6 || dow === 0) {
      dates.add(toDateString(d));
    }
  }
  return dates;
}

function compareEvents(a: Event, b: Event): number {
  if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
  const at = a.start_time ?? "00:00";
  const bt = b.start_time ?? "00:00";
  return at.localeCompare(bt);
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
