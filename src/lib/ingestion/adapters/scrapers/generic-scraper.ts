/**
 * Generic site scraper adapter.
 *
 * Creates a SourceAdapter for any site defined in scraper-config.ts.
 * Uses CSS selectors for structured extraction, falls back to LLM parsing
 * when useLlmFallback is enabled and selector extraction yields insufficient data.
 */

import type { SourceAdapter, RawMessage, ParsedEvent } from "../../types";
import { registerAdapter } from "../../source-adapter";
import { fetchPage, parsePage, checkRobotsTxt } from "../scraper-base";
import type { SiteScraperConfig } from "../scraper-config";
import { SITE_CONFIGS } from "../scraper-config";

function createScraperAdapter(siteConfig: SiteScraperConfig): SourceAdapter {
  return {
    sourceSlug: `scraper-${siteConfig.slug}`,

    async fetchMessages(
      config: Record<string, unknown>,
      _since?: Date
    ): Promise<RawMessage[]> {
      const allMessages: RawMessage[] = [];
      const paths = [siteConfig.eventsPath, ...(siteConfig.additionalPaths || [])];

      for (const path of paths) {
        try {
          // Check robots.txt
          const allowed = await checkRobotsTxt(siteConfig.baseUrl, path);
          if (!allowed) {
            console.warn(
              `[scraper:${siteConfig.slug}] Blocked by robots.txt: ${path}`
            );
            continue;
          }

          const url = `${siteConfig.baseUrl}${path}`;
          const html = await fetchPage(url, {
            maxRetries: (config.maxRetries as number) || 2,
          });

          // Try selector-based extraction first
          const scraped = parsePage(html, siteConfig.selectors);

          if (scraped.length > 0 && !siteConfig.useLlmFallback) {
            // Selector extraction worked, convert to RawMessage with pre-parsed data
            for (const event of scraped) {
              const parsed: ParsedEvent = {
                title: event.title,
                description: event.description,
                category: "Other", // Will be classified by pipeline
                start_date: parseScrapedDate(event.date),
                venue_name: event.venue || siteConfig.name,
                start_time: parseScrapedTime(event.time),
                price_info: event.price || null,
                external_ticket_url: resolveUrl(siteConfig.baseUrl, event.link),
                cover_image_url: resolveUrl(siteConfig.baseUrl, event.imageUrl),
                source_url: resolveUrl(siteConfig.baseUrl, event.link),
                source_event_id: event.link || event.title,
              };

              allMessages.push({
                external_id: `${siteConfig.slug}-${Buffer.from(event.title).toString("base64").slice(0, 24)}`,
                content_text: `${event.title}\n${event.description}\n${event.date} ${event.time}\n${event.venue}`,
                content_html: undefined,
                raw_data: [parsed],
              });
            }
          } else {
            // Use LLM fallback — send the HTML content for AI parsing
            // Extract main content area to reduce noise
            const mainContent = extractMainContent(html);

            allMessages.push({
              external_id: `${siteConfig.slug}-page-${path.replace(/\//g, "-")}`,
              content_text: mainContent,
              content_html: html,
              raw_data: undefined, // Will be parsed by LLM
            });
          }
        } catch (err) {
          console.error(
            `[scraper:${siteConfig.slug}] Failed to scrape ${path}:`,
            err
          );
        }
      }

      return allMessages;
    },
  };
}

/**
 * Try to parse a date string from scraped text into YYYY-MM-DD format.
 */
function parseScrapedDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];

  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  } catch {
    // Fall through
  }

  // Return today as fallback — LLM can fix this during processing
  return new Date().toISOString().split("T")[0];
}

/**
 * Try to parse a time string from scraped text into HH:MM format.
 */
function parseScrapedTime(timeStr: string): string | null {
  if (!timeStr) return null;

  // Match patterns like "7:00 PM", "19:00", "7 PM"
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const min = match[2] || "00";
    const ampm = match[3]?.toUpperCase();

    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    return `${String(hour).padStart(2, "0")}:${min}`;
  }

  return null;
}

/**
 * Resolve a relative URL against a base URL.
 */
function resolveUrl(base: string, path: string | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("//")) return `https:${path}`;
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
}

/**
 * Strip HTML to plain text, keeping only the main content area.
 */
function extractMainContent(html: string): string {
  // Remove script, style, nav, header, footer tags
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Strip remaining HTML tags
  clean = clean
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  // Truncate to reasonable length for LLM
  return clean.slice(0, 10000);
}

// Register all site scrapers
for (const config of SITE_CONFIGS) {
  registerAdapter(createScraperAdapter(config));
}
