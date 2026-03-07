/**
 * Google Events via SerpApi adapter.
 *
 * Fetches events that Google has indexed for the Ubud area.
 * Conservative daily polling to stay within free tier (100 searches/month).
 *
 * API docs: https://serpapi.com/google-events-api
 */

import type { SourceAdapter, RawMessage, ParsedEvent } from "../types";
import { registerAdapter } from "../source-adapter";

const SERPAPI_BASE = "https://serpapi.com/search.json";

const serpApiAdapter: SourceAdapter = {
  sourceSlug: "serpapi-google-events",

  async fetchMessages(
    config: Record<string, unknown>,
    _since?: Date
  ): Promise<RawMessage[]> {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      throw new Error("SERPAPI_API_KEY is not configured");
    }

    const query = (config.query as string) || "events in Ubud Bali";

    const params = new URLSearchParams({
      engine: "google_events",
      q: query,
      hl: "en",
      gl: "id", // Indonesia
      api_key: apiKey,
    });

    const res = await fetch(`${SERPAPI_BASE}?${params}`);

    if (!res.ok) {
      throw new Error(`SerpApi error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const results: SerpApiEvent[] = data.events_results || [];

    return results.map((event) => {
      const dateInfo = parseSerpApiDate(event.date?.when);

      const parsed: ParsedEvent = {
        title: event.title || "",
        description: event.description || "",
        short_description: event.description?.slice(0, 200) || null,
        category: "Other",
        venue_name: event.address?.[0] || event.venue?.name || null,
        venue_address: event.address?.slice(1).join(", ") || null,
        start_date: dateInfo.startDate,
        end_date: dateInfo.endDate,
        start_time: dateInfo.startTime,
        end_time: dateInfo.endTime,
        external_ticket_url: event.link || null,
        cover_image_url: event.thumbnail || null,
        source_url: event.link || null,
        source_event_id: event.link || event.title,
      };

      return {
        external_id: `serp-${Buffer.from(event.title || "").toString("base64").slice(0, 32)}`,
        content_text: `${parsed.title}\n\n${parsed.description}`,
        raw_data: [parsed],
      };
    });
  },
};

/**
 * Parse SerpApi date strings like "Sat, Mar 15, 7 PM – 11 PM"
 * into structured date/time fields.
 */
function parseSerpApiDate(dateStr?: string): {
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
} {
  const now = new Date();
  const result: {
    startDate: string;
    endDate: string | null;
    startTime: string | null;
    endTime: string | null;
  } = {
    startDate: now.toISOString().split("T")[0],
    endDate: null,
    startTime: null,
    endTime: null,
  };

  if (!dateStr) return result;

  try {
    // Try to parse the date portion (e.g., "Sat, Mar 15")
    const dateMatch = dateStr.match(
      /(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:,?\s+(\d{4}))?/i
    );

    if (dateMatch) {
      const months: Record<string, string> = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
      };
      const month = months[dateMatch[1].toLowerCase()];
      const day = dateMatch[2].padStart(2, "0");
      const year = dateMatch[3] || String(now.getFullYear());

      result.startDate = `${year}-${month}-${day}`;
    }

    // Try to parse time range (e.g., "7 PM – 11 PM" or "7:30 PM")
    const timeMatch = dateStr.match(
      /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i
    );
    if (timeMatch) {
      result.startTime = to24h(timeMatch[1], timeMatch[2], timeMatch[3]);
      result.endTime = to24h(timeMatch[4], timeMatch[5], timeMatch[6]);
    } else {
      const singleTime = dateStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
      if (singleTime) {
        result.startTime = to24h(singleTime[1], singleTime[2], singleTime[3]);
      }
    }
  } catch {
    // Return fallback on parse errors
  }

  return result;
}

function to24h(hour: string, min: string | undefined, ampm: string): string {
  let h = parseInt(hour, 10);
  if (ampm.toUpperCase() === "PM" && h !== 12) h += 12;
  if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min || "00"}`;
}

interface SerpApiEvent {
  title?: string;
  description?: string;
  link?: string;
  thumbnail?: string;
  date?: { when?: string };
  address?: string[];
  venue?: { name?: string };
}

registerAdapter(serpApiAdapter);
