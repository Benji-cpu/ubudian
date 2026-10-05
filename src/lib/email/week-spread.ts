import type { Event } from "@/types";

/**
 * Up to `limit` events spread across the week rather than the first N by date
 * (which, for a reader with no quiz archetype, was five things on Wednesday).
 * Takes one event per day in date order, round after round, and never the
 * same event twice (a weekly class appears once per day it runs).
 */
export function spreadAcrossWeek(events: Event[], limit: number): Event[] {
  const byDay = new Map<string, Event[]>();
  for (const e of events) {
    const day = e.start_date ?? "";
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e);
  }
  const days = [...byDay.keys()].sort();
  const picked: Event[] = [];
  const seen = new Set<string>();
  for (let round = 0; picked.length < limit; round++) {
    let tookAny = false;
    for (const day of days) {
      if (picked.length >= limit) break;
      const queue = byDay.get(day)!;
      while (queue.length > 0) {
        const next = queue.shift()!;
        if (seen.has(next.id)) continue;
        seen.add(next.id);
        picked.push(next);
        tookAny = true;
        break;
      }
    }
    if (!tookAny) break;
  }
  return picked.sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""));
}
