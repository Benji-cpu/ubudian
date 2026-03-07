/**
 * Facebook Pages API adapter.
 *
 * Fetches events from Facebook Pages related to Ubud venues/communities.
 * Requires Meta App with pages_read_engagement permission.
 *
 * Note: Facebook's API is restrictive — Page events require App Review.
 * This adapter works with approved Page access tokens.
 */

import type { SourceAdapter, RawMessage, ParsedEvent } from "../types";
import { registerAdapter } from "../source-adapter";

const GRAPH_API_BASE = "https://graph.facebook.com/v18.0";

const facebookAdapter: SourceAdapter = {
  sourceSlug: "facebook",

  async fetchMessages(
    config: Record<string, unknown>,
    _since?: Date
  ): Promise<RawMessage[]> {
    const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("META_PAGE_ACCESS_TOKEN is not configured");
    }

    // Page IDs to fetch events from (configured per source)
    const pageIds = (config.page_ids as string[]) || [];
    if (pageIds.length === 0) {
      console.warn("[facebook] No page_ids configured");
      return [];
    }

    const allMessages: RawMessage[] = [];

    for (const pageId of pageIds) {
      try {
        const res = await fetch(
          `${GRAPH_API_BASE}/${pageId}/events?fields=name,description,start_time,end_time,place,cover,ticket_uri,owner&limit=25&access_token=${accessToken}`
        );

        if (!res.ok) {
          console.error(`[facebook] Failed to fetch events for page ${pageId}: ${res.status}`);
          continue;
        }

        const data = await res.json();
        const events: FBEvent[] = data.data || [];

        for (const event of events) {
          const startDate = event.start_time ? new Date(event.start_time) : new Date();
          const endDate = event.end_time ? new Date(event.end_time) : null;

          const parsed: ParsedEvent = {
            title: event.name || "",
            description: event.description || "",
            short_description: event.description?.slice(0, 200) || null,
            category: "Other",
            venue_name: event.place?.name || null,
            venue_address: event.place?.location
              ? [event.place.location.street, event.place.location.city]
                  .filter(Boolean)
                  .join(", ")
              : null,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate?.toISOString().split("T")[0] || null,
            start_time: startDate.toTimeString().slice(0, 5),
            end_time: endDate?.toTimeString().slice(0, 5) || null,
            external_ticket_url: event.ticket_uri || null,
            organizer_name: event.owner?.name || null,
            cover_image_url: event.cover?.source || null,
            source_url: `https://www.facebook.com/events/${event.id}`,
            source_event_id: event.id,
          };

          allMessages.push({
            external_id: `fb-${event.id}`,
            content_text: `${parsed.title}\n\n${parsed.description}`,
            raw_data: [parsed],
          });
        }
      } catch (err) {
        console.error(`[facebook] Error fetching page ${pageId}:`, err);
      }
    }

    return allMessages;
  },
};

interface FBEvent {
  id: string;
  name?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  place?: {
    name?: string;
    location?: { street?: string; city?: string };
  };
  cover?: { source?: string };
  ticket_uri?: string;
  owner?: { name?: string };
}

registerAdapter(facebookAdapter);
