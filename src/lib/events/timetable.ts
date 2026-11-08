/**
 * The dated timetable pages, /ubud-tonight and /ubud-events-this-week, and
 * the quiz's "Your week in Ubud". Pure functions over public listings (rows
 * that already passed `visibleListings()`), anchored to the Bali clock.
 */
import type { ArchetypeId, Event } from "@/types";
import { ARCHETYPES } from "@/lib/quiz-data";
import { expandRecurrence, parseRecurrenceRule } from "@/lib/recurrence";
import { isSafeUrl } from "@/lib/url-validation";
import { nowInBali, parseTimeToMinutes } from "./bali-time";
import { bucketEventsByTime } from "./buckets";

/** Minutes after its start that a gathering is still worth walking into. */
export const JOINABLE_AFTER_START_MIN = 30;

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS).toISOString().slice(0, 10);
}

function weekday(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function parts(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, month: MONTHS[m - 1], d, day: WEEKDAYS[weekday(dateStr)] };
}

/** "Mon 9 Nov". */
export function shortDate(dateStr: string): string {
  const p = parts(dateStr);
  return `${p.day.slice(0, 3)} ${p.d} ${p.month}`;
}

/** "Monday 9 Nov". */
export function longDate(dateStr: string): string {
  const p = parts(dateStr);
  return `${p.day} ${p.d} ${p.month}`;
}

/** "9–15 Nov", or "30 Nov–6 Dec" across a month. */
export function dateSpan(from: string, to: string): string {
  const a = parts(from);
  const b = parts(to);
  return a.month === b.month ? `${a.d}–${b.d} ${b.month}` : `${a.d} ${a.month}–${b.d} ${b.month}`;
}

export function tonightTitle(dateStr: string): string {
  return `Things to do in Ubud tonight (${shortDate(dateStr)})`;
}

export function weekTitle(monday: string, sunday: string): string {
  return `Ubud events this week (${dateSpan(monday, sunday)})`;
}

