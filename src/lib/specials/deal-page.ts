import type { Special } from "@/types";
import { slugify } from "@/lib/utils";
import { isSafeUrl } from "@/lib/url-validation";
import { dealTitle } from "@/lib/email/weekly-deals";
import { daysUnknown, formatCheckedOn, formatIdr } from "./index";

/**
 * Helpers for the venue pages (`/deals/[slug]`): one page per venue with a
 * live deal. The slug is derived from the venue name in code, with no column
 * behind it, so a page lives exactly as long as the venue has a live deal.
 */

/** "Taman Dukuh Bali Farm Cooking School" → "taman-dukuh-bali-farm-cooking-school"; "Café" → "cafe". */
export function venueSlug(venueName: string): string {
  return slugify(venueName.normalize("NFKD").replace(/[̀-ͯ]/g, ""));
}

/** The venue page's path, or null for a name with no letters or digits in it. */
export function venuePath(venueName: string): string | null {
  const slug = venueSlug(venueName);
  return slug ? `/deals/${slug}` : null;
}

/** Every deal at the venue this slug names. Empty for an unknown slug. */
export function dealsForVenue<T extends Pick<Special, "venue_name">>(deals: T[], slug: string): T[] {
  if (!slug) return [];
  return deals.filter((d) => venueSlug(d.venue_name) === slug);
}

/** The latest of these timestamps, or undefined when none parses. */
export function newestTime(times: (string | null | undefined)[]): string | undefined {
  let best: string | undefined;
  for (const t of times) {
    if (!t || Number.isNaN(Date.parse(t))) continue;
    if (!best || Date.parse(t) > Date.parse(best)) best = t;
  }
  return best;
}

/**
 * One row per venue with a live deal, for the sitemap: its slug, when its
 * newest deal was checked, and when its page last changed (the newest
 * `updated_at` or check among its deals, since either changes what the page says).
 */
export function venuePages(
  deals: Pick<Special, "venue_name" | "confirmed_at" | "updated_at">[]
): { slug: string; lastChecked: string; lastModified: string }[] {
  const pages = new Map<string, { lastChecked: string; lastModified: string }>();
  for (const d of deals) {
    const slug = venueSlug(d.venue_name);
    if (!slug) continue;
    const held = pages.get(slug);
    pages.set(slug, {
      lastChecked: newestTime([held?.lastChecked, d.confirmed_at]) ?? d.confirmed_at,
      lastModified: newestTime([held?.lastModified, d.updated_at, d.confirmed_at]) ?? d.confirmed_at,
    });
  }
  return [...pages].map(([slug, p]) => ({ slug, ...p }));
}

/** How far below the normal price, rounded down so we never claim more than the prices say. Null without both prices or a real saving. */
export function savingPercent(price: number | null | undefined, normal: number | null | undefined): number | null {
  if (price == null || normal == null || normal <= 0 || price < 0 || price >= normal) return null;
  const pct = Math.floor(((normal - price) / normal) * 100);
  return pct >= 1 ? pct : null;
}

/** "IDR 35k instead of IDR 70k (save 50%)", "IDR 110k", "Normally IDR 125k", or null when no price is known. */
export function savingText(d: Pick<Special, "price_idr" | "normal_price_idr">): string | null {
  const price = formatIdr(d.price_idr);
  const normal = formatIdr(d.normal_price_idr ?? null);
  const pct = savingPercent(d.price_idr, d.normal_price_idr);
  if (price && normal && pct !== null) return `${price} instead of ${normal} (save ${pct}%)`;
  if (price) return price;
  if (normal) return `Normally ${normal}`;
  return null;
}

/** The saving a deal states: from its two prices, else the "N% off" in its title, else 0. */
function statedSaving(d: Pick<Special, "title" | "price_idr" | "normal_price_idr">): number {
  const fromPrices = savingPercent(d.price_idr, d.normal_price_idr);
  if (fromPrices !== null) return fromPrices;
  const m = d.title.match(/(\d{1,3})\s*%\s*off/i);
  return m ? Number(m[1]) : 0;
}

