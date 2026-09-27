/**
 * What a listing must carry before it is worth publishing, and when two
 * listings are the same gathering.
 *
 * The test is the visitor's: could you go tonight on this listing alone?
 * That needs a real place and a way in — a ticket link, an organiser you can
 * reach, or a named venue you can walk into. On 26 Sep 2026, 67% of live
 * listings had no ticket link or organiser contact, and 38 gave only an area
 * ("Outside Ubud", "Penestanan") — a private address you could never find.
 *
 * Pure functions: the editorial gate, the detail page and the audit script
 * all read the same rules.
 */
import { parseRecurrenceRule, daysOfWeekArray } from "@/lib/recurrence";

type ListingFields = {
  venue_name: string | null;
  external_ticket_url?: string | null;
  organizer_contact?: string | null;
  organizer_instagram?: string | null;
};

/** Villages, districts and placeholders — somewhere, but not a door. */
const AREA_NAMES = new Set([
  "ubud", "central ubud", "outside ubud", "greater ubud", "ubud centre", "ubud center",
  "bali", "gianyar", "penestanan", "sayan", "kedewatan", "mas", "peliatan", "nyuh kuning",
  "lodtunduh", "tegallalang", "pengosekan", "campuhan", "keliki", "tebesaya", "payangan",
  "petulu", "singakerta", "sanggingan", "junjungan", "bentuyung", "kutuh", "pejeng",
  "tampaksiring", "sukawati", "online", "various", "various locations", "multiple venues",
]);
const PLACEHOLDER = /^(tba|tbc|tbd|to be (announced|confirmed)|secret|private|location|address|dm |message |venue (shared|revealed|on)|shared (on|after))/;

function normaliseVenue(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/( (bali|indonesia|area|village|region))+$/, "")
    .trim();
}

/** A named place you could walk into — not a village, district or placeholder. */
export function isSpecificVenue(name: string | null | undefined): boolean {
  if (!name) return false;
  const n = normaliseVenue(name);
  if (n.length < 3) return false;
  if (AREA_NAMES.has(n) || AREA_NAMES.has(n.replace(/ ubud$/, ""))) return false;
  return !PLACEHOLDER.test(n);
}

export type WayIn =
  | { kind: "tickets"; url: string }
  | { kind: "organiser"; contact: string | null; instagram: string | null }
  | { kind: "walk-in"; venue: string };

/**
 * How a visitor gets in, in order of how sure it is. Null means the listing
 * gives them no way to go — it should not be published.
 */
export function wayIn(event: ListingFields): WayIn | null {
  const ticket = event.external_ticket_url?.trim();
  if (ticket && /^https?:\/\//i.test(ticket)) return { kind: "tickets", url: ticket };
  const contact = event.organizer_contact?.trim() || null;
  const instagram = event.organizer_instagram?.trim() || null;
  if (contact || instagram) return { kind: "organiser", contact, instagram };
  if (isSpecificVenue(event.venue_name)) return { kind: "walk-in", venue: event.venue_name!.trim() };
  return null;
}

/** Turn an organiser contact into a link: WhatsApp for a phone, mailto for an email, else the URL. */
export function contactHref(contact: string): string | null {
  const c = contact.trim();
  if (/^https?:\/\//i.test(c)) return c;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return `mailto:${c}`;
  const digits = c.replace(/[^\d+]/g, "");
  if (/^\+?\d{8,15}$/.test(digits)) {
    const intl = digits.startsWith("+") ? digits.slice(1) : digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
    return `https://wa.me/${intl}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Same gathering, listed twice
// ---------------------------------------------------------------------------

export type SlotFields = {
  id: string;
  title: string;
  venue_name: string | null;
  start_date: string;
  end_date?: string | null;
  start_time: string | null;
  is_recurring: boolean | null;
  recurrence_rule: string | null;
};

/** Words too common to say two titles are the same gathering. */
const GENERIC = new Set([
  "with", "the", "and", "for", "from", "into", "your", "yoga", "class", "classes", "workshop",
  "session", "sessions", "circle", "ceremony", "sound", "dance", "healing", "journey", "meditation",
  "music", "live", "night", "special", "community", "weekly", "edition", "event", "gathering",
  "ubud", "bali", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
  "morning", "evening", "sunset", "open", "free", "intro", "introduction", "beginners", "practice",
]);

function significantWords(title: string, venue: string | null): Set<string> {
  const venueWords = new Set(normaliseVenue(venue ?? "").split(" "));
  return new Set(
    title
      .toLowerCase()
      // "w/ <this week's DJ>" names the facilitator, not the gathering.
      .replace(/\bw\/.*$/, "")
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !GENERIC.has(w) && !venueWords.has(w)),
  );
}

function venueKey(name: string | null): string {
  return normaliseVenue(name ?? "").replace(/^the /, "").replace(/ ubud\b/g, "").replace(/[^a-z0-9]/g, "").slice(0, 6);
}

function weekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Weekdays a recurring row lands on, or null when it is not a live weekly-style series. */
function seriesDays(e: SlotFields): { days: Set<number>; from: string; until: string | null } | null {
  if (!e.is_recurring) return null;
  const rule = parseRecurrenceRule(e.recurrence_rule);
  if (!rule) return null;
  const days =
    rule.frequency === "daily"
      ? [0, 1, 2, 3, 4, 5, 6]
      : daysOfWeekArray(rule).length > 0
        ? daysOfWeekArray(rule)
        : [weekday(e.start_date)];
  return { days: new Set(days), from: e.start_date, until: rule.until ?? null };
}

function oneOffCoversDay(e: SlotFields, date: string): boolean {
  const end = e.end_date && e.end_date > e.start_date ? e.end_date : e.start_date;
  return e.start_date <= date && date <= end;
}

/**
 * Are these two rows the same gathering? Same named venue, same start time,
 * a shared day, and at least one distinctive title word in common.
 *
 * Built for what the harvesters actually do: todo.today lists each week of a
 * series under that week's facilitator ("Friday Ecstatic Dance w/ DION",
 * "… w/ Karunika"), each flagged weekly, so one Friday dance became four
 * cards every Friday. Two different gatherings in the same room at the same
 * minute sharing a distinctive word is rare; showing one twice is the
 * failure the visitor sees.
 */
export function sameGathering(a: SlotFields, b: SlotFields): boolean {
  if (a.id === b.id) return false;
  if (!a.start_time || !b.start_time || a.start_time.slice(0, 5) !== b.start_time.slice(0, 5)) return false;
  if (!isSpecificVenue(a.venue_name) || !isSpecificVenue(b.venue_name)) return false;
  if (venueKey(a.venue_name) !== venueKey(b.venue_name)) return false;

  const wa = significantWords(a.title, a.venue_name);
  const wb = significantWords(b.title, b.venue_name);
  let shared = false;
  for (const w of wa) if (wb.has(w)) shared = true;
  if (!shared) return false;

  const sa = seriesDays(a);
  const sb = seriesDays(b);
  if (sa && sb) {
    for (const d of sa.days) if (sb.days.has(d)) return true;
    return false;
  }
  if (sa || sb) {
    const series = (sa ? a : b) as SlotFields;
    const days = (sa ?? sb)!;
    const oneOff = sa ? b : a;
    const date = oneOff.start_date;
    return (
      days.days.has(weekday(date)) &&
      date >= series.start_date &&
      (days.until === null || date <= days.until)
    );
  }
  return oneOffCoversDay(a, b.start_date) || oneOffCoversDay(b, a.start_date);
}
