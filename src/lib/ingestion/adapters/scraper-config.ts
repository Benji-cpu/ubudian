/**
 * Per-site scraper configurations.
 *
 * Each site has a base URL, events page path, and CSS selectors
 * for extracting event data from the HTML.
 */

import type { ScraperSelectorConfig } from "./scraper-base";

export interface SiteScraperConfig {
  name: string;
  slug: string;
  baseUrl: string;
  eventsPath: string;
  selectors: ScraperSelectorConfig;
  /** If true, raw HTML is sent to LLM for parsing instead of selector extraction */
  useLlmFallback?: boolean;
  /** Additional pages to scrape (pagination or category pages) */
  additionalPaths?: string[];
}

export const SITE_CONFIGS: SiteScraperConfig[] = [
  {
    name: "BaliSpirit Festival",
    slug: "balispirit",
    baseUrl: "https://www.balispiritfestival.com",
    eventsPath: "/schedule",
    selectors: {
      eventContainer: ".schedule-item, .event-card, article.event",
      title: "h2, h3, .event-title",
      description: ".event-description, .excerpt, p",
      date: ".event-date, .date, time",
      time: ".event-time, .time",
      venue: ".event-venue, .venue, .location",
      link: "a",
      image: "img",
    },
    useLlmFallback: true,
  },
  {
    name: "Honeycombers Bali",
    slug: "honeycombers",
    baseUrl: "https://thehoneycombers.com",
    eventsPath: "/bali/bali-events",
    selectors: {
      eventContainer: "article, .post-card, .event-item",
      title: "h2 a, h3 a, .post-title a",
      description: ".excerpt, .post-excerpt, p",
      date: ".date, time, .event-date",
      venue: ".venue, .location",
      link: "h2 a, h3 a, .post-title a",
      image: "img.post-image, img.featured, picture img",
    },
    useLlmFallback: true,
  },
  {
    name: "Pyramids of Chi",
    slug: "pyramids-of-chi",
    baseUrl: "https://pyramidsofchi.com",
    eventsPath: "/events",
    selectors: {
      eventContainer: ".event-item, .schedule-item, article",
      title: "h2, h3, .event-title",
      description: ".event-description, p",
      date: ".event-date, .date",
      time: ".event-time, .time",
      price: ".event-price, .price",
      link: "a",
      image: "img",
    },
    useLlmFallback: true,
  },
  {
    name: "Outpost",
    slug: "outpost",
    baseUrl: "https://www.outpost-asia.com",
    eventsPath: "/events",
    selectors: {
      eventContainer: ".event-card, article.event, .events-list-item",
      title: "h2, h3, .event-title",
      description: ".event-description, .excerpt",
      date: ".event-date, .date",
      time: ".event-time",
      venue: ".event-venue",
      link: "a",
      image: "img",
    },
    useLlmFallback: true,
  },
  {
    name: "The Yoga Barn",
    slug: "yoga-barn",
    baseUrl: "https://www.theyogabarn.com",
    eventsPath: "/events",
    selectors: {
      eventContainer: ".event-item, .workshop-item, article",
      title: "h2, h3, .event-title",
      description: ".event-description, p",
      date: ".event-date, .date",
      time: ".event-time, .time",
      price: ".event-price, .price",
      link: "a",
      image: "img",
    },
    useLlmFallback: true,
    additionalPaths: ["/workshops", "/retreats"],
  },
];
