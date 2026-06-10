import type { Event } from "@/types";
import type { HubConfig } from "@/lib/hubs";
import { SITE_URL } from "@/lib/constants";

/**
 * CollectionPage + ItemList of Event nodes for a hub page. Field mapping
 * mirrors EventJsonLd (event detail pages) so Google sees a consistent shape.
 */
export function HubJsonLd({ hub, events }: { hub: HubConfig; events: Event[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: hub.title,
    description: hub.metaDescription,
    url: `${SITE_URL}/${hub.slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "The Ubudian",
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: events.slice(0, 20).map((event, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Event",
          name: event.title,
          description: event.short_description || event.description?.slice(0, 200),
          startDate: event.start_time
            ? `${event.start_date}T${event.start_time}`
            : event.start_date,
          ...(event.venue_name && {
            location: {
              "@type": "Place",
              name: event.venue_name,
              address: {
                "@type": "PostalAddress",
                addressLocality: "Ubud",
                addressRegion: "Bali",
                addressCountry: "ID",
              },
            },
          }),
          ...(event.cover_image_url && { image: event.cover_image_url }),
          url: `${SITE_URL}/events/${event.slug}`,
        },
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
