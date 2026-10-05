import type { Event, Special } from "@/types";
import {
  formatDays,
  formatHours,
  formatIdr,
  addDaysToDateStr,
  specialsForToday,
} from "@/lib/specials";
import { pickWeeklyDeals } from "@/lib/email/weekly-deals";
import { parseTimeToMinutes, type BaliNow } from "@/lib/events/bali-time";

/** Enough to fill a phone screen or two; the rest is a link away. */
export const MAX_SPECIALS = 8;
export const MAX_GATHERINGS = 10;

/** Only claims what's true today: no venue has confirmed yet, but every deal names its source. */
const SIGN_OFF = (site: string) => `Free. Every deal links to where we found it: ${site}/deals`;

type PostEvent = Pick<Event, "title" | "venue_name" | "start_date" | "start_time" | "is_recurring">;

const SHORT_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function shortDate(dateStr: string): string {
  return SHORT_DATE.format(new Date(`${dateStr}T00:00:00Z`));
}

function bareSite(siteUrl: string): string {
  return siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function dealLine(s: Special, withDays: boolean): string {
  const days = withDays ? formatDays(s) : null;
  const when = [days === "Every day" ? "every day" : days, formatHours(s.start_time, s.end_time)]
    .filter(Boolean)
    .join(" ");
  const price = formatIdr(s.price_idr);
  return `• *${s.venue_name}*: ${s.title}${price ? ` (${price})` : ""}${when ? `, ${when}` : ""}`;
}

/**
 * The weekly WhatsApp Channel post, as plain text with WhatsApp's own
 * formatting (*bold*). Channels have no posting API, so a person pastes this.
 *
 * Deals are the weekly email's pick (`pickWeeklyDeals`): one per venue, a
 * public source, days stated, particular-day deals first, so no one venue
 * fills the post. `events` must already be public (`visibleListings`) and
 * rolled forward, so each `start_date` is the next occurrence. Only the 7 days
 * from today count; one-offs come first, since a weekly class will be there
 * next week and a one-off won't.
 */
export function buildWeeklyPost(opts: {
  specials: Special[];
  events: PostEvent[];
  now: BaliNow;
  siteUrl: string;
}): string {
  const { events, now } = opts;
  const todayStr = now.dateStr;
  const site = bareSite(opts.siteUrl);
  const lastDay = addDaysToDateStr(todayStr, 6);

  const lines: string[] = [
    `*This week in Ubud* · ${shortDate(todayStr)} – ${shortDate(lastDay)}`,
    "",
  ];

  const deals = pickWeeklyDeals(opts.specials, now.dayOfWeek, MAX_SPECIALS);
  if (deals.length > 0) {
    lines.push("*Deals*");
    for (const s of deals) lines.push(dealLine(s, true));
    lines.push(`More, by day: ${site}/deals`, "");
  }

  const week = events
    .filter((e) => e.start_date >= todayStr && e.start_date <= lastDay)
    .sort(
      (a, b) =>
        Number(a.is_recurring) - Number(b.is_recurring) ||
        a.start_date.localeCompare(b.start_date) ||
        (a.start_time ?? "99").localeCompare(b.start_time ?? "99"),
    );
  const picked = week
    .slice(0, MAX_GATHERINGS)
    .sort(
      (a, b) =>
        a.start_date.localeCompare(b.start_date) ||
        (a.start_time ?? "99").localeCompare(b.start_time ?? "99"),
    );

  if (picked.length > 0) {
    lines.push("*Gatherings*");
    for (const e of picked) {
      const time = e.start_time ? ` ${e.start_time.slice(0, 5)}` : "";
      const venue = e.venue_name ? `, ${e.venue_name}` : "";
      lines.push(`• ${shortDate(e.start_date)}${time}: ${e.title}${venue}`);
    }
    if (week.length > picked.length) lines.push(`…and ${week.length - picked.length} more`);
    lines.push(`Everything on this week: ${site}/events`, "");
  }

  if (deals.length === 0 && picked.length === 0) {
    lines.push("Nothing listed yet this week.", "");
  }

  lines.push(SIGN_OFF(site));
  return lines.join("\n");
}

/**
 * Today's Channel post: the deals still on today (by Bali weekday and hours,
 * so a deal with no stated days never appears), one per venue, and today's
 * gatherings you can still get to, earliest first.
 */
export function buildTodayPost(opts: {
  specials: Special[];
  events: PostEvent[];
  now: BaliNow;
  siteUrl: string;
}): string {
  const { now } = opts;
  const site = bareSite(opts.siteUrl);
  const lines: string[] = [
    `*Ubud deals today* · ${LONG_DATE.format(new Date(`${now.dateStr}T00:00:00Z`))}`,
    "",
  ];

  const seen = new Set<string>();
  const deals = specialsForToday(opts.specials, now).filter((s) => {
    const key = s.venue_name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (deals.length > 0) {
    lines.push("*Deals today*");
    for (const s of deals.slice(0, MAX_SPECIALS)) lines.push(dealLine(s, false));
    if (deals.length > MAX_SPECIALS) lines.push(`…and ${deals.length - MAX_SPECIALS} more`);
    lines.push("");
  }

  // Still worth walking into: not started, or started in the last half hour
  // (the homepage's rule), so an afternoon post doesn't list the 10am class.
  const today = opts.events
    .filter((e) => {
      if (e.start_date !== now.dateStr) return false;
      const start = parseTimeToMinutes(e.start_time);
      return start === null || now.timeMinutes - start <= 30;
    })
    .sort((a, b) => (a.start_time ?? "99").localeCompare(b.start_time ?? "99"));
  if (today.length > 0) {
    lines.push("*Gatherings today*");
    for (const e of today.slice(0, MAX_GATHERINGS)) {
      const time = e.start_time ? `${e.start_time.slice(0, 5)}: ` : "";
      lines.push(`• ${time}${e.title}${e.venue_name ? `, ${e.venue_name}` : ""}`);
    }
    if (today.length > MAX_GATHERINGS) lines.push(`…and ${today.length - MAX_GATHERINGS} more`);
    lines.push("");
  }

  if (deals.length === 0 && today.length === 0) lines.push("Nothing listed for today yet.", "");
  lines.push(SIGN_OFF(site));
  return lines.join("\n");
}
