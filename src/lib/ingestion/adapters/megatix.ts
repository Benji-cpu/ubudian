/**
 * Megatix (megatix.co.id) adapter.
 *
 * Fetches events from the Megatix public API for the Ubud/Bali area.
 * Uses their undocumented Nuxt.js internal API — no API key required.
 *
 * Search endpoint: GET /api/v2/events/search?search={term}&page={n}
 * Detail endpoint: GET /api/v2/events/{slug}
 */

import type { SourceAdapter, RawMessage, ParsedEvent } from "../types";
import { registerAdapter } from "../source-adapter";

const MEGATIX_BASE = "https://megatix.co.id/api/v2/events";
const MEGATIX_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const DEFAULT_UBUD_LOCALITIES = [
  "Ubud",
  "Gianyar",
  "Peliatan",
  "Mas",
  "Sayan",
  "Campuhan",
  "Penestanan",
  "Nyuh Kuning",
  "Keliki",
  "Lodtunduh",
  "Tegallalang",
  "Kedewatan",
  "Singakerta",
];

// --- Interfaces ---

interface MegatixSearchEvent {
  id: number;
  name: string;
  slug: string;
  start_datetime: string | null;
  end_datetime: string | null;
  is_recurring: boolean;
  display_price: string | null;
  promoter_name: string | null;
  cover: string | null;
  venue_name: string | null;
}

interface MegatixDetailEvent {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  is_recurring: boolean;
  display_price: string | null;
  promoter_name: string | null;
  cover: string | null;
  venue: MegatixVenue | null;
}

interface MegatixVenue {
  name: string | null;
  suburb: string | null;
  full_address: string | null;
}

interface MegatixSearchResponse {
  data: MegatixSearchEvent[];
  meta: { last_page: number; current_page: number };
}

// --- Adapter ---

const megatixAdapter: SourceAdapter = {
  sourceSlug: "megatix",

  async fetchMessages(
    config: Record<string, unknown>,
    _since?: Date
  ): Promise<RawMessage[]> {
    const searchTerms = (config.search_terms as string[]) || ["ubud"];
    const localities =
      (config.ubud_localities as string[]) || DEFAULT_UBUD_LOCALITIES;
    const fetchDelayMs = (config.fetch_delay_ms as number) || 500;
    const maxEvents = (config.max_events_per_run as number) || 50;
    const maxListPages = (config.max_list_pages as number) || 20;
    const knownVenues = (config.known_ubud_venues as string[]) || [];

    // Collect events from search, dedup by id
    const seenIds = new Set<number>();
    const candidates: MegatixSearchEvent[] = [];
    let totalPagesFetched = 0;

    for (const term of searchTerms) {
      if (totalPagesFetched >= maxListPages) break;

      let page = 1;
      let lastPage = 1;

      while (page <= lastPage) {
        if (totalPagesFetched >= maxListPages) break;

        const result = await fetchSearchPage(term, page);
        lastPage = result.meta.last_page;
        totalPagesFetched++;

        for (const event of result.data) {
          if (!seenIds.has(event.id)) {
            seenIds.add(event.id);
            candidates.push(event);
          }
        }

        page++;
        if (page <= lastPage && totalPagesFetched < maxListPages) {
          await delay(200);
        }
      }
    }

    // Filter and map to RawMessages
    const messages: RawMessage[] = [];

    for (const event of candidates) {
      if (messages.length >= maxEvents) break;

      // Skip junk listings (deposits, vouchers, reservations, etc.)
      if (JUNK_TITLE_PATTERN.test(event.name)) continue;

      // Pre-filter: known venue or locality in name → skip venue verification
      const knownVenueMatch = event.venue_name
        ? knownVenues.some((kv) =>
            event.venue_name!.toLowerCase().includes(kv.toLowerCase())
          )
        : false;
      const quickMatch =
        knownVenueMatch ||
        (event.venue_name
          ? isLocalityMatch(event.venue_name, localities)
          : false);

      let venueName = event.venue_name;
      let venueAddress: string | null = null;
      let description = "";

      if (quickMatch) {
        // Fetch detail for description only
        try {
          await delay(fetchDelayMs);
          const detail = await fetchEventDetail(event.slug);
          description = detail.description
            ? stripHtml(detail.description)
            : "";
          venueName = detail.venue?.name || event.venue_name;
          venueAddress = detail.venue?.full_address || null;
        } catch {
          // Use list data if detail fails
          description = event.name;
        }
      } else {
        // Need detail to check venue suburb/address
        try {
          await delay(fetchDelayMs);
          const detail = await fetchEventDetail(event.slug);

          if (!detail.venue || !isUbudArea(detail.venue, localities)) {
            continue; // Not in Ubud area
          }

          description = detail.description
            ? stripHtml(detail.description)
            : "";
          venueName = detail.venue.name || event.venue_name;
          venueAddress = detail.venue.full_address || null;
        } catch {
          continue; // Skip on error
        }
      }

      const startDate = event.start_datetime
        ? event.start_datetime.split("T")[0]
        : "";
      const startTime = event.start_datetime
        ? event.start_datetime.split("T")[1]?.slice(0, 5) || null
        : null;
      const endDate = event.end_datetime
        ? event.end_datetime.split("T")[0]
        : null;
      const endTime = event.end_datetime
        ? event.end_datetime.split("T")[1]?.slice(0, 5) || null
        : null;

      if (!startDate) continue; // Skip events with no date

      const eventUrl = `https://megatix.co.id/events/${event.slug}`;

      const parsed: ParsedEvent = {
        title: event.name,
        description,
        short_description: description.slice(0, 200) || null,
        category: mapCategory(event.name, description),
        venue_name: venueName,
        venue_address: venueAddress,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime,
        is_recurring: event.is_recurring || false,
        price_info: event.display_price || null,
        external_ticket_url: eventUrl,
        organizer_name: event.promoter_name || null,
        cover_image_url: event.cover || null,
        source_url: eventUrl,
        source_event_id: String(event.id),
        quality_score: 0.8,
        content_flags: [],
      };

      messages.push({
        external_id: String(event.id),
        content_text: `${parsed.title}\n\n${parsed.description}`,
        raw_data: [parsed],
      });
    }

    return messages;
  },
};

