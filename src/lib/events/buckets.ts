/**
 * Time bucketing for the agenda feed.
 *
 * Groups events into human-meaningful windows relative to now, anchored to
 * Bali local time (Asia/Makassar) — not server UTC.
 *
 *   happening_now  — started and not yet ended by the Bali clock
 *   today          — starting later today in Bali
 *   tomorrow       — starting tomorrow (Bali)
 *   weekend        — starting on the next upcoming Sat or Sun (skipped if
 *                    those are already covered by today/tomorrow)
 *   next_week      — starting in the next 7 days but not in earlier buckets
 *   later          — everything else in the future
 *
 * Events whose end time has passed (same day, known end_time) are dropped.
 */

import type { Event } from "@/types";
import {
  nowInBali,
  eventIsHappeningNow,
  eventIsInProgress,
  eventEndedToday,
  parseTimeToMinutes,
  type BaliNow,
} from "./bali-time";
import { parseRecurrenceRule, daysOfWeekArray } from "@/lib/recurrence";

export type EventBucket =
  | "happening_now"
  | "today"
  | "tomorrow"
  | "in_progress"
  | "weekend"
  | "next_week"
  | "later";

export type BucketedEvents = Record<EventBucket, Event[]>;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Roll every recurring event's `start_date` (and `end_date` if a span)
 * forward to its next occurrence on or after today. Non-recurring events
 * pass through. Use for flat views (Grid, Map, sheet panels) that don't
 * bucket but still need to display the next-instance date instead of
 * the seed date.
 */
export function rolledForward(events: Event[], now: Date = new Date()): Event[] {
  const todayStr = nowInBali(now).dateStr;
  return events.map((event) => nextOccurrence(event, todayStr));
}

export function bucketEventsByTime(
  events: Event[],
  now: Date = new Date(),
  boostedEventIds?: Set<string>
): BucketedEvents {
  const buckets: BucketedEvents = {
    happening_now: [],
    today: [],
    tomorrow: [],
    in_progress: [],
    weekend: [],
    next_week: [],
    later: [],
  };

  const bali = nowInBali(now);
  const todayStr = bali.dateStr;
  const tomorrowStr = addDays(todayStr, 1);
  const weekendDates = upcomingWeekendDates(todayStr, bali.dayOfWeek);

  for (const event of events) {
    const effective = nextOccurrence(event, todayStr);
    const bucket = pickBucket(effective, bali, todayStr, tomorrowStr, weekendDates);
    if (bucket) buckets[bucket].push(effective);
  }

  const compare = boostedEventIds && boostedEventIds.size > 0
    ? (a: Event, b: Event) => {
        const aBoost = boostedEventIds.has(a.id) ? 1 : 0;
        const bBoost = boostedEventIds.has(b.id) ? 1 : 0;
        if (aBoost !== bBoost) return bBoost - aBoost;
        return compareEvents(a, b);
      }
    : compareEvents;

  for (const key of Object.keys(buckets) as EventBucket[]) {
    buckets[key].sort(compare);
  }

  return buckets;
}

function pickBucket(
  event: Event,
  bali: BaliNow,
  todayStr: string,
  tomorrowStr: string,
  weekendDates: Set<string>
): EventBucket | null {
  const start = event.start_date;
  const end = event.end_date || event.start_date;

  if (end < todayStr) return null;

  if (eventIsHappeningNow(event, bali)) return "happening_now";

  // Multi-day event already past its first day but still in span:
  // belongs in "in progress this week", not in today's drop-in list.
  if (start < todayStr && end >= todayStr && eventIsInProgress(event, bali)) {
    return "in_progress";
  }

  // Same-day event whose end_time already passed: drop (not "today" anymore).
  if (start === todayStr && eventEndedToday(event, bali)) return null;

  if (start === todayStr) return "today";
  if (start === tomorrowStr) return "tomorrow";
  if (weekendDates.has(start)) return "weekend";

  const daysOut = daysBetween(todayStr, start);
  if (daysOut <= 7) return "next_week";

  return "later";
}

function upcomingWeekendDates(todayStr: string, todayDow: number): Set<string> {
  const dates = new Set<string>();
  for (let offset = 0; offset <= 7; offset++) {
    const dow = (todayDow + offset) % 7;
    if (dow === 6 || dow === 0) {
      dates.add(addDays(todayStr, offset));
    }
  }
  return dates;
}

function compareEvents(a: Event, b: Event): number {
  if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
  const at = parseTimeToMinutes(a.start_time) ?? 0;
  const bt = parseTimeToMinutes(b.start_time) ?? 0;
  return at - bt;
}

