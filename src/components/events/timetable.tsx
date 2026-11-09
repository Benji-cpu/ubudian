import Link from "next/link";
import { ArrowRight, ExternalLink, MapPin } from "lucide-react";
import { NewsletterSignup } from "@/components/layout/newsletter-signup";
import { eventJsonLd, jsonLdScript } from "@/lib/events/event-jsonld";
import { eventMapHref, NO_VENUE, outboundLink, shortDate } from "@/lib/events/timetable";
import { HUBS } from "@/lib/hubs";
import { displayPrice, mentionsResidentPrice, RESIDENT_PRICE_FOOTNOTE } from "@/lib/price-display";
import { formatEventTime } from "@/lib/utils";
import type { Event } from "@/types";
import { PriceTag } from "./price-tag";

const linkClass =
  "inline-flex min-h-8 items-center gap-1 font-medium text-brand-deep-green underline-offset-4 hover:underline dark:text-brand-gold";

/** One listing on a dated page: time, title, venue with a map link (or a line saying there is none), price, and the ticket or listing link. */
export function TimetableRow({ event }: { event: Event }) {
  const venue = event.venue_name?.trim() || null;
  const multiDay = !!event.end_date && event.end_date > event.start_date;
  const start = event.start_time ? formatEventTime(event.start_time) : null;
  const until = multiDay ? `until ${shortDate(event.end_date!)}` : event.end_time && start ? `to ${formatEventTime(event.end_time)}` : null;
  const map = venue ? eventMapHref(event) : null;
  const out = outboundLink(event);

  return (
    <li className="flex gap-4 py-4 sm:gap-6">
      <div className="w-[4.5rem] shrink-0 pt-0.5 sm:w-24">
        <p className="font-semibold leading-tight text-brand-deep-green dark:text-brand-gold">{start ?? "Time not listed"}</p>
        {until ? <p className="mt-0.5 text-xs text-muted-foreground">{until}</p> : null}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-lg font-medium leading-snug text-foreground">
          <Link href={`/events/${event.slug}`} className="underline-offset-4 hover:underline">
            {event.title}
          </Link>
        </h3>
        {venue ? (
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="break-words">{venue}</span>
            </span>
            {map ? (
              <a href={map} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label={`Map: ${venue}`}>
                Map
              </a>
            ) : null}
          </p>
        ) : (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {NO_VENUE}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <PriceTag price={displayPrice(event.price_info)} />
          {out ? (
            <a href={out.href} target="_blank" rel="noopener noreferrer" data-signal-event={event.id} className={`text-sm ${linkClass}`}>
              {out.label}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/**
 * The small print under a timetable: Bali time, prices change at the door,
 * and, once per page, what a KITAS / KTP price means when any row shows one.
 */
export function TimetableNotes({ events }: { events: Event[] }) {
  const resident = mentionsResidentPrice(events.map((e) => e.price_info));
  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>Times are Bali time. Prices often change at the door, so check with the organiser before you go.</p>
      {resident ? <p>{RESIDENT_PRICE_FOOTNOTE}</p> : null}
    </div>
  );
}

/** One schema.org Event per row, in one script. */
export function TimetableJsonLd({ events }: { events: Event[] }) {
  if (events.length === 0) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(events.map((e) => eventJsonLd(e))) }} />;
}

/** The weekly email, one compact line. */
export function TimetableSubscribe({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-brand-gold/20 bg-brand-gold/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-foreground">Get this week&apos;s picks and new deals every Wednesday. Free.</p>
      <div className="w-full sm:max-w-sm">
        <NewsletterSignup source={source} />
      </div>
    </div>
  );
}

/** The practice hubs and the other timetable pages, for readers and for search. */
export function TimetableLinks({ current }: { current: "tonight" | "week" }) {
  const pill =
    "rounded-full border border-brand-gold/30 px-4 py-1.5 text-sm text-foreground transition-colors hover:border-brand-gold hover:bg-brand-gold/10";
  return (
    <section className="border-t border-border pt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">By practice</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {HUBS.map((h) => (
          <Link key={h.slug} href={`/${h.slug}`} className={pill}>
            {h.title}
          </Link>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-x-6 text-sm">
        {current === "tonight" ? (
          <Link href="/ubud-events-this-week" className={linkClass}>
            Ubud events this week <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <Link href="/ubud-tonight" className={linkClass}>
            Things to do in Ubud tonight <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
        <Link href="/events" className={linkClass}>
          The full calendar <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link href="/deals" className={linkClass}>
          Food deals today <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
