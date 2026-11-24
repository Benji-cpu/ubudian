import type { Event } from "@/types";
import { eventJsonLd, jsonLdScript } from "@/lib/events/event-jsonld";

interface EventJsonLdProps {
  /** The event as the page shows it: a weekly class already rolled forward to its next date. */
  event: Event;
}

/**
 * schema.org Event for an event's own page. Built by the same `eventJsonLd`
 * the timetable pages use, so every page gives Google the same shape: Bali
 * time with its offset, a location even when the venue is unknown (Google
 * rejects an Event without one), and a priced offer.
 */
export function EventJsonLd({ event }: EventJsonLdProps) {
  const description = event.short_description || event.description?.slice(0, 200);
  const jsonLd = { ...eventJsonLd(event), ...(description && { description }) };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />;
}
