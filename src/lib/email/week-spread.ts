import type { Event } from "@/types";

/** Day-long courses and trainings aren't "an evening out": they go last. */
const COURSE = /\b(training|certification|certified|course|retreat|\d+-day)\b/i;

function isCourse(e: Event): boolean {
  return COURSE.test(e.title ?? "");
}

function preference(e: Event): number {
  return e.start_time ? 0 : 1;
}

/** Same class twice in a week (Qi-Gong Wed and Fri) counts as one. */
function hostKey(e: Event): string {
  return (e.organizer_name || e.venue_name || e.title || e.id).trim().toLowerCase();
}

/**
 * Up to `limit` events spread across the week rather than the first N by date
 * (which, for a reader with no quiz archetype, was five things on Wednesday).
 * One event per day in date order, round after round; within a day, timed
 * events before untimed; never the same event, organiser or venue twice.
 * Day-long courses and trainings are only used if the week is too thin
 * without them, and nothing that started before the window's first day.
 */
export function spreadAcrossWeek(events: Event[], limit: number, fromDate?: string): Event[] {
  const inWindow = fromDate ? events.filter((e) => (e.start_date ?? "") >= fromDate) : events;
  const evenings = inWindow.filter((e) => !isCourse(e));
  const picked = roundRobin(evenings, limit, [], new Set(), new Set());
  if (picked.length < limit) {
    const ids = new Set(picked.map((e) => e.id));
    const hosts = new Set(picked.map(hostKey));
    roundRobin(inWindow.filter(isCourse), limit, picked, ids, hosts);
  }
  return picked.sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""));
}

function roundRobin(
  events: Event[],
  limit: number,
  picked: Event[],
  seenIds: Set<string>,
  seenHosts: Set<string>
): Event[] {
  const byDay = new Map<string, Event[]>();
  for (const e of events) {
    const day = e.start_date ?? "";
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e);
  }
  for (const list of byDay.values()) list.sort((a, b) => preference(a) - preference(b));
  const days = [...byDay.keys()].sort();
  while (picked.length < limit) {
    let tookAny = false;
    for (const day of days) {
      if (picked.length >= limit) break;
      const queue = byDay.get(day)!;
      while (queue.length > 0) {
        const next = queue.shift()!;
        if (seenIds.has(next.id) || seenHosts.has(hostKey(next))) continue;
        seenIds.add(next.id);
        seenHosts.add(hostKey(next));
        picked.push(next);
        tookAny = true;
        break;
      }
    }
    if (!tookAny) break;
  }
  return picked;
}
