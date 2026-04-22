import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEventTime } from "@/lib/utils";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { EventCardPlaceholder } from "./event-card-placeholder";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import type { Event } from "@/types";

interface HeroEventProps {
  event: Event;
  saveButton?: React.ReactNode;
}

export function HeroEvent({ event, saveButton }: HeroEventProps) {
  const emoji = CATEGORY_EMOJI[event.category] || CATEGORY_EMOJI["Other"];
  const startDate = new Date(event.start_date);

  return (
    <section className="relative mx-auto max-w-7xl overflow-hidden rounded-xl border border-brand-gold/15 bg-card shadow-sm">
      <Link href={`/events/${event.slug}`} className="group block">
        <div className="grid grid-cols-1 md:grid-cols-5">
          <div className="relative aspect-[16/10] md:col-span-3 md:aspect-auto md:min-h-[22rem]">
            {event.cover_image_url ? (
              <Image
                src={event.cover_image_url}
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            ) : (
              <EventCardPlaceholder
                category={event.category}
                className="h-full w-full text-6xl"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <Badge className="bg-brand-gold text-white hover:bg-brand-gold">
                Featured today
              </Badge>
              <Badge className="bg-black/60 text-white backdrop-blur-sm hover:bg-black/60">
                {emoji} {event.category}
              </Badge>
            </div>
            {saveButton && (
              <div className="absolute right-4 top-4 rounded-full bg-background/90 backdrop-blur-sm">
                {saveButton}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between p-6 md:col-span-2 md:p-8">
            <div>
              <h2 className="font-serif text-2xl font-medium leading-tight text-brand-deep-green sm:text-3xl md:text-[2rem] md:leading-[1.15] group-hover:text-brand-gold transition-colors">
                {event.title}
              </h2>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-gold" />
                  <span>{format(startDate, "EEEE, MMMM d")}</span>
                </div>
                {(event.start_time || event.end_time) && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-gold" />
                    <span>{formatEventTime(event.start_time, event.end_time)}</span>
                  </div>
                )}
                {event.venue_name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand-gold" />
                    <span className="line-clamp-1">{event.venue_name}</span>
                  </div>
                )}
              </div>

              {event.short_description && (
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {event.short_description}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              {event.price_info && (
                <span className="text-base font-semibold text-brand-terracotta">
                  {event.price_info}
                </span>
              )}
              <Button variant="ghost" className="ml-auto gap-1 text-brand-deep-green">
                Read more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
