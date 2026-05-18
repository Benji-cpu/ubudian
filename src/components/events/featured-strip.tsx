import { EventGridCard } from "./event-grid-card";
import { nowInBali, parseTimeToMinutes } from "@/lib/events/bali-time";
import { bucketEventsByTime } from "@/lib/events/buckets";
import type { Event } from "@/types";

interface FeaturedStripProps {
  events: Event[];
  /** Compute relative to this clock — defaults to real `now`. */
  now?: Date;
}

const EVENING_CUTOFF_MINUTES = 17 * 60; // 17:00 Bali
const MIN_CARDS = 3;
const MAX_CARDS = 8;

/**
 * Featured rail above the filters — a high-signal glance hook for the page.
 * Surfaces what's on right now and what's next, in this order: events
 * currently in progress, today's remaining gatherings (evening-first if
 * past 17:00 Bali), then tomorrow's events as overflow. Headline shifts to
 * "Happening tonight" once the Bali clock is in evening territory and
 * there are evening events; otherwise "What's on next". Renders nothing
 * if fewer than three candidates land — a sparse rail looks abandoned.
 */
export function FeaturedStrip({ events, now = new Date() }: FeaturedStripProps) {
  const bali = nowInBali(now);
  const buckets = bucketEventsByTime(events, now);

  // Build the candidate list in priority order. Dedupe by id so a recurring
  // event that lives in both today + in_progress doesn't appear twice.
  const seen = new Set<string>();
  const push = (event: Event) => {
    if (seen.has(event.id)) return;
    seen.add(event.id);
    candidates.push(event);
  };
  const candidates: Event[] = [];

  // 1. Anything currently underway.
  for (const e of buckets.happening_now) push(e);

  // 2. Today's later-today bucket, evening first if it's already evening.
  const todayOrdered = [...buckets.today].sort((a, b) => {
    const at = parseTimeToMinutes(a.start_time) ?? 0;
    const bt = parseTimeToMinutes(b.start_time) ?? 0;
    if (bali.timeMinutes >= EVENING_CUTOFF_MINUTES) {
      // Past 17:00: prefer the next evening starts ahead of any stray
      // afternoon long-runners.
      const aEvening = at >= EVENING_CUTOFF_MINUTES;
      const bEvening = bt >= EVENING_CUTOFF_MINUTES;
      if (aEvening !== bEvening) return aEvening ? -1 : 1;
    }
    return at - bt;
  });
  for (const e of todayOrdered) push(e);

  // 3. Tomorrow as overflow so the rail still feels alive on a quiet evening.
  for (const e of buckets.tomorrow) push(e);

  if (candidates.length < MIN_CARDS) return null;

  const ordered = candidates.slice(0, MAX_CARDS);

  const isEvening = bali.timeMinutes >= EVENING_CUTOFF_MINUTES;
  const hasEveningToday = buckets.today.some((e) => {
    const startMin = parseTimeToMinutes(e.start_time);
    return startMin !== null && startMin >= EVENING_CUTOFF_MINUTES;
  });
  const hasInProgress = buckets.happening_now.length > 0;
  const titleTonight = isEvening && (hasEveningToday || hasInProgress);
  const eyebrow = titleTonight ? "Tonight in Ubud" : "What's on next";
  const heading = titleTonight ? "Happening tonight" : "On soon";

  return (
    <section
      aria-labelledby="featured-strip-heading"
      className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-brand-gold">
            {eyebrow}
          </p>
          <h2
            id="featured-strip-heading"
            className="mt-1 font-serif text-2xl font-medium text-brand-deep-green sm:text-3xl"
          >
            {heading}
          </h2>
        </div>
        <div className="hidden text-xs text-muted-foreground sm:block">
          {ordered.length} {ordered.length === 1 ? "gathering" : "gatherings"}
        </div>
      </div>

      <div className="mt-4 h-px w-16 bg-brand-gold/60" aria-hidden="true" />

      <div
        className="-mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:thin]"
      >
        {ordered.map((event) => (
          <div
            key={event.id}
            className="w-[280px] flex-shrink-0 snap-start sm:w-[300px]"
          >
            <EventGridCard event={event} aspectClass="aspect-[4/3]" />
          </div>
        ))}
      </div>
    </section>
  );
}
