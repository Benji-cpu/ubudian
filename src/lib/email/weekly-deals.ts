import { GREEN, GOLD, CHARCOAL, esc } from "@/lib/email/brand";
import { formatHours, formatIdr, formatWeekdays } from "@/lib/specials";
import type { Special } from "@/types";

/** Where the deals live on the site. One constant, so a rename is one line. */
export const DEALS_PATH = "/deals";

/** How many deals one issue carries. */
export const WEEKLY_DEAL_LIMIT = 6;

/**
 * The deal's public source: the page the deal was found on (`source_url`),
 * then the venue's own site, its Instagram, its Maps listing. A deal with none
 * of them is never mailed (every deal we show needs a public source and a date).
 */
export function dealSourceUrl(
  special: Pick<Special, "source_url" | "website_url" | "instagram_handle" | "google_maps_url">
): string | null {
  if (special.source_url) return special.source_url;
  if (special.website_url) return special.website_url;
  const handle = special.instagram_handle?.replace(/^@/, "").trim();
  if (handle) return `https://www.instagram.com/${handle}/`;
  return special.google_maps_url || null;
}

/** Days from `fromDay` (0 = Sunday) until the deal next runs; 0 = today. */
function daysUntilNext(weekdays: number[], fromDay: number): number {
  if (weekdays.length === 0) return 0;
  return Math.min(...weekdays.map((d) => (d - fromDay + 7) % 7));
}

/**
 * The issue's deals: sourced ones only, soonest first from the send day
 * (every-day deals count as today), then the venue name, so the order is
 * stable week to week. One deal per venue keeps a single place from filling
 * the block.
 */
export function pickWeeklyDeals(
  specials: Special[],
  dayOfWeek: number,
  limit = WEEKLY_DEAL_LIMIT
): Special[] {
  const seenVenues = new Set<string>();
  return specials
    .filter((s) => dealSourceUrl(s) !== null)
    .sort(
      (a, b) =>
        daysUntilNext(a.weekdays, dayOfWeek) - daysUntilNext(b.weekdays, dayOfWeek) ||
        a.venue_name.localeCompare(b.venue_name)
    )
    .filter((s) => {
      const key = s.venue_name.trim().toLowerCase();
      if (seenVenues.has(key)) return false;
      seenVenues.add(key);
      return true;
    })
    .slice(0, limit);
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Makassar" });
}

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** The "This week's deals" rows for the weekly email. Empty string when none. */
export function buildDealsBlockHtml(deals: Special[], siteUrl: string): string {
  if (deals.length === 0) return "";

  const rows = deals
    .map((s) => {
      const where = [s.venue_name, s.venue_area].filter(Boolean).map((v) => esc(v as string)).join(" · ");
      const when = [formatWeekdays(s.weekdays), formatHours(s.start_time, s.end_time), formatIdr(s.price_idr)]
        .filter(Boolean)
        .join(" · ");
      const source = dealSourceUrl(s) as string;
      const desc = s.description
        ? `<p style="margin:6px 0 0;font-size:13px;line-height:1.5;color:${CHARCOAL};font-family:Georgia,serif;">${esc(clip(s.description, 160))}</p>`
        : "";
      return `
  <tr><td style="padding:14px 32px;border-top:1px solid ${GOLD}22;">
    <p style="margin:0;font-size:17px;color:${GREEN};font-family:Georgia,serif;font-weight:500;">${esc(s.title)}</p>
    <p style="margin:4px 0 0;font-size:13px;color:${CHARCOAL}aa;font-family:Georgia,serif;">${where}${when ? ` · ${esc(when)}` : ""}</p>
    ${desc}
    <p style="margin:6px 0 0;font-size:12px;color:${CHARCOAL}88;font-family:Georgia,serif;"><a href="${esc(source)}" style="color:${GREEN};">Source</a> · checked ${esc(shortDate(s.confirmed_at))}</p>
  </td></tr>`;
    })
    .join("");

  return `
  <tr><td style="padding:22px 32px 4px;">
    <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Georgia,serif;">This week's deals</p>
  </td></tr>
  ${rows}
  <tr><td style="padding:10px 32px 4px;">
    <a href="${siteUrl}${DEALS_PATH}" style="font-size:14px;color:${GREEN};font-family:Georgia,serif;">Every deal in Ubud →</a>
  </td></tr>`;
}
