#!/usr/bin/env node
// scripts/scrape/megatix-harvest.mjs
//
// Standalone GH-Actions harvester for Megatix (megatix.co.id), ported from
// src/lib/ingestion/adapters/megatix.ts. Megatix's per-event geocode+dedup sweep
// can't fit a Vercel function even at maxDuration=60 (it 504'd daily) — so we run
// the fetch+map here (no timeout) and POST pre-parsed events to
// /api/cron/curator-ingest?source=megatix, where the route does dedup, geocode,
// and the Megatix year-roll guard (ticket-freshness) and forces status='pending'.
//
// Plain fetch — no browser, no deps. Public Nuxt API, no auth.
//
// USAGE
//   node scripts/scrape/megatix-harvest.mjs            # prints {date,source,events} JSON
//   node scripts/scrape/megatix-harvest.mjs --out f.json

import { writeFileSync } from "fs";

const MEGATIX_BASE = "https://megatix.co.id/api/v2/events";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Targeted ICP search terms. NB: the generic "ubud" term is deliberately omitted —
// it dragged in restaurants, day-passes, nightlife and tourist activities. Venue +
// modality terms keep the harvest dead-centre our universe.
const SEARCH_TERMS = ["yoga barn", "sayuri", "ecstatic dance", "breathwork", "sound healing", "sound bath", "ecstatic", "tantra", "cacao", "kirtan", "paradiso", "dissolve", "contact improv", "5rhythms", "movement medicine", "shamanic", "ceremony", "womens circle", "mens circle"];
const LOCALITIES = ["Ubud", "Gianyar", "Peliatan", "Mas", "Sayan", "Campuhan", "Penestanan", "Nyuh Kuning", "Keliki", "Lodtunduh", "Tegallalang", "Kedewatan", "Singakerta"];
const KNOWN_VENUES = ["The Yoga Barn", "Yoga Barn", "Sayuri", "Askara Sound Temple", "Paradiso Ubud"];
const MAX_LIST_PAGES = 20;
const MAX_EVENTS = 60;
const FETCH_DELAY_MS = 300;

