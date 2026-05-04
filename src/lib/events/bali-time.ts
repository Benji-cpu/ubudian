/**
 * Bali-local time helpers.
 *
 * All event dates/times in the DB are authored in Bali time (Asia/Makassar,
 * UTC+8, no DST). Server code runs in UTC on Vercel, so comparisons need to
 * happen against the Bali wall clock, not the server clock.
 */

import type { Event } from "@/types";

const BALI_TZ = "Asia/Makassar";

export interface BaliNow {
  /** YYYY-MM-DD in Bali local time */
  dateStr: string;
  /** Minutes since 00:00 Bali local (0..1439) */
  timeMinutes: number;
  /** 0 = Sunday ... 6 = Saturday, in Bali local time */
  dayOfWeek: number;
}

export function nowInBali(now: Date = new Date()): BaliNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BALI_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  // `en-US` hour with hour12:false returns "24" at midnight; normalise to "00".
  const hourRaw = get("hour");
  const hour = hourRaw === "24" ? "00" : hourRaw;
  const minute = get("minute");
  const weekday = get("weekday");

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    dateStr: `${year}-${month}-${day}`,
    timeMinutes: Number(hour) * 60 + Number(minute),
    dayOfWeek: dayMap[weekday] ?? 0,
  };
}

/** Parse HH:MM[:SS] into minutes since midnight, or null if malformed. */
export function parseTimeToMinutes(value: string | null): number | null {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Strict "you can show up right now" predicate for the Happening Now bucket.
 *
 * True only for events you could plausibly drop in on this minute:
 *   - Same-day events that have started (by start_time) and not yet ended.
 *   - Same-day events with no time info, on their start day.
 *   - Multi-day events on their FIRST day, after start_time has passed.
 *
 * A retreat already on day 3 of 5 is *in progress* but not "happening now" —
 * use eventIsInProgress for that.
 */
export function eventIsHappeningNow(event: Event, now: BaliNow): boolean {
  const { dateStr: today, timeMinutes } = now;
  const start = event.start_date;
  const end = event.end_date || event.start_date;

  // Outside the event's overall span.
  if (start > today || end < today) return false;

  // Already past on a multi-day event whose end is in the past (handled above)
  // or a same-day event whose end_time has passed.
  const endMin = parseTimeToMinutes(event.end_time);
  if (start === today && end === today && endMin !== null && timeMinutes >= endMin) {
    return false;
  }

  // Past the first day of a multi-day workshop: in_progress, not happening_now.
  if (start < today) return false;

  // start === today from here on.
  const startMin = parseTimeToMinutes(event.start_time);
  if (startMin === null) {
    // No time info — count as happening from start of day.
    return true;
  }
  return timeMinutes >= startMin;
}

/**
 * Broader "the event is in progress" predicate.
 *
 * True any time `today` falls inside the [start_date, end_date] span and
 * (for same-day events) the times bracket "now". Used for the in_progress
 * bucket — multi-day workshops, retreats, festivals after their first day.
 */
export function eventIsInProgress(event: Event, now: BaliNow): boolean {
  const { dateStr: today, timeMinutes } = now;
  const start = event.start_date;
  const end = event.end_date || event.start_date;

  if (start > today || end < today) return false;

  // Multi-day event mid-span (after its first day, before its last): always in progress.
  if (start < today && end > today) return true;

  const startMin = parseTimeToMinutes(event.start_time);
  const endMin = parseTimeToMinutes(event.end_time);

  if (start === today && end === today && startMin === null) return true;
  if (startMin !== null && timeMinutes < startMin) return false;
  if (endMin !== null && timeMinutes >= endMin) return false;

  return true;
}

/** @deprecated Use eventIsHappeningNow or eventIsInProgress. Kept for callers outside the agenda. */
export function eventIsLive(event: Event, now: BaliNow): boolean {
  return eventIsInProgress(event, now);
}

/**
 * Has the event already ended on the current Bali day?
 * Used to drop same-day past events from upcoming buckets.
 */
export function eventEndedToday(event: Event, now: BaliNow): boolean {
  const { dateStr: today, timeMinutes } = now;
  const end = event.end_date || event.start_date;
  if (end < today) return true;
  if (end > today) return false;
  // end === today
  const endMin = parseTimeToMinutes(event.end_time);
  if (endMin === null) return false;
  return timeMinutes >= endMin;
}
