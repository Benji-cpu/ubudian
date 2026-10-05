import type { Special } from "@/types";
import type { BaliNow } from "@/lib/events/bali-time";
import { parseTimeToMinutes } from "@/lib/events/bali-time";

/** Everything a public page may show. Never add the contact_* columns here. */
export const PUBLIC_SPECIAL_COLUMNS =
  "id, venue_name, venue_area, venue_address, google_maps_url, instagram_handle, website_url, title, description, price_idr, weekdays, start_time, end_time, expires_on, confirmed_at";

/** A special lapses this many days after it was last confirmed. */
export const SPECIAL_LIFETIME_DAYS = 30;

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Runs on this weekday (0 = Sunday). An empty list means every day. */
export function runsOn(special: Pick<Special, "weekdays">, dayOfWeek: number): boolean {
  return special.weekdays.length === 0 || special.weekdays.includes(dayOfWeek);
}

/** Still worth heading out for: runs today and hasn't finished yet. */
export function isStillOnToday(
  special: Pick<Special, "weekdays" | "end_time">,
  now: BaliNow
): boolean {
  if (!runsOn(special, now.dayOfWeek)) return false;
  const end = parseTimeToMinutes(special.end_time);
  // An end before 05:00 runs past midnight ("until 1am"): still on all evening.
  if (end === null || end < 5 * 60) return true;
  return end > now.timeMinutes;
}

/** Live specials happening today, earliest start first; all-day ones last. */
export function specialsForToday<T extends Special>(rows: T[], now: BaliNow): T[] {
  return rows
    .filter((s) => isStillOnToday(s, now))
    .sort((a, b) => startKey(a) - startKey(b) || a.venue_name.localeCompare(b.venue_name));
}

function startKey(s: Pick<Special, "start_time">): number {
  return parseTimeToMinutes(s.start_time) ?? 24 * 60;
}

/** "Tue, Thu" / "Every day" / "Weekdays" / "Weekends". */
export function formatWeekdays(weekdays: number[]): string {
  const days = [...new Set(weekdays)].sort((a, b) => a - b);
  if (days.length === 0 || days.length === 7) return "Every day";
  if (days.join() === "1,2,3,4,5") return "Weekdays";
  if (days.join() === "0,6") return "Weekends";
  return days.map((d) => WEEKDAY_LABELS[d]).join(", ");
}

/** "17:00–19:00", "from 17:00", "until 19:00" or null. Seconds are dropped. */
export function formatHours(start: string | null, end: string | null): string | null {
  const s = start?.slice(0, 5);
  const e = end?.slice(0, 5);
  if (s && e) return `${s}–${e}`;
  if (s) return `from ${s}`;
  if (e) return `until ${e}`;
  return null;
}

/** 135000 → "IDR 135k"; 1500000 → "IDR 1.5m". */
export function formatIdr(amount: number | null): string | null {
  if (amount === null || amount === undefined) return null;
  if (amount >= 1_000_000) return `IDR ${+(amount / 1_000_000).toFixed(1)}m`;
  if (amount >= 1_000) return `IDR ${+(amount / 1_000).toFixed(1)}k`;
  return `IDR ${amount}`;
}

/** Bali calendar date `days` after `fromDateStr` (YYYY-MM-DD). */
export function addDaysToDateStr(fromDateStr: string, days: number): string {
  const d = new Date(`${fromDateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
