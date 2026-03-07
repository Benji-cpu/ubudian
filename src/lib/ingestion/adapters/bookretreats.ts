/**
 * BookRetreats adapter (via RapidAPI).
 *
 * Fetches wellness and retreat events near Ubud from BookRetreats.
 * API accessed through RapidAPI marketplace.
 */

import type { SourceAdapter, RawMessage, ParsedEvent } from "../types";
import { registerAdapter } from "../source-adapter";

const BOOKRETREATS_HOST = "bookretreats.p.rapidapi.com";

const bookretreatAdapter: SourceAdapter = {
  sourceSlug: "bookretreats",

  async fetchMessages(
    config: Record<string, unknown>,
    _since?: Date
  ): Promise<RawMessage[]> {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      throw new Error("RAPIDAPI_KEY is not configured");
    }

    const location = (config.location as string) || "ubud-bali";
    const limit = (config.limit as number) || 20;

    const res = await fetch(
      `https://${BOOKRETREATS_HOST}/retreats?location=${encodeURIComponent(location)}&limit=${limit}`,
      {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": BOOKRETREATS_HOST,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`BookRetreats API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const retreats: BookRetreat[] = data.retreats || data.data || data || [];

    if (!Array.isArray(retreats)) return [];

    return retreats.map((retreat) => {
      const parsed: ParsedEvent = {
        title: retreat.title || retreat.name || "",
        description: retreat.description || "",
        short_description: retreat.summary?.slice(0, 200) || retreat.description?.slice(0, 200) || null,
        category: "Yoga & Wellness",
        venue_name: retreat.location?.name || retreat.venue || null,
        venue_address: retreat.location?.address || null,
        start_date: retreat.start_date || retreat.next_date || new Date().toISOString().split("T")[0],
        end_date: retreat.end_date || null,
        price_info: retreat.price ? `From ${retreat.currency || "USD"} ${retreat.price}` : null,
        external_ticket_url: retreat.url || retreat.booking_url || null,
        organizer_name: retreat.organizer?.name || retreat.provider || null,
        cover_image_url: retreat.image_url || retreat.images?.[0] || null,
        source_url: retreat.url || null,
        source_event_id: retreat.id ? String(retreat.id) : null,
      };

      return {
        external_id: `bookretreats-${retreat.id || retreat.title}`,
        content_text: `${parsed.title}\n\n${parsed.description}`,
        raw_data: [parsed],
      };
    });
  },
};

interface BookRetreat {
  id?: number | string;
  title?: string;
  name?: string;
  description?: string;
  summary?: string;
  start_date?: string;
  end_date?: string;
  next_date?: string;
  price?: number;
  currency?: string;
  url?: string;
  booking_url?: string;
  image_url?: string;
  images?: string[];
  venue?: string;
  provider?: string;
  location?: { name?: string; address?: string };
  organizer?: { name?: string };
}

registerAdapter(bookretreatAdapter);
