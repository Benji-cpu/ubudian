import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { EventCardPlaceholder } from "./event-card-placeholder";
import { Sparkles } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Event } from "@/types";

interface ForYouRailProps {
  events: Event[];
  archetypeLabel: string | null;
  /** How many events the viewer has saved — surfaces in the "why these"
      explainer so the rail is honest about its signal. */
  savedCount?: number;
}

export function ForYouRail({
  events,
  archetypeLabel,
  savedCount = 0,
}: ForYouRailProps) {
  if (!events.length) return null;

  const hasArchetype = !!archetypeLabel;
  const hasSaves = savedCount > 0;

  // Headline subtitle reads honestly: name the signal we used. If neither
  // signal exists this rail shouldn't have rendered at all — `agenda-feed`
  // owns that gate — but we keep a sensible fallback string just in case.
  let subtitle: string;
  if (hasArchetype && hasSaves) {
    subtitle = `From ${archetypeLabel} + the ${savedCount} you saved`;
  } else if (hasArchetype) {
    subtitle = `Picked for ${archetypeLabel}`;
  } else if (hasSaves) {
    subtitle = `Picked from the ${savedCount} you saved`;
  } else {
    subtitle = "Top picks this week";
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-end justify-between px-4 sm:px-0">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-brand-gold">
            <Sparkles className="h-4 w-4" />
            For you
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="font-serif text-xl text-brand-deep-green sm:text-2xl">
              {subtitle}
            </h3>
            <Popover>
              <PopoverTrigger
                aria-label="How we pick these"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-brand-deep-green/20 text-[10px] font-semibold text-brand-deep-green/70 transition hover:border-brand-deep-green/40 hover:text-brand-deep-green dark:text-brand-gold/70 dark:hover:text-brand-gold"
              >
                ?
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="max-w-xs text-sm text-foreground"
              >
                <p className="font-serif text-base font-medium text-brand-deep-green">
                  How we pick these
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  {hasArchetype && (
                    <li>
                      Your archetype from the quiz —{" "}
                      <span className="font-medium text-brand-deep-green dark:text-brand-gold">
                        {archetypeLabel}
                      </span>
                      .
                    </li>
                  )}
                  {hasSaves && (
                    <li>
                      The {savedCount}{" "}
                      {savedCount === 1 ? "event" : "events"} you&apos;ve saved —
                      we lean toward similar categories and venues.
                    </li>
                  )}
                  <li>How soon it&apos;s on, and how the community has rated it.</li>
                  {!hasArchetype && !hasSaves && (
                    <li>
                      No personal signal yet. These are simply this week&apos;s
                      strongest.{" "}
                      <Link
                        href="/quiz"
                        className="font-medium text-brand-deep-green underline-offset-2 hover:underline dark:text-brand-gold"
                      >
                        Take the quiz
                      </Link>{" "}
                      to make this more yours.
                    </li>
                  )}
                </ul>
                <p className="mt-3 text-[11px] italic text-muted-foreground/80">
                  We don&apos;t track which events you click — only what you save.
                </p>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="scrollbar-thin -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-4 pb-2">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group w-64 shrink-0 overflow-hidden rounded-lg border border-brand-gold/10 bg-card transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {event.cover_image_url ? (
                  <Image
                    src={event.cover_image_url}
                    alt=""
                    fill
                    sizes="256px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <EventCardPlaceholder
                    category={event.category}
                    className="h-full w-full text-4xl"
                  />
                )}
                <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {event.category}
                </div>
              </div>
              <div className="p-3">
                <h4 className="line-clamp-2 font-serif text-sm font-medium leading-snug text-foreground group-hover:text-brand-gold">
                  {event.title}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {format(new Date(event.start_date), "EEE, MMM d")}
                  {event.venue_name ? ` · ${event.venue_name}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
