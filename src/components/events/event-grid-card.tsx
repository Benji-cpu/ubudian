import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatEventTime } from "@/lib/utils";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { EventCardPlaceholder } from "./event-card-placeholder";
import { MapPin, Clock, Calendar, User } from "lucide-react";
import type { Event } from "@/types";

interface EventGridCardProps {
  event: Event;
}

export function EventGridCard({ event }: EventGridCardProps) {
  const startDate = new Date(event.start_date);
  const emoji = CATEGORY_EMOJI[event.category] || CATEGORY_EMOJI["Other"];

  return (
    <Link href={`/events/${event.slug}`} className="group block">
      <article className="overflow-hidden rounded-lg border border-brand-gold/10 bg-card transition-shadow hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {event.cover_image_url ? (
            <Image
              src={event.cover_image_url}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <EventCardPlaceholder
              category={event.category}
              className="h-full w-full text-4xl"
            />
          )}

          {/* Category badge overlay (bottom-left) */}
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-black/60 text-white backdrop-blur-sm hover:bg-black/60">
              {emoji} {event.category}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-serif text-lg font-medium leading-snug text-foreground line-clamp-2 group-hover:text-primary">
            {event.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(startDate, "MMM d")}
            </span>
            {(event.start_time || event.end_time) && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatEventTime(event.start_time, event.end_time)}
              </span>
            )}
            {event.venue_name && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{event.venue_name}</span>
              </span>
            )}
          </div>

          {event.short_description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {event.short_description}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            {event.price_info && (
              <span className="text-sm font-medium text-brand-terracotta">
                {event.price_info}
              </span>
            )}
            {event.organizer_name && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {event.organizer_name}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
