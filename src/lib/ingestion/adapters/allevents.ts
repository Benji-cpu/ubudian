/**
 * AllEvents.in API adapter.
 *
 * Fetches events from AllEvents.in for the Ubud area.
 * API docs: https://developer.allevents.in/
 */

import type { SourceAdapter, RawMessage, ParsedEvent } from "../types";
import { registerAdapter } from "../source-adapter";

const ALLEVENTS_BASE_URL = "https://api.allevents.in/events/list";
const UBUD_LOCATION = { latitude: -8.5069, longitude: 115.2624 }; // Ubud center

const allEventsAdapter: SourceAdapter = {
  sourceSlug: "allevents-in",

  async fetchMessages(
    config: Record<string, unknown>,
    _since?: Date
  ): Promise<RawMessage[]> {
    const apiKey = process.env.ALLEVENTS_API_KEY;
    if (!apiKey) {
      throw new Error("ALLEVENTS_API_KEY is not configured");
    }

    const radius = (config.radius_km as number) || 20;
    const limit = (config.limit as number) || 50;

    const res = await fetch(ALLEVENTS_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latitude: UBUD_LOCATION.latitude,
        longitude: UBUD_LOCATION.longitude,
        radius: radius * 1000, // Convert km to meters
        page: 1,
        limit,
        key: apiKey,
      }),
    });

    if (!res.ok) {
      throw new Error(`AllEvents API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const events = data.data || data.events || [];

    return events.map((event: AllEventsEvent) => {
      const parsed: ParsedEvent = {
        title: event.eventname || event.event_name || "",
        description: event.description || "",
        short_description: event.description?.slice(0, 200) || null,
        category: mapCategory(event.category),
        venue_name: event.venue?.name || event.location || null,
        venue_address: event.venue?.full_address || event.venue?.street || null,
        start_date: formatDate(event.start_time || event.starttime_local),
        end_date: event.end_time ? formatDate(event.end_time) : null,
        start_time: formatTime(event.start_time || event.starttime_local),
        end_time: event.end_time ? formatTime(event.end_time) : null,
        price_info: event.tickets?.min_ticket_price
          ? `From ${event.tickets.currency || ""} ${event.tickets.min_ticket_price}`
          : event.tickets?.has_tickets === false
            ? "Free"
            : null,
        external_ticket_url: event.tickets?.ticket_url || event.event_url || null,
        organizer_name: event.owner?.name || null,
        cover_image_url: event.banner_url || event.thumb_url || null,
        source_url: event.event_url || null,
        source_event_id: event.event_id || event.eventid || null,
      };

      return {
        external_id: event.event_id || event.eventid,
        content_text: `${parsed.title}\n\n${parsed.description}`,
        raw_data: [parsed], // Pre-parsed
      };
    });
  },
};

function formatDate(timestamp: string | number | undefined): string {
  if (!timestamp) return new Date().toISOString().split("T")[0];
  const d = new Date(typeof timestamp === "number" ? timestamp * 1000 : timestamp);
  return d.toISOString().split("T")[0];
}

function formatTime(timestamp: string | number | undefined): string | null {
  if (!timestamp) return null;
  const d = new Date(typeof timestamp === "number" ? timestamp * 1000 : timestamp);
  return d.toTimeString().slice(0, 5); // HH:MM
}

function mapCategory(category: string | undefined): string {
  if (!category) return "Other";
  const lower = category.toLowerCase();
  if (lower.includes("dance") || lower.includes("movement")) return "Dance & Movement";
  if (lower.includes("tantra") || lower.includes("intimacy")) return "Tantra & Intimacy";
  if (lower.includes("ceremony") || lower.includes("sound") || lower.includes("cacao"))
    return "Ceremony & Sound";
  if (lower.includes("yoga") || lower.includes("meditation") || lower.includes("breathwork"))
    return "Yoga & Meditation";
  if (lower.includes("healing") || lower.includes("bodywork") || lower.includes("reiki"))
    return "Healing & Bodywork";
  if (lower.includes("circle") || lower.includes("community") || lower.includes("social") || lower.includes("networking"))
    return "Circle & Community";
  if (lower.includes("music") || lower.includes("concert")) return "Music & Performance";
  if (lower.includes("art") || lower.includes("culture") || lower.includes("exhibition"))
    return "Art & Culture";
  if (lower.includes("retreat") || lower.includes("training") || lower.includes("workshop") || lower.includes("class"))
    return "Retreat & Training";
  return "Other";
}

interface AllEventsEvent {
  event_id?: string;
  eventid?: string;
  eventname?: string;
  event_name?: string;
  description?: string;
  category?: string;
  start_time?: string | number;
  end_time?: string | number;
  starttime_local?: string;
  location?: string;
  venue?: {
    name?: string;
    full_address?: string;
    street?: string;
  };
  tickets?: {
    has_tickets?: boolean;
    min_ticket_price?: number;
    currency?: string;
    ticket_url?: string;
  };
  owner?: { name?: string };
  banner_url?: string;
  thumb_url?: string;
  event_url?: string;
}

registerAdapter(allEventsAdapter);
