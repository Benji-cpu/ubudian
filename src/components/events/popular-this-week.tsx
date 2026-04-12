import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { EventCardPlaceholder } from "@/components/events/event-card-placeholder";
import { Calendar, Heart } from "lucide-react";
import type { Event } from "@/types";

interface PopularEvent extends Event {
  save_count: number;
}

interface PopularThisWeekProps {
  events: PopularEvent[];
}

export function PopularThisWeek({ events }: PopularThisWeekProps) {
  if (events.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2">
        <h2 className="font-serif text-xl font-semibold text-brand-deep-green">
          Popular This Week
        </h2>
        <Badge variant="outline" className="text-xs text-brand-terracotta border-brand-terracotta/30">
          <Heart className="mr-1 h-3 w-3 fill-brand-terracotta" />
          Trending
        </Badge>
      </div>

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {events.map((event) => {
          const emoji =
            CATEGORY_EMOJI[event.category] || CATEGORY_EMOJI["Other"];
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group block w-56 shrink-0"
            >
              <article className="overflow-hidden rounded-lg border border-brand-gold/10 bg-card transition-shadow hover:shadow-md">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {event.cover_image_url ? (
                    <Image
                      src={event.cover_image_url}
                      alt=""
                      fill
                      sizes="224px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <EventCardPlaceholder
                      category={event.category}
                      className="h-full w-full text-3xl"
                    />
                  )}
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-black/60 text-white backdrop-blur-sm hover:bg-black/60 text-[10px]">
                      {emoji} {event.category}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-serif text-sm font-medium leading-snug text-foreground line-clamp-2 group-hover:text-primary">
                    {event.title}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(event.start_date), "MMM d")}
                    </span>
                    <span className="flex items-center gap-1 text-brand-terracotta">
                      <Heart className="h-3 w-3 fill-brand-terracotta" />
                      {event.save_count}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
