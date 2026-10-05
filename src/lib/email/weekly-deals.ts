import { GREEN, GOLD, CHARCOAL, esc } from "@/lib/email/brand";
import { daysUnknown, formatDays, formatIdr, formatWeekdays } from "@/lib/specials";
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

/** A generic happy hour, as opposed to something only this venue does. */
export function isPlainHappyHour(special: Pick<Special, "title">): boolean {
  return /happy\s*hour/i.test(special.title);
}

/** Runs on particular days (not every day) — the distinctive ones. */
function hasSetDays(special: Pick<Special, "weekdays">): boolean {
  const n = new Set(special.weekdays).size;
  return n > 0 && n < 7;
}

/** At most this many generic happy hours in one issue. */
export const MAX_HAPPY_HOURS = 2;

/**
 * The issue's deals, chosen to be worth opening:
 *  - sourced deals only, and never one whose days we don't know (we won't
 *    mail "Every day" for "days not stated");
 *  - one deal per venue, the venue's most distinctive;
 *  - deals on particular days first, spread across the week from the send
 *    day (one per day before a second on any day), then every-day deals, and
 *    at most MAX_HAPPY_HOURS plain happy hours, last;
 *  - rotated by `issueNumber`, so next week's issue leads with different ones.
 */
export function pickWeeklyDeals(
  specials: Special[],
  dayOfWeek: number,
  limit = WEEKLY_DEAL_LIMIT,
  issueNumber = 0
): Special[] {
  const rank = (s: Special) => (isPlainHappyHour(s) ? 2 : 0) + (hasSetDays(s) ? 0 : 1);
  const bestPerVenue = new Map<string, Special>();
  for (const s of specials) {
    if (dealSourceUrl(s) === null || daysUnknown(s)) continue;
    const key = s.venue_name.trim().toLowerCase();
    const held = bestPerVenue.get(key);
    if (!held || rank(s) < rank(held)) bestPerVenue.set(key, s);
  }
  const pool = [...bestPerVenue.values()].sort((a, b) => a.venue_name.localeCompare(b.venue_name));

  const happyHours = pool.filter(isPlainHappyHour);
  const others = pool.filter((s) => !isPlainHappyHour(s));
  const everyDay = others.filter((s) => !hasSetDays(s));

  // Particular-day deals, round-robin over how soon they next run.
  const byDay = new Map<number, Special[]>();
  for (const s of others.filter(hasSetDays)) {
    const d = daysUntilNext(s.weekdays, dayOfWeek);
    byDay.set(d, [...(byDay.get(d) ?? []), s]);
  }
  const spread: Special[] = [];
  const days = [...byDay.keys()].sort((a, b) => a - b);
  while (days.some((d) => (byDay.get(d) ?? []).length > 0)) {
    for (const d of days) {
      const next = byDay.get(d)!.shift();
      if (next) spread.push(next);
    }
  }

  const hh = happyHours
    .sort((a, b) => Number(hasSetDays(b)) - Number(hasSetDays(a)) || a.venue_name.localeCompare(b.venue_name))
    .slice(0, MAX_HAPPY_HOURS);
  // Each issue starts `limit` further down the list, so consecutive issues
  // don't repeat the same deals (issue 0 = 7 Oct 2026).
  const ordered = [...spread, ...everyDay, ...hh];
  return rotate(ordered, issueNumber * limit).slice(0, limit);
}

function rotate<T>(items: T[], by: number): T[] {
  if (items.length === 0) return items;
  const k = ((by % items.length) + items.length) % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

/** Weekly issues since the first deals issue (Wed 7 Oct 2026 = 0). */
export function issueNumberFor(dateStr: string): number {
  const days = (Date.parse(`${dateStr}T00:00:00Z`) - Date.parse("2026-10-07T00:00:00Z")) / 86_400_000;
  return Math.max(0, Math.floor((days + 3) / 7));
}

/**
 * The description, unless it only restates the title or where we found it
 * ("Happy hour (Finn's guide, 24 Aug 2026).") — the Source link covers that.
 */
export function dealBlurb(special: Pick<Special, "title" | "description">): string | null {
  const desc = special.description?.trim();
  if (!desc) return null;
  const core = desc.replace(/\([^)]*\)/g, "").replace(/[.\s]+$/, "").trim();
  if (core.length < 25 || core.toLowerCase() === special.title.trim().toLowerCase()) return null;
  // A trailing "(Honeycombers, 5 Jan 2026)" is our note on where we found it, not the reader's.
  return desc.replace(/\s*\([^)]*\)\s*(?=[.\s]*$)/, "").trim();
}

