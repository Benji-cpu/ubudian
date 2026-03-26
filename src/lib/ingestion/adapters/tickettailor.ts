/**
 * TicketTailor API adapter.
 *
 * Fetches events from TicketTailor box offices. Each API key is scoped to a
 * single organizer, so `config.organizers` holds an array of keys.
 *
 * API docs: https://developers.tickettailor.com
 */

import type { SourceAdapter, RawMessage, ParsedEvent } from "../types";
import { registerAdapter } from "../source-adapter";

const TT_BASE = "https://api.tickettailor.com/v1";

interface OrganizerConfig {
  slug: string;
  api_key: string;
  label: string;
}

export async function fetchMessages(
  config: Record<string, unknown>,
  _since?: Date
): Promise<RawMessage[]> {
  const organizers = config.organizers as OrganizerConfig[] | undefined;
  if (!organizers || !Array.isArray(organizers) || organizers.length === 0) {
    throw new Error(
      "TicketTailor config must include a non-empty 'organizers' array"
    );
  }

  const allMessages: RawMessage[] = [];

  for (const org of organizers) {
    try {
      const events = await fetchOrganizerEvents(org);
      for (const event of events) {
        const parsed = mapToParsedEvent(event, org);
        allMessages.push({
          external_id: `tt-${event.id}-${org.slug}`,
          content_text: `${parsed.title}\n\n${parsed.description}`,
          raw_data: [parsed],
        });
      }
    } catch (err) {
      console.error(
        `[TicketTailor] Failed to fetch events for organizer "${org.label}" (${org.slug}):`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return allMessages;
}

async function fetchOrganizerEvents(
  org: OrganizerConfig
): Promise<TicketTailorEvent[]> {
  const auth = Buffer.from(`${org.api_key}:`).toString("base64");
  const events: TicketTailorEvent[] = [];
  let url: string | null =
    `${TT_BASE}/events?status=published`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!res.ok) {
      throw new Error(
        `TicketTailor API error for ${org.slug}: ${res.status} ${res.statusText}`
      );
    }

    const body: TicketTailorResponse = await res.json();

    for (const event of body.data) {
      if (event.online_event === "yes") continue;
      events.push(event);
    }

    if (body.links?.next) {
      url = body.links.next;
    } else {
      url = null;
    }
  }

  return events;
}

function mapToParsedEvent(
  event: TicketTailorEvent,
  org: OrganizerConfig
): ParsedEvent {
  if (event.timezone && event.timezone !== "Asia/Makassar") {
    console.warn(
      `[TicketTailor] Event "${event.name}" (${event.id}) has timezone "${event.timezone}" — expected Asia/Makassar`
    );
  }

  return {
    title: event.name || "",
    description: stripHtml(event.description || ""),
    category: "Other",
    venue_name: event.venue?.name || null,
    venue_address: event.venue?.postal_code || null,
    start_date: event.start?.date || "",
    end_date: event.end?.date || null,
    start_time: event.start?.time || null,
    end_time: event.end?.time || null,
    is_recurring: !!event.event_series_id,
    price_info: formatPricing(event.ticket_types, event.currency),
    external_ticket_url: event.url || null,
    organizer_name: org.label,
    cover_image_url:
      event.images?.header || event.images?.thumbnail || null,
    source_url: event.url || null,
    source_event_id: event.id,
    quality_score: 0.9,
    content_flags: [],
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<\/?(p|div|br|li|ul|ol|h[1-6]|blockquote|tr)\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPricing(
  ticketTypes?: TicketTailorTicketType[],
  currency?: string
): string {
  if (!ticketTypes || ticketTypes.length === 0) return "Free";

  const onSale = ticketTypes.filter((t) => t.status === "on_sale");
  if (onSale.length === 0) return "Free";

  const allFree = onSale.every(
    (t) => t.type === "free" || t.price === 0
  );
  if (allFree) return "Free";

  const prices = onSale
    .filter((t) => t.type !== "free" && t.price > 0)
    .map((t) => t.price / 100);

  if (prices.length === 0) return "Free";

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const symbol = formatCurrencySymbol(currency);

  if (min === max) return `${symbol}${formatNumber(min)}`;
  return `${symbol}${formatNumber(min)} - ${formatNumber(max)}`;
}

function formatCurrencySymbol(currency?: string): string {
  switch (currency?.toUpperCase()) {
    case "IDR":
      return "IDR ";
    case "USD":
      return "$";
    case "EUR":
      return "\u20AC";
    case "GBP":
      return "\u00A3";
    case "AUD":
      return "A$";
    default:
      return currency ? `${currency.toUpperCase()} ` : "";
  }
}

function formatNumber(n: number): string {
  return n % 1 === 0 ? n.toLocaleString("en-US") : n.toFixed(2);
}

// --- Types ---

interface TicketTailorTicketType {
  status: string;
  type: string;
  price: number;
}

interface TicketTailorEvent {
  id: string;
  name: string;
  description?: string;
  url?: string;
  online_event?: string;
  timezone?: string;
  currency?: string;
  event_series_id?: string | null;
  start?: { date?: string; time?: string };
  end?: { date?: string; time?: string };
  venue?: { name?: string; postal_code?: string };
  images?: { header?: string; thumbnail?: string };
  ticket_types?: TicketTailorTicketType[];
}

interface TicketTailorResponse {
  data: TicketTailorEvent[];
  links?: { next?: string | null };
}

// --- Register ---

const ticketTailorAdapter: SourceAdapter = {
  sourceSlug: "tickettailor",
  fetchMessages,
};

registerAdapter(ticketTailorAdapter);
