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
 * Is the event currently happening in Bali time?
 *
 * True when today falls inside the event's date span AND the event has
 * started by Bali wall-clock AND (if end_time is known) hasn't ended yet.
 * Multi-day events (end_date > today) are always "live" regardless of time.
 */
export function eventIsLive(event: Event, now: BaliNow): boolean {
  const { dateStr: today, timeMinutes } = now;
  const start = event.start_date;
  const end = event.end_date || event.start_date;

  if (start > today || end < today) return false;

  // Multi-day event that's in-progress: always live.
  if (start < today && end > today) return true;

  const startMin = parseTimeToMinutes(event.start_time);
  const endMin = parseTimeToMinutes(event.end_time);

  // Same-day event with no start_time known — treat as live while today is the start day.
  if (start === today && end === today && startMin === null) return true;

  // If we have start but not end, consider live after start (same day only).
  if (startMin !== null && timeMinutes < startMin) return false;
  if (endMin !== null && timeMinutes >= endMin) return false;

  return true;
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