/** 17:00 → "5 PM", 17:30 → "5:30 PM": the same 12-hour style the events use. */
function time12(t: string): string {
  const [h, m] = t.slice(0, 5).split(":");
  const hour = parseInt(h, 10);
  const h12 = hour % 12 || 12;
  return `${m === "00" ? h12 : `${h12}:${m}`} ${hour >= 12 ? "PM" : "AM"}`;
}

/** "5–7 PM"-style hours for the email; the site's 24-hour `formatHours` stays on /deals. */
function emailHours(start: string | null, end: string | null): string | null {
  if (start && end) return `${time12(start)} – ${time12(end)}`;
  if (start) return `from ${time12(start)}`;
  if (end) return `until ${time12(end)}`;
  return null;
}

/** The inbox preview line: the first two deals, then the event count. */
export function buildPreheader(deals: Special[], eventCount: number): string {
  const full = preheaderFor(deals.slice(0, 2), eventCount);
  // Inboxes show ~100–140 characters; drop the second deal rather than cut mid-word.
  return full.length <= 140 ? full : preheaderFor(deals.slice(0, 1), eventCount);
}

const DAY_IN_TITLE = /\b(mon|tues|wednes|thurs|fri|satur|sun)day\b/i;

function preheaderFor(deals: Special[], eventCount: number): string {
  const parts = deals.map((d) => {
    const label = formatWeekdays(d.weekdays);
    const soft = /^(Weekdays|Weekends)$/.test(label) ? label.toLowerCase() : label;
    // "Sunday cookout … on Sun" says it twice; "Sun, Tue" reads as "Sun and Tue".
    const days = hasSetDays(d) && !DAY_IN_TITLE.test(d.title) ? ` on ${soft.replace(/, ([^,]+)$/, " and $1")}` : "";
    return `${d.title} at ${d.venue_name}${days}`;
  });
  const events = eventCount > 0 ? `Plus ${eventCount} thing${eventCount === 1 ? "" : "s"} on in Ubud this week.` : "";
  if (parts.length === 0) return events;
  const deal = parts.join("; ").replace(/^./, (c) => c.toUpperCase());
  return [`${deal}.`, events].filter(Boolean).join(" ");
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
      const when = [formatDays(s), emailHours(s.start_time, s.end_time), formatIdr(s.price_idr)]
        .filter(Boolean)
        .join(" · ");
      const blurb = dealBlurb(s);
      const desc = blurb
        ? `<p style="margin:6px 0 0;font-size:13px;line-height:1.5;color:${CHARCOAL};font-family:Georgia,serif;">${esc(clip(blurb, 160))}</p>`
        : "";
      return `
  <tr><td style="padding:14px 32px;border-top:1px solid ${GOLD}22;">
    <p style="margin:0;font-size:17px;color:${GREEN};font-family:Georgia,serif;font-weight:500;">${esc(s.title)}</p>
    <p style="margin:4px 0 0;font-size:13px;color:${CHARCOAL}aa;font-family:Georgia,serif;">${where}${when ? ` · ${esc(when)}` : ""}</p>
    ${desc}
  </td></tr>`;
    })
    .join("");

  // Said once for every deal, and only when a price is on the page: Bali menu prices often add tax and service.
  const showsPrice = deals.some((s) => s.price_idr != null || /\bIDR\b|\d\s?k\b/i.test(`${s.title} ${s.description ?? ""}`));
  const priceNote = showsPrice
    ? `
  <tr><td style="padding:6px 32px 0;">
    <p style="margin:0;font-size:12px;color:${CHARCOAL}88;font-family:Georgia,serif;">Restaurant prices in Bali often add tax and service on top.</p>
  </td></tr>`
    : "";

  return `
  <tr><td style="padding:22px 32px 4px;">
    <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-family:Georgia,serif;">This week's deals</p>
  </td></tr>
  ${rows}${priceNote}
  <tr><td style="padding:10px 32px 4px;">
    <a href="${siteUrl}${DEALS_PATH}" style="font-size:14px;color:${GREEN};font-family:Georgia,serif;">Every deal in Ubud →</a>
  </td></tr>`;
}