// --- Helpers ---

export async function fetchSearchPage(
  term: string,
  page: number
): Promise<MegatixSearchResponse> {
  const url = `${MEGATIX_BASE}/search?search=${encodeURIComponent(term)}&page=${page}`;
  const res = await fetch(url, {
    headers: { "User-Agent": MEGATIX_USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Megatix search API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchEventDetail(
  slug: string
): Promise<MegatixDetailEvent> {
  const url = `${MEGATIX_BASE}/${slug}`;
  const res = await fetch(url, {
    headers: { "User-Agent": MEGATIX_USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(
      `Megatix detail API error for "${slug}": ${res.status} ${res.statusText}`
    );
  }

  const data = await res.json();
  return data.data || data;
}

function isLocalityMatch(text: string, localities: string[]): boolean {
  const lower = text.toLowerCase();
  return localities.some((loc) => lower.includes(loc.toLowerCase()));
}

export function isUbudArea(
  venue: MegatixVenue,
  localities: string[] = DEFAULT_UBUD_LOCALITIES
): boolean {
  const fields = [venue.name, venue.suburb, venue.full_address].filter(Boolean);
  return fields.some((f) => isLocalityMatch(f!, localities));
}

const JUNK_TITLE_PATTERN =
  /\b(deposit payment|gift voucher|gift card|seating reservation|drink charge|private event payments?|booking fee)\b/i;

const CATEGORY_RULES: [RegExp, string][] = [
  [/ecstatic dance|dance class|conscious dance|5rhythms/i, "Dance & Movement"],
  [/tantra|intimacy|sensual/i, "Tantra & Intimacy"],
  [/sound healing|sound bath|sound journey|cacao ceremony|gong bath|singing bowl|kirtan/i, "Ceremony & Sound"],
  [/yoga|meditation/i, "Yoga & Meditation"],
  [/breathwork|healing|bodywork|reiki|holotropic/i, "Healing & Bodywork"],
  [/\bcommunity\b|circle|social|meetup|cleanup/i, "Circle & Community"],
  [/\bjazz\b|live music|live acoustic|\bdj\b|concert|festival|\bgig\b|acoustic night|open mic/i, "Music & Performance"],
  [/\bpainting\b|\bart\b|gallery|exhibition|\bcraft\b|carving|pottery|drawing|\bculture\b|ceremony/i, "Art & Culture"],
  [/workshop|\bclass\b|masterclass|course|training|retreat|immersion/i, "Retreat & Training"],
];

export function mapCategory(title: string, description: string): string {
  const text = `${title} ${description}`;
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(text)) return category;
  }
  return "Other";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

registerAdapter(megatixAdapter);
