import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Ticket } from "lucide-react";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { EventCardPlaceholder } from "./event-card-placeholder";
import type { Event } from "@/types";

interface EventHeroProps {
  event: Event;
  saveButton?: React.ReactNode;
}

export function EventHero({ event, saveButton }: EventHeroProps) {
  const emoji = CATEGORY_EMOJI[event.category] || CATEGORY_EMOJI["Other"];
  const hasImage = Boolean(event.cover_image_url);

  return (
    <section className="relative mx-auto max-w-5xl overflow-hidden sm:mt-6 sm:rounded-2xl sm:border sm:border-brand-gold/15 sm:shadow-sm">
      {/* Image wrapper */}
      <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[21/9] md:aspect-[16/7]">
        {hasImage ? (
          <Image
            src={event.cover_image_url as string}
            alt={event.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        ) : (
          <EventCardPlaceholder
            category={event.category}
            className="h-full w-full text-6xl"
          />
        )}

        {/* Gradient scrim — stronger at the bottom where the title sits on desktop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent md:from-black/80 md:via-black/40"
        />

        {/* Top-left chips (category) */}
        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 sm:left-6 sm:top-6">
          <Badge className="bg-black/60 text-white backdrop-blur-sm hover:bg-black/60">
            {emoji} {event.category}
          </Badge>
        </div>

        {/* Top-right save button */}
        {saveButton && (
          <div className="absolute right-4 top-4 rounded-full bg-white/90 shadow-sm backdrop-blur-sm sm:right-6 sm:top-6">
            {saveButton}
          </div>
        )}

        {/* Desktop-only: title & meta overlay at the bottom of the image */}
        <div className="absolute inset-x-0 bottom-0 hidden p-8 md:block lg:p-10">
          <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-white drop-shadow-sm lg:text-5xl">
            {event.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Chip>
              <Calendar className="h-3.5 w-3.5 text-brand-gold" />
              {formatEventDate(event.start_date, event.end_date)}
            </Chip>
            {(event.start_time || event.end_time) && (
              <Chip>
                <Clock className="h-3.5 w-3.5 text-brand-gold" />
                {formatEventTime(event.start_time, event.end_time)}
              </Chip>
            )}
            {event.price_info && (
              <Chip variant="price">
                <Ticket className="h-3.5 w-3.5" />
                {event.price_info}
              </Chip>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-only: title & meta stacked under the image */}
      <div className="bg-brand-cream/40 px-4 py-6 md:hidden">
        <h1 className="font-serif text-3xl font-semibold leading-[1.15] tracking-tight text-brand-deep-green sm:text-4xl">
          {event.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip variant="light">
            <Calendar className="h-3.5 w-3.5 text-brand-gold" />
            {formatEventDate(event.start_date, event.end_date)}
          </Chip>
          {(event.start_time || event.end_time) && (
            <Chip variant="light">
              <Clock className="h-3.5 w-3.5 text-brand-gold" />
              {formatEventTime(event.start_time, event.end_time)}
            </Chip>
          )}
          {event.price_info && (
            <Chip variant="price-light">
              <Ticket className="h-3.5 w-3.5" />
              {event.price_info}
            </Chip>
          )}
        </div>
      </div>
    </section>
  );
}

function Chip({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "light" | "price" | "price-light";
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm";

  const styles: Record<typeof variant, string> = {
    default: "bg-white/95 text-brand-deep-green shadow-sm",
    light: "bg-white text-brand-deep-green ring-1 ring-brand-gold/20",
    price: "bg-brand-terracotta text-white shadow-sm",
    "price-light": "bg-brand-terracotta/10 text-brand-terracotta ring-1 ring-brand-terracotta/20",
  };

  return <span className={`${base} ${styles[variant]}`}>{children}</span>;
}
