/**
 * Post-ingestion URL enrichment.
 *
 * Fetches an event's source_url and fills in missing fields from
 * Open Graph tags, schema.org JSON-LD, and standard meta tags.
 *
 * Never overwrites existing values — only fills nullish slots.
 */

import * as cheerio from "cheerio";
import { fetchPage } from "./adapters/scraper-base";
import type { ParsedEvent } from "./types";

export interface EnrichmentInput {
  cover_image_url?: string | null;
  short_description?: string | null;
  description?: string | null;
  price_info?: string | null;
  external_ticket_url?: string | null;
  organizer_name?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
}

export interface EnrichmentResult {
  cover_image_url?: string;
  short_description?: string;
  price_info?: string;
  external_ticket_url?: string;
  organizer_name?: string;
  venue_name?: string;
  venue_address?: string;
  enrichedFields: string[];
}

/**
 * Fetch the given URL and extract any fields that are missing from `existing`.
 * Returns only the newly-filled values plus a list of which fields were enriched.
 * Never throws — returns an empty result on any failure.
 */
export async function enrichFromSourceUrl(
  url: string,
  existing: EnrichmentInput,
  options: { fetchPageImpl?: typeof fetchPage } = {}
): Promise<EnrichmentResult> {
  const empty: EnrichmentResult = { enrichedFields: [] };

  if (!url || !/^https?:\/\//i.test(url)) return empty;

  const fetchImpl = options.fetchPageImpl ?? fetchPage;

  let html: string;
  try {
    html = await fetchImpl(url, { maxRetries: 1, timeoutMs: 10000 });
  } catch {
    return empty;
  }

  if (!html || typeof html !== "string") return empty;

  let $: cheerio.CheerioAPI;
  try {
    $ = cheerio.load(html);
  } catch {
    return empty;
  }

  const meta = extractMeta($);
  const jsonLd = extractEventJsonLd($);

  const result: EnrichmentResult = { enrichedFields: [] };

  const fillIfMissing = <K extends keyof EnrichmentResult>(
    key: K,
    existingValue: string | null | undefined,
    candidate: string | undefined
  ) => {
    if (existingValue && existingValue.trim().length > 0) return;
    if (!candidate || candidate.trim().length === 0) return;
    (result as unknown as Record<string, unknown>)[key] = candidate.trim();
    result.enrichedFields.push(key as string);
  };

  const imageCandidate =
    pickFirst(jsonLd?.image, meta.ogImage, meta.twitterImage) ??
    extractImageFromHtml($, url);

  fillIfMissing("cover_image_url", existing.cover_image_url, imageCandidate);

  fillIfMissing(
    "short_description",
    existing.short_description,
    pickFirst(meta.ogDescription, meta.description, jsonLd?.description)
  );

  fillIfMissing(
    "price_info",
    existing.price_info,
    formatPrice(jsonLd?.price, jsonLd?.priceCurrency)
  );

  fillIfMissing(
    "external_ticket_url",
    existing.external_ticket_url,
    pickFirst(jsonLd?.ticketUrl, jsonLd?.offerUrl)
  );

  fillIfMissing(
    "organizer_name",
    existing.organizer_name,
    jsonLd?.organizerName
  );

  fillIfMissing("venue_name", existing.venue_name, jsonLd?.locationName);
  fillIfMissing("venue_address", existing.venue_address, jsonLd?.locationAddress);

  return result;
}

/** Apply enrichment results onto a ParsedEvent in place. */
export function applyEnrichment(parsed: ParsedEvent, enrichment: EnrichmentResult): void {
  for (const key of enrichment.enrichedFields) {
    const value = (enrichment as unknown as Record<string, unknown>)[key];
    if (typeof value === "string" && value.length > 0) {
      (parsed as unknown as Record<string, unknown>)[key] = value;
    }
  }
}

interface MetaTags {
  ogImage?: string;
  ogDescription?: string;
  ogTitle?: string;
  twitterImage?: string;
  description?: string;
}

function extractMeta($: cheerio.CheerioAPI): MetaTags {
  const get = (selector: string, attr = "content") =>
    $(selector).first().attr(attr)?.trim() || undefined;

  return {
    ogImage: get('meta[property="og:image"]') || get('meta[name="og:image"]'),
    ogDescription:
      get('meta[property="og:description"]') ||
      get('meta[name="og:description"]'),
    ogTitle: get('meta[property="og:title"]') || get('meta[name="og:title"]'),
    twitterImage:
      get('meta[name="twitter:image"]') ||
      get('meta[property="twitter:image"]'),
    description: get('meta[name="description"]'),
  };
}

interface EventJsonLd {
  image?: string;
  description?: string;
  price?: string;
  priceCurrency?: string;
  offerUrl?: string;
  ticketUrl?: string;
  organizerName?: string;
  locationName?: string;
  locationAddress?: string;
}

const EVENT_TYPES = new Set([
  "Event",
  "MusicEvent",
  "TheaterEvent",
  "DanceEvent",
  "SportsEvent",
  "Festival",
  "ComedyEvent",
  "EducationEvent",
  "BusinessEvent",
  "SocialEvent",
  "VisualArtsEvent",
  "FoodEvent",
  "ExhibitionEvent",
  "Course",
]);

function extractEventJsonLd($: cheerio.CheerioAPI): EventJsonLd | undefined {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    const raw = $(scripts[i]).text().trim();
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    const candidates = collectJsonLdNodes(parsed);
    for (const node of candidates) {
      if (isEventNode(node)) {
        return mapEventNode(node);
      }
    }
  }
  return undefined;
}