/** The deal a venue leads with in titles, previews and share text: the biggest stated saving, then by title, never by row order. */
export function leadDeal<T extends Pick<Special, "title" | "price_idr" | "normal_price_idr">>(deals: T[]): T | undefined {
  return [...deals].sort((a, b) => statedSaving(b) - statedSaving(a) || a.title.localeCompare(b.title))[0];
}

/** Days until the deal next runs, from `dayOfWeek` (0 = Sunday): 0 = today; deals with unknown days go last. */
function daysUntil(d: Pick<Special, "weekdays" | "days_stated">, dayOfWeek: number): number {
  if (daysUnknown(d)) return 99;
  if (d.weekdays.length === 0) return 0;
  return Math.min(...d.weekdays.map((w) => (w - dayOfWeek + 7) % 7));
}

/** A venue's deals in the order a reader can use them: today's first, then the rest of the week. */
export function soonestFirst<T extends Pick<Special, "weekdays" | "days_stated" | "title">>(deals: T[], dayOfWeek: number): T[] {
  return [...deals].sort((a, b) => daysUntil(a, dayOfWeek) - daysUntil(b, dayOfWeek) || a.title.localeCompare(b.title));
}

/** "Moksa" → "Moksa, Ubud"; "Hita Spa Ubud" already says where it is. */
export function venueInUbud(venueName: string): string {
  return /\bubud\b/i.test(venueName) ? venueName : `${venueName}, Ubud`;
}

/** "Curry Cure", or "Samosa Double-Dip and 2 more deals" for a venue with several. */
export function offerLine(deals: Pick<Special, "title" | "price_idr" | "normal_price_idr">[]): string {
  const lead = leadDeal(deals);
  if (!lead) return "";
  const more = deals.length - 1;
  return more > 0 ? `${dealTitle(lead)} and ${more} more ${more === 1 ? "deal" : "deals"}` : dealTitle(lead);
}

/** The page title before the site template adds " | The Ubudian": "<offer> at <venue>, Ubud". */
export function dealPageTitle(deals: Pick<Special, "venue_name" | "title" | "price_idr" | "normal_price_idr">[]): string {
  if (deals.length === 0) return "Ubud deals";
  return `${offerLine(deals)} at ${venueInUbud(deals[0].venue_name)}`;
}

/** The meta description: the lead deal's own words, clipped for search results. */
export function dealPageDescription(deals: Pick<Special, "title" | "description" | "price_idr" | "normal_price_idr">[]): string {
  const lead = leadDeal(deals);
  if (!lead) return "";
  const text = (lead.description?.trim() || dealTitle(lead)).replace(/\s+/g, " ");
  return text.length <= 160 ? text : `${text.slice(0, 159).trimEnd()}…`;
}

const FROM_THE_VENUE = new Set(["form", "admin", "whatsapp"]);

/**
 * The venue sent us this deal or agreed it with us (`form`, `admin`,
 * `whatsapp`). The rest (`seed`, `scout`, `instagram`) were read off the
 * venue's own pages: nobody there has heard of us, so we can't say we checked
 * with them or that mentioning us gets the deal.
 */
export function fromTheVenue(d: Pick<Special, "source">): boolean {
  return !!d.source && FROM_THE_VENUE.has(d.source);
}

/** "Checked with the venue on 8 Nov", or "From the venue's own page, checked on 29 Oct". */
export function checkedLine(d: Pick<Special, "source" | "confirmed_at">): string {
  const day = formatCheckedOn(d.confirmed_at);
  return fromTheVenue(d) ? `Checked with the venue on ${day}` : `From the venue's own page, checked on ${day}`;
}

/** The checked line once for the page when every deal shares it; null when they differ and each deal says its own. */
export function sharedCheckedLine(deals: Pick<Special, "source" | "confirmed_at">[]): string | null {
  const lines = new Set(deals.map(checkedLine));
  return lines.size === 1 ? [...lines][0] : null;
}

