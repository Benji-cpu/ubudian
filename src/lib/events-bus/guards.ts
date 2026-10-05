import type { BusItem } from "@/lib/events-bus/schema";

/** Days ahead an announced event may be. Past that the date is probably misread. */
export const MAX_DAYS_AHEAD = 60;
const MAX_RUN_DAYS = 14;

const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b(?:wa\.me|bit\.ly|linktr\.ee|t\.me|tinyurl\.com|forms\.gle)\/\S*/gi;
// Phone numbers: +62 812-3456-7890, 0812 3456 7890, wa.me links (caught above).
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;

/**
 * Captions carry WhatsApp numbers and link-in-bio URLs. The listing's way in is
 * the organiser's Instagram (or a ticket link that passed the bus's check), so
 * strip both from the copy rather than republish them.
 */
export function scrubCopy(text: string): string {
  return text.replace(URL_RE, "").replace(PHONE_RE, "").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Reasons this item can't be listed, or [] when it can. Pure; unit-tested. */
export function itemProblems(item: BusItem, todayBali: string): string[] {
  const e = item.event;
  const problems: string[] = [];
  if (e.start_date < todayBali) problems.push("start date is past");
  if (e.start_date > addDays(todayBali, MAX_DAYS_AHEAD)) problems.push(`start date over ${MAX_DAYS_AHEAD} days out`);
  if (e.end_date && (e.end_date < e.start_date || e.end_date > addDays(e.start_date, MAX_RUN_DAYS))) {
    problems.push("end date out of range");
  }
  let host = "";
  try {
    const u = new URL(e.source_url);
    host = u.hostname.replace(/^www\./, "");
    if (item.kind === "instagram" && !(host === "instagram.com" && /^\/(p|reel)\/[\w-]+\/?$/.test(u.pathname))) {
      problems.push("instagram source must be a post permalink");
    }
  } catch {
    problems.push("bad source_url");
  }
  if (item.kind === "page" && host === "instagram.com") problems.push("page source cannot be instagram");
  return problems;
}
