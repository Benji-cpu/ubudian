import type { Event } from "@/types";
import type { HubConfig } from "@/lib/hubs";
import { SITE_URL } from "@/lib/constants";
import { rolledForward, sortRolledEvents } from "@/lib/events/buckets";
import { eventJsonLd, jsonLdScript } from "@/lib/events/event-jsonld";

/** The list a hub page gives Google: its events as dated occurrences, soonest first, at most 20. */
export function hubListEvents(events: Event[], now: Date = new Date()): Event[] {
  // A weekly class is stored with the date it was first listed; Google needs its next date.
  return sortRolledEvents(rolledForward(events, now), "date").slice(0, 20);
}

/**
 * CollectionPage + ItemList of Event nodes for a hub page. Each Event is
 * built by `eventJsonLd`, the same builder the event and timetable pages use.
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
      itemListElement: hubListEvents(events).map((event, i) => {
        // The page's own @context covers the nested events.
        const item = { ...eventJsonLd(event) };
        delete item["@context"];
        const description = event.short_description || event.description?.slice(0, 200);
        return {
          "@type": "ListItem",
          position: i + 1,
          item: { ...item, ...(description && { description }) },
        };
      }),
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />;
}
