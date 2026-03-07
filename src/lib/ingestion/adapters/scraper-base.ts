/**
 * Base scraping framework.
 *
 * Provides common utilities for web scraping:
 * - Rate-limited page fetching with retry
 * - HTML parsing with Cheerio
 * - robots.txt respect
 * - Configurable per-site CSS selectors
 */

import * as cheerio from "cheerio";

const DEFAULT_USER_AGENT =
  "TheUbudianBot/1.0 (+https://theubudian.com/bot; community events aggregator)";

// Rate limit: minimum delay between requests to the same domain
const domainLastFetch = new Map<string, number>();
const MIN_DELAY_MS = 2000; // 2 seconds between requests to same domain

/**
 * Fetch a page with rate limiting, retry, and proper headers.
 */
export async function fetchPage(
  url: string,
  options: {
    userAgent?: string;
    maxRetries?: number;
    timeoutMs?: number;
  } = {}
): Promise<string> {
  const { userAgent = DEFAULT_USER_AGENT, maxRetries = 2, timeoutMs = 15000 } = options;

  // Rate limiting per domain
  const domain = new URL(url).hostname;
  const lastFetch = domainLastFetch.get(domain) || 0;
  const elapsed = Date.now() - lastFetch;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((r) => setTimeout(r, MIN_DELAY_MS - elapsed));
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      domainLastFetch.set(domain, Date.now());

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.text();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url}`);
}

/**
 * Parse HTML with Cheerio and extract event data using CSS selectors.
 */
export function parsePage(html: string, config: ScraperSelectorConfig): ScrapedEvent[] {
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  $(config.eventContainer).each((_i, el) => {
    const $el = $(el);

    const title = config.title ? $el.find(config.title).first().text().trim() : "";
    if (!title) return; // Skip empty titles

    const event: ScrapedEvent = {
      title,
      description: config.description
        ? $el.find(config.description).first().text().trim()
        : "",
      date: config.date ? $el.find(config.date).first().text().trim() : "",
      time: config.time ? $el.find(config.time).first().text().trim() : "",
      venue: config.venue ? $el.find(config.venue).first().text().trim() : "",
      price: config.price ? $el.find(config.price).first().text().trim() : "",
      link: config.link
        ? $el.find(config.link).first().attr("href") || ""
        : "",
      imageUrl: config.image
        ? $el.find(config.image).first().attr("src") || ""
        : "",
    };

    events.push(event);
  });

  return events;
}

/**
 * Check robots.txt for a URL.
 */
export async function checkRobotsTxt(
  baseUrl: string,
  path: string
): Promise<boolean> {
  try {
    const robotsUrl = `${baseUrl}/robots.txt`;
    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": DEFAULT_USER_AGENT },
    });

    if (!res.ok) return true; // No robots.txt = allowed

    const text = await res.text();
    const lines = text.split("\n");
    let isRelevantAgent = false;

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.startsWith("user-agent:")) {
        const agent = trimmed.slice("user-agent:".length).trim();
        isRelevantAgent = agent === "*" || agent.includes("ubudian");
      }
      if (isRelevantAgent && trimmed.startsWith("disallow:")) {
        const disallowed = trimmed.slice("disallow:".length).trim();
        if (disallowed && path.startsWith(disallowed)) {
          return false; // Blocked
        }
      }
    }

    return true; // Allowed
  } catch {
    return true; // If we can't check, assume allowed
  }
}

/**
 * CSS selector configuration for a scraper target site.
 */
export interface ScraperSelectorConfig {
  eventContainer: string;
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  venue?: string;
  price?: string;
  link?: string;
  image?: string;
}

export interface ScrapedEvent {
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  price: string;
  link: string;
  imageUrl: string;
}
