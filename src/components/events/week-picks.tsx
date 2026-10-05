import Link from "next/link";
import { formatEventDateLine } from "@/lib/events/format";
import { formatEventTime } from "@/lib/utils";
import type { WeekPick } from "@/lib/events/picks";

/** "This week's picks" at the top of /events. Renders nothing without picks. */
export function WeekPicks({ picks }: { picks: WeekPick[] }) {
  if (picks.length === 0) return null;
  return (
    <section aria-labelledby="week-picks" className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <h2 id="week-picks" className="font-serif text-xl font-semibold text-brand-deep-green sm:text-2xl">
        This week&apos;s picks
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Chosen every Wednesday from everything on this week.
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {picks.map(({ event, why }) => {
          const time = formatEventTime(event.start_time, event.end_time);
          return (
            <li key={event.id}>
              <Link
                href={`/events/${event.slug}`}
                className="block h-full rounded-xl border border-brand-deep-green/10 bg-card p-4 transition-colors hover:border-brand-gold/40"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {formatEventDateLine(event)}
                  {time ? ` · ${time}` : ""}
                </p>
                <p className="mt-1 font-serif text-lg font-semibold leading-snug text-foreground">{event.title}</p>
                {event.venue_name && <p className="mt-0.5 text-sm text-muted-foreground">{event.venue_name}</p>}
                <p className="mt-2 text-sm text-foreground/80">{why}</p>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