function collectJsonLdNodes(node: unknown): Record<string, unknown>[] {
  if (!node) return [];
  if (Array.isArray(node)) {
    return node.flatMap(collectJsonLdNodes);
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const nested = obj["@graph"];
    if (Array.isArray(nested)) {
      return nested.flatMap(collectJsonLdNodes);
    }
    return [obj];
  }
  return [];
}

function isEventNode(node: Record<string, unknown>): boolean {
  const t = node["@type"];
  if (typeof t === "string") return EVENT_TYPES.has(t);
  if (Array.isArray(t)) return t.some((x) => typeof x === "string" && EVENT_TYPES.has(x));
  return false;
}

function mapEventNode(node: Record<string, unknown>): EventJsonLd {
  const result: EventJsonLd = {};

  const image = node.image;
  if (typeof image === "string") result.image = image;
  else if (Array.isArray(image) && typeof image[0] === "string") result.image = image[0];
  else if (image && typeof image === "object") {
    const url = (image as Record<string, unknown>).url;
    if (typeof url === "string") result.image = url;
  }

  if (typeof node.description === "string") result.description = node.description;

  const offers = node.offers;
  const firstOffer = Array.isArray(offers) ? offers[0] : offers;
  if (firstOffer && typeof firstOffer === "object") {
    const o = firstOffer as Record<string, unknown>;
    if (typeof o.price === "string" || typeof o.price === "number") {
      result.price = String(o.price);
    } else if (typeof o.lowPrice === "string" || typeof o.lowPrice === "number") {
      result.price = String(o.lowPrice);
    }
    if (typeof o.priceCurrency === "string") result.priceCurrency = o.priceCurrency;
    if (typeof o.url === "string") result.offerUrl = o.url;
  }

  if (typeof node.url === "string" && !result.ticketUrl) {
    // Some sites put the ticket URL on the event itself
    result.ticketUrl = node.url;
  }

  const organizer = node.organizer;
  const firstOrg = Array.isArray(organizer) ? organizer[0] : organizer;
  if (firstOrg && typeof firstOrg === "object") {
    const name = (firstOrg as Record<string, unknown>).name;
    if (typeof name === "string") result.organizerName = name;
  } else if (typeof firstOrg === "string") {
    result.organizerName = firstOrg;
  }

  const location = node.location;
  const firstLoc = Array.isArray(location) ? location[0] : location;
  if (firstLoc && typeof firstLoc === "object") {
    const loc = firstLoc as Record<string, unknown>;
    if (typeof loc.name === "string") result.locationName = loc.name;
    const addr = loc.address;
    if (typeof addr === "string") {
      result.locationAddress = addr;
    } else if (addr && typeof addr === "object") {
      const a = addr as Record<string, unknown>;
      const parts = [a.streetAddress, a.addressLocality, a.addressRegion, a.addressCountry]
        .filter((p): p is string => typeof p === "string" && p.length > 0);
      if (parts.length > 0) result.locationAddress = parts.join(", ");
    }
  } else if (typeof firstLoc === "string") {
    result.locationName = firstLoc;
  }

  return result;
}

