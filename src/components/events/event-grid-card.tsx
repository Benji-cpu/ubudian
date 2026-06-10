import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatEventTime, isRecentlyAddedEvent } from "@/lib/utils";
import { formatEventDateLine } from "@/lib/events/format";
import { getTimeSensitivityLabel } from "@/lib/events/discovery";
import { isFreeEvent } from "@/lib/price-parser";
import { categoryShortLabel } from "@/lib/constants";
import { EventCardPlaceholder } from "./event-card-placeholder";
import { EventCardExternalLinks } from "./event-card-external-links";
import { MapPin, Clock, Calendar, User } from "lucide-react";
import type { Event } from "@/types";

interface EventGridCardProps {
  event: Event;
  saveButton?: React.ReactNode;
  /** Tailwind aspect class applied to the cover image, e.g. `aspect-[4/5]`.
      Lets the parent vary heights to create a staggered masonry feel. */
  aspectClass?: string;
}

export function EventGridCard({
  event,
  saveButton,
  aspectClass = "aspect-[16/10]",
}: EventGridCardProps) {
  const dateLine = formatEventDateLine(event);
  const isFree = isFreeEvent(event.price_info);
  const timeSensitivity = getTimeSensitivityLabel(event);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative block focus-visible:outline-none"
    >
      <article className="relative overflow-hidden rounded-2xl border border-brand-deep-green/10 bg-card transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-gold/40 hover:shadow-[0_18px_40px_-20px_rgba(44,74,62,0.4)] motion-reduce:hover:translate-y-0 dark:border-brand-deep-green/20 dark:hover:shadow-[0_18px_40px_-20px_rgba(201,168,76,0.25)]">
        {/* Image */}
        <div className={`relative ${aspectClass} overflow-hidden`}>
          {event.cover_image_url ? (
            <Image
              src={event.cover_image_url}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-[center_25%] transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <EventCardPlaceholder
              category={event.category}
              className="h-full w-full"
            />
          )}

          {/* Soft top-down gradient for legibility of overlay chips */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 opacity-80"
          />

          {/* Save button overlay (top-right) */}
          {saveButton && (
            <div className="absolute right-2.5 top-2.5 rounded-full bg-white/85 p-0.5 shadow-md backdrop-blur-sm dark:bg-card/85">
              {saveButton}
            </div>
          )}

          {/* Free ribbon (top-left) */}
          {isFree && (
            <div className="absolute left-3 top-3 rounded-full bg-brand-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2C4A3E] shadow-md">
              Free
            </div>
          )}

          {/* Category + new badges (bottom-left) */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
            <Badge className="rounded-full border-transparent bg-[#1A1A1A]/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FAF5EC] backdrop-blur-md hover:bg-[#1A1A1A]/70">
              {categoryShortLabel(event.category)}
            </Badge>
            {timeSensitivity ? (
              <span className="rounded-full bg-[#B85C3F] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-sm">
                {timeSensitivity}
              </span>
            ) : (
              isRecentlyAddedEvent(event.created_at, event.start_date) && (
                <span className="rounded-full bg-[#FAF5EC]/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#2C4A3E]">
                  New
                </span>
              )
            )}
          </div>

          {/* Hairline gold accent that grows on hover */}
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-[2px] w-0 bg-brand-gold/80 transition-all duration-500 ease-out group-hover:w-full"
          />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="font-serif text-xl font-medium leading-snug tracking-tight text-brand-deep-green line-clamp-2 transition-colors group-hover:text-brand-deep-green">
            {event.title}
          </h3>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
                <span className="line-clamp-1">{event.venue_name}</span>
              </span>
            )}
          </div>

          {event.short_description && (
            <p className="mt-2.5 text-sm leading-relaxed text-foreground/75 line-clamp-2">
              {event.short_description}
            </p>
          )}

          <div className="mt-3.5 flex items-center justify-between border-t border-brand-deep-green/10 pt-3 dark:border-brand-deep-green/15">
            <div className="flex items-center gap-2">
              {event.price_info && !isFree && (
                <span className="text-sm font-semibold tracking-tight text-brand-terracotta">
                  {event.price_info}
                </span>
              )}
              <EventCardExternalLinks
                venueMapUrl={event.venue_map_url}
                externalTicketUrl={event.external_ticket_url}
              />
            </div>
            {event.organizer_name && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                <User className="h-3 w-3" />
                <span className="line-clamp-1">{event.organizer_name}</span>
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
