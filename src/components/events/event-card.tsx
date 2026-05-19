import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatEventTime, isRecentlyAddedEvent } from "@/lib/utils";
import { formatEventDateLine } from "@/lib/events/format";
import { isFreeEvent } from "@/lib/price-parser";
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
  const isFree = isFreeEvent(event.price_info);

  return (
    <Link href={`/events/${event.slug}`} className="group block">
      <article className="relative flex gap-4 overflow-hidden rounded-xl border border-brand-deep-green/10 bg-card p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-gold/40 hover:shadow-[0_14px_30px_-18px_rgba(44,74,62,0.35)] motion-reduce:hover:translate-y-0 dark:border-brand-deep-green/20 dark:hover:shadow-[0_14px_30px_-18px_rgba(201,168,76,0.25)]">
        {/* Cover image */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg sm:h-[108px] sm:w-[156px]">
          {event.cover_image_url ? (
            <Image
              src={event.cover_image_url}
              alt=""
              fill
              sizes="(max-width: 640px) 96px, 156px"
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <EventCardPlaceholder
              category={event.category}
              className="h-full w-full"
            />
          )}
          {isFree && (
            <div className="absolute left-1.5 top-1.5 rounded-full bg-brand-gold px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-brand-deep-green shadow-sm">
              Free
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="font-serif text-lg font-medium leading-snug tracking-tight text-brand-deep-green line-clamp-1 flex-1 transition-colors">
              {event.title}
            </h3>
            {isRecentlyAddedEvent(event.created_at, event.start_date) && (
              <span className="shrink-0 rounded-full bg-brand-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-deep-green">
                New
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Badge
              variant="outline"
              className="rounded-full border-brand-deep-green/15 bg-transparent px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-brand-deep-green/80"
            >
              {event.category}
            </Badge>
            {event.is_core && (
              <span
                title="Weekly community anchor"
                className="rounded-full border border-brand-gold/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-brand-gold"
              >
                Core
              </span>
            )}
            <span className="flex items-center gap-1 font-medium text-foreground/85">
              <Calendar className="h-3 w-3 text-brand-deep-green/70" />
              {dateLine}
            </span>
            {(event.start_time || event.end_time) && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-brand-deep-green/60" />
                {formatEventTime(event.start_time, event.end_time)}
              </span>
            )}
            {event.venue_name && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-brand-deep-green/60" />
                {event.venue_name}
              </span>
            )}
          </div>

          {event.short_description && (
            <p className="mt-2 text-sm leading-relaxed text-foreground/75 line-clamp-1">
              {event.short_description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2">
            {event.price_info && !isFree && (
              <span className="text-sm font-semibold tracking-tight text-brand-terracotta">
                {event.price_info}
              </span>
            )}
            <EventCardExternalLinks
              venueMapUrl={event.venue_map_url}
              externalTicketUrl={event.external_ticket_url}
            />
            {event.organizer_name && (
              <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground/80 truncate">
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

        {/* Hairline gold accent that grows on hover */}
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-gold/70 transition-all duration-500 ease-out group-hover:w-full"
        />
      </article>
    </Link>
  );
}
