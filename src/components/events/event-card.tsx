import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatEventTime } from "@/lib/utils";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { EventCardPlaceholder } from "./event-card-placeholder";
import { MapPin, Clock, Calendar, User } from "lucide-react";
import type { Event } from "@/types";

interface EventCardProps {
  event: Event;
  saveButton?: React.ReactNode;
}

export function EventCard({ event, saveButton }: EventCardProps) {
  const startDate = new Date(event.start_date);
  const emoji = CATEGORY_EMOJI[event.category] || CATEGORY_EMOJI["Other"];

  return (
    <Link href={`/events/${event.slug}`} className="group block">
      <article className="flex gap-4 rounded-sm border border-brand-gold/10 bg-card p-4 transition-shadow hover:shadow-md">
        {/* Cover image */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded sm:h-[100px] sm:w-[140px]">
          {event.cover_image_url ? (
            <Image
              src={event.cover_image_url}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 96px, 140px"
              className="object-cover"
            />
          ) : (
            <EventCardPlaceholder
              category={event.category}
              className="h-full w-full"
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg font-medium leading-snug text-foreground line-clamp-1 group-hover:text-primary">
            {event.title}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {emoji} {event.category}
            </Badge>
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
                {event.venue_name}
              </span>
            )}
          </div>

          {event.organizer_name && (
            <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {event.organizer_name}
            </span>
          )}

          {event.price_info && (
            <span className="mt-1 inline-block text-sm font-medium text-brand-terracotta">
              {event.price_info}
            </span>
          )}
        </div>

        {/* Save button */}
        {saveButton && (
          <div className="flex shrink-0 items-center">{saveButton}</div>
        )}
      </article>
    </Link>
  );
}
