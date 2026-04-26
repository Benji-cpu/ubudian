import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatEventTime, isRecentlyAddedEvent } from "@/lib/utils";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { formatEventDateLine } from "@/lib/events/format";
import { EventCardPlaceholder } from "./event-card-placeholder";
import { EventCardExternalLinks } from "./event-card-external-links";
import { MapPin, Clock, Calendar, User } from "lucide-react";
import type { Event } from "@/types";

interface EventCardProps {
  event: Event;
  saveButton?: React.ReactNode;
}

export function EventCard({ event, saveButton }: EventCardProps) {
  const dateLine = formatEventDateLine(event);
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
            {event.is_core && (
              <span
                title="Weekly community anchor"
                className="rounded border border-brand-gold/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-gold"
              >
                Core
              </span>
            )}
            {isRecentlyAddedEvent(event.created_at, event.start_date) && (
              <span className="rounded bg-brand-gold px-1.5 py-0.5 text-xs font-medium text-white">
                New
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateLine}
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

          {event.short_description && (
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-1">
              {event.short_description}
            </p>
          )}

          <div className="mt-1.5 flex items-center gap-2">
            {event.price_info && (
              <span className="text-sm font-medium text-brand-terracotta">
                {event.price_info}
              </span>
            )}
            <EventCardExternalLinks
              venueMapUrl={event.venue_map_url}
              externalTicketUrl={event.external_ticket_url}
            />
            {event.organizer_name && (
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground truncate">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">{event.organizer_name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Save button */}
        {saveButton && (
          <div className="flex shrink-0 items-center">{saveButton}</div>
        )}
      </article>
    </Link>
  );
}
