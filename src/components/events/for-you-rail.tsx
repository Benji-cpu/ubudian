import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { EventCardPlaceholder } from "./event-card-placeholder";
import { Sparkles } from "lucide-react";
import type { Event } from "@/types";

interface ForYouRailProps {
  events: Event[];
  archetypeLabel: string | null;
}

export function ForYouRail({ events, archetypeLabel }: ForYouRailProps) {
  if (!events.length) return null;

  const subtitle = archetypeLabel
    ? `Picked for ${archetypeLabel}`
    : "Picked for you this week";

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-end justify-between px-4 sm:px-0">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-brand-gold">
            <Sparkles className="h-4 w-4" />
            For you
          </div>
          <h3 className="mt-1 font-serif text-xl text-brand-deep-green sm:text-2xl">
            {subtitle}
          </h3>
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
                  {CATEGORY_EMOJI[event.category] || "✨"} {event.category}
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
