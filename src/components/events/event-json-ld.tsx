import type { Event } from "@/types";
import { SITE_URL } from "@/lib/constants";

interface EventJsonLdProps {
  event: Event;
}

export function EventJsonLd({ event }: EventJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.short_description || event.description?.slice(0, 200),
    startDate: event.start_time
      ? `${event.start_date}T${event.start_time}`
      : event.start_date,
    ...(event.end_date && {
      endDate: event.end_time
        ? `${event.end_date}T${event.end_time}`
        : event.end_date,
    }),
    ...(event.venue_name && {
      location: {
        "@type": "Place",
        name: event.venue_name,
        ...(event.venue_address && {
          address: {
            "@type": "PostalAddress",
            streetAddress: event.venue_address,
            addressLocality: "Ubud",
            addressRegion: "Bali",
            addressCountry: "ID",
          },
        }),
      },
    }),
    ...(event.cover_image_url && { image: event.cover_image_url }),
    ...(event.organizer_name && {
      organizer: {
        "@type": "Organization",
        name: event.organizer_name,
      },
    }),
    ...(event.price_info && {
      offers: {
        "@type": "Offer",
        description: event.price_info,
        url: event.external_ticket_url || `${SITE_URL}/events/${event.slug}`,
      },
    }),
    url: `${SITE_URL}/events/${event.slug}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
