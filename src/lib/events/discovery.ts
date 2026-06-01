/**
 * Two-tier discovery feed helpers.
 *
 * The /events page renders a CORE conscious-community agenda first, then a
 * collapsed "More happenings in Ubud" DISCOVERY section (festivals, gallery
 * openings, markets, food, performance). This module owns the small bits of
 * logic that distinguish the two tiers:
 *
 *   - splitByTier            — partition a fetched event list into core/discovery
 *   - getTimeSensitivityLabel — the scarcity badge ("Opens Friday", "Closes in
 *                               3 days", "Today only") that turns a listing into
 *                               intelligence. The whole point of tier 2.
 *   - pickSpotlight          — choose the single event for the floating banner
 *   - bannerEyebrow          — the banner's relative-time eyebrow copy
 */

import { parseISO, format } from "date-fns";
import type { Event } from "@/types";
import { nowInBali } from "./bali-time";

/** Days between two `YYYY-MM-DD` strings (b → a), as a signed integer.
 *  Both are pure calendar dates, so a UTC-midnight diff is exact. */
function dayDiff(a: string, b: string): number {
  const ms = Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function splitByTier(events: Event[]): {
  core: Event[];
  discovery: Event[];
} {
  const core: Event[] = [];
  const discovery: Event[] = [];
  for (const e of events) {
    if (e.event_tier === "discovery") discovery.push(e);
    else core.push(e);
  }
  return { core, discovery };
}

/**
 * The scarcity badge. Returns null for recurring anchors (not scarce) and for
 * one-offs with comfortable runway — so it only ever fires when there's a real
 * "you can't catch this next week" signal. Multi-day events get a closing
 * countdown while they run and an opening countdown just before; single-day
 * one-offs get a today/tomorrow flag.
 */
export function getTimeSensitivityLabel(
  event: Event,
  now: Date = new Date()
): string | null {
  if (event.is_recurring) return null;
  const start = event.start_date;
  if (!start) return null;
  const today = nowInBali(now).dateStr;
  const end = event.end_date;
  const isMultiDay = !!end && end > start;

  if (isMultiDay) {
    // Currently running → countdown to its close.
    if (start <= today && today <= end) {
      const left = dayDiff(end, today);
      if (left <= 0) return "Last day";
      if (left === 1) return "Closes tomorrow";
      if (left <= 3) return `Closes in ${left} days`;
      return null;
    }
    // Imminent opening.
    if (start > today) {
      const until = dayDiff(start, today);
      if (until === 1) return "Opens tomorrow";
      if (until <= 6) return `Opens in ${until} days`;
    }
    return null;
  }

  // Single-day one-off.
  if (start === today) return "Today only";
  if (dayDiff(start, today) === 1) return "Tomorrow only";
  return null;
}

/**
 * The single banner event: the soonest spotlight-flagged discovery event that
 * is still upcoming or running, within a ~2-week look-ahead. One banner max.
 */
export function pickSpotlight(
  events: Event[],
  now: Date = new Date()
): Event | null {
  const today = nowInBali(now).dateStr;
  const eligible = events.filter((e) => {
    if (!e.is_spotlight) return false;
    const over = (e.end_date ?? e.start_date) < today; // already finished
    if (over) return false;
    return dayDiff(e.start_date, today) <= 14; // within the look-ahead window
  });
  eligible.sort((a, b) => a.start_date.localeCompare(b.start_date));
  return eligible[0] ?? null;
}

/** Relative-time eyebrow for the festival banner — always returns a phrase. */
export function bannerEyebrow(event: Event, now: Date = new Date()): string {
  const today = nowInBali(now).dateStr;
  const start = event.start_date;
  const end = event.end_date;

  // Already running.
  if (start <= today && (!end || today <= end)) {
    if (end && dayDiff(end, today) <= 0) return "On now · last day";
    return "On now";
  }

  const until = dayDiff(start, today);
  if (until <= 0) return "Opens today";
  if (until === 1) return "Opens tomorrow";
  if (until <= 6) return `Opens ${format(parseISO(start), "EEEE")}`; // "Opens Friday"
  return `Opens ${format(parseISO(start), "d MMM")}`; // "Opens 11 Sep"
}
