/**
 * Eventbrite API adapter.
 *
 * Fetches events from Eventbrite for the Ubud/Bali area.
 * API docs: https://www.eventbrite.com/platform/api
 */

import type { SourceAdapter, RawMessage, ParsedEvent } from "../types";
import { registerAdapter } from "../source-adapter";

const EVENTBRITE_BASE = "https://www.eventbriteapi.com/v3";
const UBUD_LOCATION = "Ubud, Bali, Indonesia";

const eventbriteAdapter: SourceAdapter = {
  sourceSlug: "eventbrite",

  async fetchMessages(
    config: Record<string, unknown>,
    _since?: Date
  ): Promise<RawMessage[]> {
    const apiKey = process.env.EVENTBRITE_API_KEY;
    if (!apiKey) {
      throw new Error("EVENTBRITE_API_KEY is not configured");
    }

    const radius = (config.radius_km as string) || "20km";
    const query = (config.query as string) || "";

    const params = new URLSearchParams({
      "location.address": UBUD_LOCATION,
      "location.within": radius,
      expand: "venue,organizer,ticket_availability",
      sort_by: "date",
    });

    if (query) params.set("q", query);

    const res = await fetch(`${EVENTBRITE_BASE}/events/search/?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Eventbrite API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const events: EventbriteEvent[] = data.events || [];

    return events.map((event) => {
      const parsed: ParsedEvent = {
        title: event.name?.text || "",
        description: event.description?.text || event.summary || "",
        short_description: event.summary?.slice(0, 200) || null,
        category: mapEventbriteCategory(event.category_id, event.subcategory_id),
        venue_name: event.venue?.name || null,
        venue_address: event.venue?.address?.localized_address_display || null,
        start_date: event.start?.local?.split("T")[0] || "",
        end_date: event.end?.local?.split("T")[0] || null,
        start_time: event.start?.local?.split("T")[1]?.slice(0, 5) || null,
        end_time: event.end?.local?.split("T")[1]?.slice(0, 5) || null,
        price_info: event.ticket_availability?.minimum_ticket_price?.display || (event.is_free ? "Free" : null),
        external_ticket_url: event.url || null,
        organizer_name: event.organizer?.name || null,
        cover_image_url: event.logo?.url || null,
        source_url: event.url || null,
        source_event_id: event.id,
      };

      return {
        external_id: event.id,
        content_text: `${parsed.title}\n\n${parsed.description}`,
        raw_data: [parsed],
      };
    });
  },
};

function mapEventbriteCategory(categoryId?: string, _subcategoryId?: string): string {
  // Eventbrite category IDs: https://www.eventbrite.com/platform/api#/reference/categories
  const map: Record<string, string> = {
    "103": "Music & Performance",
    "105": "Art & Culture",
    "107": "Yoga & Meditation",
    "108": "Dance & Movement",
    "110": "Ceremony & Sound",
    "113": "Circle & Community",
    "199": "Retreat & Training",
    "101": "Circle & Community",
    "102": "Retreat & Training",
    "104": "Art & Culture",
    "106": "Art & Culture",
    "111": "Circle & Community",
    "112": "Circle & Community",
    "115": "Circle & Community",
  };
  return map[categoryId || ""] || "Other";
}

interface EventbriteEvent {
  id: string;
  name?: { text?: string };
  description?: { text?: string };
  summary?: string;
  url?: string;
  start?: { local?: string };
  end?: { local?: string };
  is_free?: boolean;
  category_id?: string;
  subcategory_id?: string;
  venue?: {
    name?: string;
    address?: { localized_address_display?: string };
  };
  organizer?: { name?: string };
  logo?: { url?: string };
  ticket_availability?: {
    minimum_ticket_price?: { display?: string };
  };
}

registerAdapter(eventbriteAdapter);
