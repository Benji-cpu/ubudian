/**
 * Meetup GraphQL API adapter.
 *
 * Fetches events near Ubud coordinates using Meetup's GraphQL API.
 * API docs: https://www.meetup.com/api/
 */

import type { SourceAdapter, RawMessage, ParsedEvent } from "../types";
import { registerAdapter } from "../source-adapter";

const MEETUP_GRAPHQL_URL = "https://api.meetup.com/gql";
const UBUD_LAT = -8.5069;
const UBUD_LON = 115.2624;

const SEARCH_EVENTS_QUERY = `
  query SearchEvents($lat: Float!, $lon: Float!, $radius: Int!, $first: Int!) {
    rankedEvents(
      filter: { lat: $lat, lon: $lon, radius: $radius, source: EVENTS }
      first: $first
    ) {
      edges {
        node {
          id
          title
          description
          dateTime
          endTime
          eventUrl
          going
          venue {
            name
            address
            city
          }
          host {
            name
          }
          group {
            name
            urlname
          }
          images {
            source
          }
          feeSettings {
            amount
            currency
          }
          eventType
        }
      }
    }
  }
`;

const meetupAdapter: SourceAdapter = {
  sourceSlug: "meetup",

  async fetchMessages(
    config: Record<string, unknown>,
    _since?: Date
  ): Promise<RawMessage[]> {
    const apiKey = process.env.MEETUP_API_KEY;
    if (!apiKey) {
      throw new Error("MEETUP_API_KEY is not configured");
    }

    const radius = (config.radius_miles as number) || 15; // Meetup uses miles
    const limit = (config.limit as number) || 50;

    const res = await fetch(MEETUP_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: SEARCH_EVENTS_QUERY,
        variables: {
          lat: UBUD_LAT,
          lon: UBUD_LON,
          radius,
          first: limit,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Meetup API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const edges = data.data?.rankedEvents?.edges || [];

    return edges.map((edge: { node: MeetupEvent }) => {
      const event = edge.node;
      const startDate = event.dateTime ? new Date(event.dateTime) : new Date();
      const endDate = event.endTime ? new Date(event.endTime) : null;

      const parsed: ParsedEvent = {
        title: event.title || "",
        description: event.description || "",
        short_description: event.description?.slice(0, 200) || null,
        category: mapMeetupCategory(event.eventType),
        venue_name: event.venue?.name || null,
        venue_address: [event.venue?.address, event.venue?.city]
          .filter(Boolean)
          .join(", ") || null,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate?.toISOString().split("T")[0] || null,
        start_time: startDate.toTimeString().slice(0, 5),
        end_time: endDate?.toTimeString().slice(0, 5) || null,
        price_info: event.feeSettings
          ? `${event.feeSettings.currency} ${event.feeSettings.amount}`
          : "Free",
        external_ticket_url: event.eventUrl || null,
        organizer_name: event.host?.name || event.group?.name || null,
        cover_image_url: event.images?.[0]?.source || null,
        source_url: event.eventUrl || null,
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

function mapMeetupCategory(eventType?: string): string {
  if (!eventType) return "Community & Social";
  const lower = eventType.toLowerCase();
  if (lower.includes("online")) return "Community & Social";
  if (lower.includes("physical")) return "Community & Social";
  return "Community & Social"; // Meetup events are mostly social/community
}

interface MeetupEvent {
  id: string;
  title?: string;
  description?: string;
  dateTime?: string;
  endTime?: string;
  eventUrl?: string;
  going?: number;
  venue?: { name?: string; address?: string; city?: string };
  host?: { name?: string };
  group?: { name?: string; urlname?: string };
  images?: Array<{ source?: string }>;
  feeSettings?: { amount?: number; currency?: string };
  eventType?: string;
}

registerAdapter(meetupAdapter);