/**
 * Public sort comparator keyed on `start_date` then `start_time`. After
 * `rolledForward` or `filterEventsInRange`, the events carry their next
 * occurrence's date — so client-side views that consume those outputs can
 * sort with this comparator and get the right order.
 */
export const compareEventsByStart = compareEvents;

/**
 * Stable sort over rolled-forward events. `mode === 'newest'` keys on
 * `created_at` descending; everything else falls back to start-date ASC.
 * If `boostedEventIds` is provided, those events sort to the front of their
 * tie group (date- or recency-equal) so the community-partner boost shows up
 * in flat views (grid, list) too. Mutates a new array; does not touch the input.
 */
export function sortRolledEvents(
  events: Event[],
  mode: "date" | "newest" = "date",
  boostedEventIds?: Set<string>
): Event[] {
  const out = [...events];
  const base =
    mode === "newest"
      ? (a: Event, b: Event) => b.created_at.localeCompare(a.created_at)
      : compareEvents;

  if (boostedEventIds && boostedEventIds.size > 0) {
    out.sort((a, b) => {
      const aBoost = boostedEventIds.has(a.id) ? 1 : 0;
      const bBoost = boostedEventIds.has(b.id) ? 1 : 0;
      if (aBoost !== bBoost) return bBoost - aBoost;
      return base(a, b);
    });
  } else {
    out.sort(base);
  }
  return out;
}

/** Add N days to a YYYY-MM-DD string, returning a YYYY-MM-DD string. */
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + days * DAY_MS;
  const out = new Date(t);
  const yyyy = out.getUTCFullYear();
  const mm = String(out.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(out.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Whole-day delta between two YYYY-MM-DD strings (b - a). */
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const at = Date.UTC(ay, am - 1, ad);
  const bt = Date.UTC(by, bm - 1, bd);
  return Math.round((bt - at) / DAY_MS);
}

/**
 * For a recurring event, return a copy whose `start_date` (and `end_date`,
 * if it was a same-length span) has been rolled forward to the next
 * occurrence on or after `today`. Non-recurring events pass through
 * unchanged.
 *
 * We only handle daily / weekly / biweekly / monthly frequencies — that's
 * what `recurrence.ts` supports.
 */
function nextOccurrence(event: Event, today: string): Event {
  if (!event.is_recurring || !event.recurrence_rule) return event;
  const rule = parseRecurrenceRule(event.recurrence_rule);
  if (!rule) return event;

  const spanDays =
    event.end_date && event.end_date >= event.start_date
      ? daysBetween(event.start_date, event.end_date)
      : 0;

  // If currently inside an active instance (today within span), don't roll.
  const endAnchor = event.end_date ?? event.start_date;
  if (event.start_date <= today && endAnchor >= today) return event;
  // Already upcoming — leave alone.
  if (event.start_date >= today) return event;

  // Multi-day weekly (Mon/Wed/Fri etc.): pick the soonest matching weekday
  // on or after today, without stepping a whole 7-day stride that would
  // skip closer occurrences.
  if (rule.frequency === "weekly" && Array.isArray(rule.day_of_week)) {
    const days = daysOfWeekArray(rule);
    if (days.length > 0) {
      let probe = today;
      for (let i = 0; i < 14; i++) {
        if (days.includes(dayOfWeekFromDateStr(probe))) {
          const newEnd = spanDays > 0 ? addDays(probe, spanDays) : event.end_date;
          return { ...event, start_date: probe, end_date: newEnd };
        }
        probe = addDays(probe, 1);
      }
    }
  }

  // Roll forward by the rule's step until start >= today.
  // Safety cap at 400 iterations (over a year for weekly).
  let start = event.start_date;
  for (let i = 0; i < 400; i++) {
    if (start >= today) break;
    start = advanceByRule(start, rule);
  }

  const newEnd = spanDays > 0 ? addDays(start, spanDays) : event.end_date;
  return { ...event, start_date: start, end_date: newEnd };
}

/** Day-of-week (0=Sun..6=Sat) for a YYYY-MM-DD string in UTC. */
function dayOfWeekFromDateStr(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function advanceByRule(
  dateStr: string,
  rule: { frequency: "daily" | "weekly" | "biweekly" | "monthly" }
): string {
  switch (rule.frequency) {
    case "daily":
      return addDays(dateStr, 1);
    case "weekly":
      return addDays(dateStr, 7);
    case "biweekly":
      return addDays(dateStr, 14);
    case "monthly": {
      const [y, m, d] = dateStr.split("-").map(Number);
      const nextMonth = new Date(Date.UTC(y, m, d));
      const yy = nextMonth.getUTCFullYear();
      const mm = String(nextMonth.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(nextMonth.getUTCDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}`;
    }
  }
}