function formatPrice(amount?: string, currency?: string): string | undefined {
  if (!amount) return undefined;
  const n = Number(amount);
  if (Number.isNaN(n)) return undefined;
  if (n === 0) return "Free";
  const c = currency?.trim();
  if (!c) return `${n}`;
  return `${c} ${n}`;
}

function pickFirst(...values: Array<string | undefined>): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return undefined;
}

/**
 * Try each candidate URL in order; merge enrichment results.
 * Stops iterating once `cover_image_url` has been filled.
 * Other fields keep accumulating across candidates.
 */
export async function enrichFromUrls(
  candidates: Array<string | null | undefined>,
  existing: EnrichmentInput,
  options: { fetchPageImpl?: typeof fetchPage } = {}
): Promise<EnrichmentResult> {
  const merged: EnrichmentResult = { enrichedFields: [] };
  const accumulated: EnrichmentInput = { ...existing };

  const seen = new Set<string>();
  for (const raw of candidates) {
    if (!raw) continue;
    const url = raw.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const r = await enrichFromSourceUrl(url, accumulated, options);
    for (const key of r.enrichedFields) {
      const value = (r as unknown as Record<string, unknown>)[key];
      if (typeof value === "string" && value.length > 0) {
        (merged as unknown as Record<string, unknown>)[key] = value;
        (accumulated as unknown as Record<string, unknown>)[key] = value;
        if (!merged.enrichedFields.includes(key)) merged.enrichedFields.push(key);
      }
    }

    if (merged.cover_image_url) break;
  }

  return merged;
}

/**
 * DOM-based image fallback when OG/JSON-LD yield nothing.
 * Picks a plausible cover image from <img> tags, preferring larger,
 * content-region, non-icon images. Site-specific branches go first.
 */
export function extractImageFromHtml(
  $: cheerio.CheerioAPI,
  pageUrl: string
): string | undefined {
  let host = "";
  try {
    host = new URL(pageUrl).hostname.toLowerCase();
  } catch {
    host = "";
  }

  const siteSpecific = extractSiteSpecificImage($, host);
  if (siteSpecific) return resolveUrl(siteSpecific, pageUrl);

  const generic = extractGenericContentImage($);
  return generic ? resolveUrl(generic, pageUrl) : undefined;
}

function extractSiteSpecificImage(
  $: cheerio.CheerioAPI,
  host: string
): string | undefined {
  if (host.endsWith("megatix.co.id") || host.endsWith("megatix.com.au")) {
    // Megatix pages embed cover images under media.megatix.{com.au,co.id}
    const img = $('img[src*="media.megatix."]')
      .filter((_, el) => !isLikelyIcon($(el).attr("src")))
      .first()
      .attr("src");
    if (img) return img;
  }
  return undefined;
}

function extractGenericContentImage($: cheerio.CheerioAPI): string | undefined {
  const containers = ["main img", '[role="main"] img', "article img"];
  for (const sel of containers) {
    const hit = pickBestImg($, $(sel));
    if (hit) return hit;
  }
  return pickBestImg($, $("img"));
}

function pickBestImg(
  $: cheerio.CheerioAPI,
  selection: cheerio.Cheerio<import("domhandler").AnyNode>
): string | undefined {
  let best: { src: string; area: number } | undefined;

  selection.each((_, el) => {
    const $el = $(el);
    const src = $el.attr("src") || $el.attr("data-src") || $el.attr("data-lazy-src");
    if (!src) return;
    if (isLikelyIcon(src)) return;
    if (/^data:/i.test(src)) return;
    if (/\.svg(\?|$)/i.test(src)) return;

    const w = Number($el.attr("width")) || 0;
    const h = Number($el.attr("height")) || 0;
    if ((w && w < 200) || (h && h < 200)) return;

    const area = w * h || 1;
    if (!best || area > best.area) {
      best = { src, area };
    }
  });

  return best?.src;
}

function isLikelyIcon(src: string | undefined): boolean {
  if (!src) return true;
  const lower = src.toLowerCase();
  return (
    lower.includes("logo") ||
    lower.includes("icon") ||
    lower.includes("favicon") ||
    lower.includes("sprite") ||
    lower.includes("avatar")
  );
}

function resolveUrl(candidate: string, pageUrl: string): string | undefined {
  try {
    return new URL(candidate, pageUrl).toString();
  } catch {
    return undefined;
  }
}