/** Monday to Sunday of the Bali week that holds `now`. */
export function baliWeek(now: Date = new Date()): { monday: string; sunday: string; days: string[] } {
  const bali = nowInBali(now);
  const monday = addDays(bali.dateStr, -((bali.dayOfWeek + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return { monday, sunday: days[6], days };
}

/** By start time, untimed listings last, then by title. */
export function compareByTime(a: Event, b: Event): number {
  const at = parseTimeToMinutes(a.start_time);
  const bt = parseTimeToMinutes(b.start_time);
  if (at !== bt) return at === null ? 1 : bt === null ? -1 : at - bt;
  return a.title.localeCompare(b.title);
}

/**
 * What you can still get to today, Bali time: not started yet, started in the
 * last half hour, no start time, or a multi-day event on its first day. A
 * 4–6pm ceremony is not something to go to at 5pm. The homepage's "Still
 * ahead today" and /ubud-tonight read this one list.
 */
export function stillAheadToday(events: Event[], now: Date = new Date()): Event[] {
  const bali = nowInBali(now);
  const buckets = bucketEventsByTime(events, now);
  const joinable = buckets.happening_now.filter((e) => {
    if (e.end_date && e.end_date > e.start_date) return true;
    const start = parseTimeToMinutes(e.start_time);
    return start === null || bali.timeMinutes - start <= JOINABLE_AFTER_START_MIN;
  });
  return [...joinable, ...buckets.today];
}

function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localMidnight(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Each listing once for every day it happens in [from, to] (inclusive): a
 * weekly class on each of its days, a one-off on its first day. Each copy is
 * one day, like `rolledForward()`.
 */
export function occurrencesBetween(events: Event[], from: string, to: string): Event[] {
  const out: Event[] = [];
  for (const event of events) {
    const rule = event.is_recurring ? parseRecurrenceRule(event.recurrence_rule) : null;
    if (rule) {
      // expandRecurrence reads local dates and treats its end as exclusive.
      for (const hit of expandRecurrence(event, localMidnight(from), localMidnight(addDays(to, 1)))) {
        const date = ymdLocal(hit);
        if (date >= from && date <= to) out.push({ ...event, start_date: date, end_date: null });
      }
    } else if (event.start_date >= from && event.start_date <= to) {
      // A recurring flag with no rule we can read is a one-off on its date.
      out.push(event);
    }
  }
  return out;
}

export interface TimetableDay {
  date: string;
  /** "Today · Monday 9 Nov", "Tomorrow · Tuesday 10 Nov", "Wednesday 11 Nov". */
  label: string;
  events: Event[];
}

function dayLabel(date: string, today: string): string {
  if (date === today) return `Today · ${longDate(date)}`;
  if (date === addDays(today, 1)) return `Tomorrow · ${longDate(date)}`;
  return longDate(date);
}

/**
 * The rest of this Bali week, Monday to Sunday, from today on: today is the
 * /ubud-tonight list, every later day has everything on it.
 */
export function thisWeekByDay(events: Event[], now: Date = new Date()): TimetableDay[] {
  const today = nowInBali(now).dateStr;
  const days = baliWeek(now).days.filter((d) => d >= today);
  const byDate = new Map<string, Event[]>(days.map((d) => [d, []]));
  byDate.get(today)!.push(...stillAheadToday(events, now));
  const later = days.filter((d) => d > today);
  if (later.length > 0) {
    for (const e of occurrencesBetween(events, later[0], later[later.length - 1])) byDate.get(e.start_date)?.push(e);
  }
  return days.map((date) => ({ date, label: dayLabel(date, today), events: byDate.get(date)!.sort(compareByTime) }));
}

/** Does the listing suit this archetype: tagged for it, or in one of its categories. */
export function matchesArchetype(event: Pick<Event, "archetype_tags" | "category">, archetype: ArchetypeId): boolean {
  if (event.archetype_tags?.includes(archetype)) return true;
  return ARCHETYPES[archetype]?.content_keywords.event_categories.includes(event.category) ?? false;
}

/**
 * The quiz's "Your week in Ubud": what is still ahead today and over the next
 * six days, soonest first, each listing once.
 */
export function weekAhead(events: Event[], now: Date = new Date()): Event[] {
  const today = nowInBali(now).dateStr;
  const rest = occurrencesBetween(events, addDays(today, 1), addDays(today, 6)).sort(
    (a, b) => a.start_date.localeCompare(b.start_date) || compareByTime(a, b)
  );
  const seen = new Set<string>();
  return [...stillAheadToday(events, now).sort(compareByTime), ...rest].filter((e) => !seen.has(e.id) && !!seen.add(e.id));
}

/** The next `limit` listings for an archetype, from a `weekAhead()` list. */
export function nextForArchetype(week: Event[], archetype: ArchetypeId, limit = 5): Event[] {
  return week.filter((e) => matchesArchetype(e, archetype)).slice(0, limit);
}

/** Directions: the listing's own Maps link, else a Maps search for the venue in Ubud. */
export function eventMapHref(e: Pick<Event, "venue_map_url" | "venue_name" | "venue_address">): string | null {
  if (e.venue_map_url && isSafeUrl(e.venue_map_url)) return e.venue_map_url;
  if (!e.venue_name) return null;
  const q = [e.venue_name, e.venue_address, "Ubud"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Where to go next from a row: the ticket link, else where we found the listing. */
export function outboundLink(e: Pick<Event, "external_ticket_url" | "source_url">): { href: string; label: string } | null {
  if (e.external_ticket_url && isSafeUrl(e.external_ticket_url)) return { href: e.external_ticket_url, label: "Tickets" };
  if (e.source_url && isSafeUrl(e.source_url)) {
    return { href: e.source_url, label: /instagram\.com/i.test(e.source_url) ? "Instagram post" : "Original listing" };
  }
  return null;
}

/** "6:30 AM", "7 PM": the same clock as the event cards. */
function clock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = h % 12 || 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h >= 12 ? "PM" : "AM"}`;
}

/** "Checked today at 6:30 AM Bali time", "Checked yesterday at …", "Checked Sat 7 Nov at …". */
export function checkedLine(iso: string, now: Date = new Date()): string {
  const at = nowInBali(new Date(iso));
  const today = nowInBali(now).dateStr;
  const when = at.dateStr === today ? "today" : at.dateStr === addDays(today, -1) ? "yesterday" : shortDate(at.dateStr);
  return `Checked ${when} at ${clock(at.timeMinutes)} Bali time`;
}