const JUNK = /\b(deposit payment|gift voucher|gift card|seating reservation|drink charge|private event payments?|booking fee)\b/i;
// Megatix search (esp. the generic "ubud" term) drags in tourist + private-booking
// noise. Drop it at the source so it never reaches the pending queue. (The route's
// matchOffTopicKeywords also catches ATV/rafting/pub-crawl/monkey-forest, but not the
// private-experience / gimmick patterns below.)
// Negative filter. Tourist + private-booking noise (top line) PLUS the venue
// retail/training/beauty/self-help/comedy noise that the "yoga barn"/"sayuri"
// searches drag in (bottom lines — these recurred daily in the 2026-06-03
// triage and are not conscious-community gatherings).
const NEGATIVE = new RegExp([
  "\\b(pub crawl|bar crawl|nightlife|monkey forest|\\batv\\b|rafting|zipline|jet ?ski|day ?trip|day pass|day out|sightseeing|swing\\b|waterfall tour",
  "private (session|experience|djembe|guitar|acoustic)|1[- ]?on[- ]?1|one[- ]?on[- ]?one|puppy (painting|yoga)|cooking class|food tour|wine tasting",
  // venue retail / clinical wellness / beauty
  "face yoga|gua sha|facial anatomy|lymphatic|osteopath|biodynamic|abdominal release|hormone|cycle (health|wisdom|harmony)|spine\\b",
  // trainings / courses (professional, not community)
  "teacher training|masterclass|\\b\\d{2,3} ?(h|hr|hour)\\b|\\d+-day .*(training|course)|facilitator training|foundations training|certification",
  // comedy / open-mic-comedy / language / self-help
  "comedy|stand[- ]?up|impostor|overthinking|reinventing yourself|making life meaningful|language class|live music (tuesday|wednesday|thursday|friday|monday) night)\\b",
].join("|"), "i");
const CATEGORY_RULES = [
  [/ecstatic dance|dance class|conscious dance|5rhythms|contact improv|movement/i, "Dance & Movement"],
  [/tantra|intimacy|sensual/i, "Tantra & Intimacy"],
  [/sound healing|sound bath|sound journey|cacao ceremony|cacao|gong bath|singing bowl|kirtan/i, "Ceremony & Sound"],
  [/breathwork|healing|bodywork|reiki|holotropic/i, "Healing & Bodywork"],
  [/yoga|meditation/i, "Yoga & Meditation"],
  [/\bcommunity\b|circle|social|meetup/i, "Circle & Community"],
  [/\bjazz\b|live music|live acoustic|\bdj\b|concert|festival|\bgig\b|acoustic night|open mic/i, "Music & Performance"],
  [/\bpainting\b|\bart\b|gallery|exhibition|\bcraft\b|carving|pottery|drawing|\bculture\b|ceremony/i, "Art & Culture"],
  [/workshop|\bclass\b|masterclass|course|training|retreat|immersion/i, "Retreat & Training"],
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
// Word-boundary match — NOT substring. The locality "Mas" must not match inside
// "massage" / "Christmas", which let Lombok ("Kuta Lombok") venues slip through.
const localityMatch = (text, locs) => {
  const l = (text || "").toLowerCase();
  return locs.some((x) => new RegExp(`\\b${x.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(l));
};

// Extract a start time from free text. Prefers the start of a range ("5–6:30 PM"
// → 17:00, "10AM-1PM" → 10:00, where only the end may carry am/pm), else the first
// single clock time ("6 PM" → 18:00, "2:30pm" → 14:30). Returns HH:MM or null.
export function timeFromText(text) {
  if (!text) return null;
  const to24 = (hStr, minStr, ap) => {
    let h = parseInt(hStr, 10);
    if (!ap || h < 1 || h > 12) return null;
    const min = minStr || "00";
    ap = ap.toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${min}`;
  };
  const range = text.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\s*[–—\-]\s*\d{1,2}(?:[:.]\d{2})?\s*(am|pm)\b/i);
  if (range) return to24(range[1], range[2], range[3] || range[4]);
  const single = text.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s?(am|pm)\b/i);
  if (single) return to24(single[1], single[2], single[3]);
  return null;
}
const isUbudArea = (venue, locs) => [venue?.name, venue?.suburb, venue?.full_address].filter(Boolean).some((f) => localityMatch(f, locs));
function mapCategory(title, description) {
  const text = `${title} ${description}`;
  for (const [pat, cat] of CATEGORY_RULES) if (pat.test(text)) return cat;
  return "Other";
}
function stripHtml(html) {
  return (html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}
const fetchSearchPage = (term, page) => fetchJson(`${MEGATIX_BASE}/search?search=${encodeURIComponent(term)}&page=${page}`);
async function fetchEventDetail(slug) {
  const data = await fetchJson(`${MEGATIX_BASE}/${slug}`);
  return data.data || data;
}

async function harvest() {
  const seen = new Set();
  const candidates = [];
  let pagesFetched = 0;

  for (const term of SEARCH_TERMS) {
    if (pagesFetched >= MAX_LIST_PAGES) break;
    let page = 1, lastPage = 1;
    while (page <= lastPage) {
      if (pagesFetched >= MAX_LIST_PAGES) break;
      let result;
      try { result = await fetchSearchPage(term, page); }
      catch (e) { process.stderr.write(`[megatix] search "${term}" p${page}: ${e}\n`); break; }
      lastPage = result?.meta?.last_page ?? 1;
      pagesFetched++;
      for (const ev of result?.data ?? []) { if (!seen.has(ev.id)) { seen.add(ev.id); candidates.push(ev); } }
      page++;
      if (page <= lastPage && pagesFetched < MAX_LIST_PAGES) await delay(200);
    }
  }

  const events = [];
  let scanned = 0, dropped = 0;
  for (const ev of candidates) {
    if (events.length >= MAX_EVENTS) break;
    scanned++;
    if (JUNK.test(ev.name) || NEGATIVE.test(ev.name)) { dropped++; continue; }

    const knownVenueMatch = ev.venue_name ? KNOWN_VENUES.some((kv) => ev.venue_name.toLowerCase().includes(kv.toLowerCase())) : false;
    const quickMatch = knownVenueMatch || (ev.venue_name ? localityMatch(ev.venue_name, LOCALITIES) : false);

    let venueName = ev.venue_name, venueAddress = null, description = "";
    try {
      await delay(FETCH_DELAY_MS);
      const detail = await fetchEventDetail(ev.slug);
      if (!quickMatch && (!detail.venue || !isUbudArea(detail.venue, LOCALITIES))) { dropped++; continue; }
      description = detail.description ? stripHtml(detail.description) : "";
      venueName = detail.venue?.name || ev.venue_name;
      venueAddress = detail.venue?.full_address || null;
    } catch {
      if (!quickMatch) { dropped++; continue; } // can't verify Ubud → drop
      description = ev.name;
    }

    // Megatix's start_datetime is SPACE-separated ("2026-06-09 09:00:00"), not ISO
    // "T"-separated — splitting on "T" alone silently dropped every time (the date
    // only survived by Postgres DATE-column truncation). Split on T-or-space. Fall
    // back to timeFromText only when start_datetime genuinely carries no time.
    const startDate = ev.start_datetime ? ev.start_datetime.split(/[T ]/)[0] : "";
    if (!startDate) { dropped++; continue; }
    const startTime = (ev.start_datetime ? (ev.start_datetime.split(/[T ]/)[1]?.slice(0, 5) || null) : null) || timeFromText(description);
    const endDate = ev.end_datetime ? ev.end_datetime.split(/[T ]/)[0] : null;
    const endTime = ev.end_datetime ? (ev.end_datetime.split(/[T ]/)[1]?.slice(0, 5) || null) : null;
    const eventUrl = `https://megatix.co.id/events/${ev.slug}`;

    events.push({
      title: ev.name,
      description,
      short_description: description.slice(0, 200) || null,
      category: mapCategory(ev.name, description),
      venue_name: venueName,
      venue_address: venueAddress,
      start_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
      is_recurring: ev.is_recurring || false,
      price_info: ev.display_price || null,
      external_ticket_url: eventUrl,
      organizer_name: ev.promoter_name || null,
      cover_image_url: ev.cover || null,
      source_url: eventUrl,
      source_event_id: String(ev.id),
    });
  }
  return { events, scanned: candidates.length, kept: events.length, dropped };
}

(async () => {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf("--out");
  const outFile = outIdx >= 0 ? args[outIdx + 1] : null;
  const stamp = process.env.TODAY ||
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const { events, scanned, kept, dropped } = await harvest();
  const payload = { date: stamp, source: "megatix", events };
  const json = JSON.stringify(payload, null, 2);
  if (outFile) writeFileSync(outFile, json + "\n");
  else process.stdout.write(json + "\n");
  process.stderr.write(`[megatix-harvest] ${kept} events kept, ${dropped} dropped, ${scanned} candidates scanned${outFile ? ` -> ${outFile}` : ""}\n`);
})().catch((e) => { process.stderr.write(`ERR ${e}\n`); process.exit(2); });
