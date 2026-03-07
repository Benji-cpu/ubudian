/**
 * WordPress REST API adapter (generic).
 *
 * Fetches events from any WordPress site with The Events Calendar plugin
 * or standard WP REST API. Pre-configured for Ubud community sites.
 * No API keys needed — WordPress REST APIs are public.
 */

import type { SourceAdapter, RawMessage, ParsedEvent } from "../types";
import { registerAdapter } from "../source-adapter";

/**
 * Pre-configured WordPress sites to scrape.
 * Each must have /wp-json/ endpoint accessible.
 */
const DEFAULT_SITES = [
  {
    name: "Ubud Community",
    baseUrl: "https://ubudcommunity.com",
    eventsEndpoint: "/wp-json/tribe/events/v1/events",
    postsEndpoint: "/wp-json/wp/v2/posts",
    useEventsCalendar: true,
  },
];

const wordpressAdapter: SourceAdapter = {
  sourceSlug: "wordpress",

  async fetchMessages(
    config: Record<string, unknown>,
    _since?: Date
  ): Promise<RawMessage[]> {
    // Config can override default sites or add new ones
    const sites = (config.sites as typeof DEFAULT_SITES) || DEFAULT_SITES;
    const allMessages: RawMessage[] = [];

    for (const site of sites) {
      try {
        const messages = site.useEventsCalendar
          ? await fetchFromEventsCalendar(site)
          : await fetchFromPosts(site);
        allMessages.push(...messages);
      } catch (err) {
        console.error(`[wordpress] Failed to fetch from ${site.name}:`, err);
      }
    }

    return allMessages;
  },
};

/**
 * Fetch from The Events Calendar WordPress plugin API.
 */
async function fetchFromEventsCalendar(site: {
  name: string;
  baseUrl: string;
  eventsEndpoint: string;
}): Promise<RawMessage[]> {
  const url = `${site.baseUrl}${site.eventsEndpoint}?per_page=50&start_date=now`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`WordPress Events Calendar API error: ${res.status}`);
  }

  const data = await res.json();
  const events: WPEventsCalendarEvent[] = data.events || [];

  return events.map((event) => {
    const parsed: ParsedEvent = {
      title: event.title || "",
      description: stripHtml(event.description || ""),
      short_description: stripHtml(event.excerpt || "")?.slice(0, 200) || null,
      category: mapWPCategory(event.categories),
      venue_name: event.venue?.venue || null,
      venue_address: [event.venue?.address, event.venue?.city]
        .filter(Boolean)
        .join(", ") || null,
      start_date: event.start_date?.split(" ")[0] || "",
      end_date: event.end_date?.split(" ")[0] || null,
      start_time: event.start_date?.split(" ")[1]?.slice(0, 5) || null,
      end_time: event.end_date?.split(" ")[1]?.slice(0, 5) || null,
      price_info: event.cost || null,
      external_ticket_url: event.website || event.url || null,
      organizer_name: event.organizer?.[0]?.organizer || null,
      cover_image_url: event.image?.url || null,
      source_url: event.url || null,
      source_event_id: String(event.id),
    };

    return {
      external_id: `${site.name}-${event.id}`,
      content_text: `${parsed.title}\n\n${parsed.description}`,
      raw_data: [parsed],
    };
  });
}

/**
 * Fetch from standard WordPress posts API (for sites without events plugin).
 * Posts tagged with "event" or in "events" category get parsed by LLM.
 */
async function fetchFromPosts(site: {
  name: string;
  baseUrl: string;
  postsEndpoint: string;
}): Promise<RawMessage[]> {
  const url = `${site.baseUrl}${site.postsEndpoint}?per_page=20&orderby=date&order=desc`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`WordPress Posts API error: ${res.status}`);
  }

  const posts: WPPost[] = await res.json();

  return posts.map((post) => ({
    external_id: `${site.name}-post-${post.id}`,
    content_text: stripHtml(post.content?.rendered || ""),
    content_html: post.content?.rendered || "",
    raw_data: post,
  }));
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapWPCategory(categories?: Array<{ name?: string }>): string {
  if (!categories?.length) return "Other";
  const name = categories[0].name?.toLowerCase() || "";
  if (name.includes("music")) return "Music & Live Performance";
  if (name.includes("yoga") || name.includes("wellness")) return "Yoga & Wellness";
  if (name.includes("art")) return "Art & Culture";
  if (name.includes("food")) return "Food & Drink";
  if (name.includes("workshop")) return "Workshop & Class";
  if (name.includes("community")) return "Community & Social";
  return "Other";
}

interface WPEventsCalendarEvent {
  id: number;
  title?: string;
  description?: string;
  excerpt?: string;
  url?: string;
  website?: string;
  start_date?: string;
  end_date?: string;
  cost?: string;
  categories?: Array<{ name?: string }>;
  venue?: { venue?: string; address?: string; city?: string };
  organizer?: Array<{ organizer?: string }>;
  image?: { url?: string };
}

interface WPPost {
  id: number;
  title?: { rendered?: string };
  content?: { rendered?: string };
  excerpt?: { rendered?: string };
}

registerAdapter(wordpressAdapter);