/** A full stop after "Jl.", "No.", "Rp.", "e.g." or "approx." doesn't end the sentence. */
const ABBREVIATION = /(?:^|[\s(])(?:jl|jln|no|rp|approx|incl|e\.g|i\.e)\.$/i;

/** A description's sentences. "USD 33.75", "Jl. Raya Ubud" and "e.g. ice cream" stay inside theirs. */
function sentences(text: string): string[] {
  const out: string[] = [];
  for (const piece of text.split(/(?<=[.!?]["”’)]?)\s+|\s*\n\s*/)) {
    if (!piece) continue;
    const last = out.length - 1;
    if (last >= 0 && (ABBREVIATION.test(out[last]) || /^[a-z]/.test(piece))) out[last] = `${out[last]} ${piece}`;
    else out.push(piece);
  }
  return out;
}

const NAMES_US = /\bthe\s+ubudian\b|\bthis\s+page\b/i;

/** "code UTS11", "promo code KAV30", "code: UBUD": the word after "code" has a digit or is in capitals. "Dress code applies" is no code. */
function namesACode(sentence: string): boolean {
  return [...sentence.matchAll(/\bcode\b\s*:?\s*["“‘']?([a-z0-9][a-z0-9-]{2,})/gi)].some(
    ([, word]) => /\d/.test(word) || word === word.toUpperCase()
  );
}

/**
 * How to claim the deal, in its own words: the first sentence of its
 * description that mentions The Ubudian, this page or a booking code ("Book
 * with code UTS11."). Null when none does: the venue never agreed to a
 * mention, so we don't promise one gets the deal.
 */
export function redemptionLine(description: string | null | undefined): string | null {
  const text = description?.trim();
  if (!text) return null;
  return sentences(text).find((s) => NAMES_US.test(s) || namesACode(s)) ?? null;
}

/**
 * What the "How to use it" box says: each deal's redemptionLine, from deals
 * the venue gave us only (a deal read off its own page works by its own terms,
 * whatever the text says). Once, bare, when every deal on the page says the
 * same; otherwise each line names its deal, so none reads as covering a deal it
 * doesn't. Empty: no box.
 */
export function howToUse(deals: Pick<Special, "title" | "description" | "source">[]): { deal: string | null; line: string }[] {
  const lines = deals.map((d) => ({ deal: dealTitle(d), line: fromTheVenue(d) ? redemptionLine(d.description) : null }));
  const said = lines.filter((l): l is { deal: string; line: string } => l.line !== null);
  if (said.length === 0) return [];
  if (new Set(lines.map((l) => l.line)).size === 1) return [{ deal: null, line: said[0].line }];
  return said;
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * "More deals in Ubud": up to `limit` deals at other venues, one per venue
 * (its lead deal). Each venue page starts the list at a different venue, so
 * the same three don't sit under every page.
 */
export function moreDeals<T extends Pick<Special, "venue_name" | "title" | "price_idr" | "normal_price_idr">>(
  deals: T[],
  slug: string,
  limit = 3
): T[] {
  const byVenue = new Map<string, T[]>();
  for (const d of deals) {
    const s = venueSlug(d.venue_name);
    if (!s || s === slug) continue;
    byVenue.set(s, [...(byVenue.get(s) ?? []), d]);
  }
  const pool = [...byVenue.keys()].sort().map((s) => leadDeal(byVenue.get(s)!)!);
  if (pool.length === 0) return [];
  const k = hash(slug) % pool.length;
  return [...pool.slice(k), ...pool.slice(0, k)].slice(0, limit);
}

/** Directions: the venue's own Maps link, else a Maps search for its name and area. */
export function mapsHref(s: Pick<Special, "google_maps_url" | "venue_name" | "venue_address" | "venue_area">): string {
  if (s.google_maps_url && isSafeUrl(s.google_maps_url)) return s.google_maps_url;
  const q = [s.venue_name, s.venue_address || s.venue_area, "Ubud"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
