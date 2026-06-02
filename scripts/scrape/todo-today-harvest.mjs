#!/usr/bin/env node
// scripts/scrape/todo-today-harvest.mjs
//
// Structured harvester for todo.today/ubud — the single richest Ubud event
// aggregator (~26 today / ~33 tomorrow in the Ubud channel). Emits a
// curator-ingest payload: { date, source: "todo-today", events: ParsedEvent[] }.
//
// HOW IT WORKS
//   todo.today is a JS-rendered WordPress SPA behind a Cloudflare managed
//   challenge. We launch a stealthed headless Chromium (real Chrome UA +
//   navigator.webdriver shim), let it pass the challenge on /ubud/, then call
//   the site's own JSON API *from inside the page context* (so the cf_clearance
//   cookie rides along):
//       GET /api/todo-today/v1/events?channel=ubud[&event_date=tomorrow]
//   The API returns sections[].events[] with name, image, venue, start/end
//   time, price, category_id, recurrence — everything we need, no HTML parsing.
//
// ATTRIBUTION (curator/playbook.md "Competitor harvest"):
//   todo.today is a SCOUT domain. We NEVER store its URLs on an event. The
//   event's own `link`/`share_link` are dropped; external_ticket_url is left
//   null in this v1 (the ticket-direct URL lives on the detail page — a
//   follow-up enhancement). We DO keep todo.today's image (the correct cover)
//   and the google_map venue link.
//
// ICP FILTER:
//   todo.today is noisy (Reformer pilates, Barre, Vinyasa, food tours). We keep
//   only conscious-community categories, with a positive-keyword gate on the
//   ambiguous "Wellness" bucket, plus a negative keyword sweep. Everything still
//   lands as `pending` for the daily routine to make the final call.
//
// USAGE
//   node scripts/scrape/todo-today-harvest.mjs            # prints payload JSON to stdout
//   node scripts/scrape/todo-today-harvest.mjs --out f.json
//   TODAY=2026-06-02 node scripts/scrape/todo-today-harvest.mjs   # override date stamp
//
// Dependency-free apart from the `playwright` already in node_modules.

import { chromium } from "playwright";
import { writeFileSync } from "fs";

const CHANNEL_URL = "https://todo.today/ubud/";
const API = (q) => `/api/todo-today/v1/events?channel=ubud${q}`;

// todo.today category_id -> our event category. Only these categories pass.
// (Full taxonomy: 1 Wellness, 2 Dance&Movement, 3 Sports&Fitness,
//  4 Consciousness&Spirituality, 5 Arts&Creativity, 6 Community&Social,
//  7 Music, 8 Food&Drink, 9 Special, 10 Relationships&Connection, 11 Family&Kids,
//  13 Learning, 15 Comedy, 16 Local Culture, 17 Parties&Nightlife,
//  19 Tantra&Sensual Arts, 22 Business, 24 Theater.)
// Values MUST match the events.category vocabulary exactly, or
// createEventFromParsed defaults them to "Other":
//   Dance & Movement | Yoga & Meditation | Ceremony & Sound | Tantra & Intimacy
//   Art & Culture | Circle & Community | Retreat & Training | Music & Performance
//   Healing & Bodywork | Food & Makers | Other
const CATEGORY_MAP = {
  2: "Dance & Movement",
  4: "Ceremony & Sound",
  19: "Tantra & Intimacy",
  10: "Circle & Community",
  7: "Music & Performance",
  5: "Art & Culture",
};
// Ambiguous buckets allowed ONLY when the title matches a positive ICP keyword.
const GATED_CATEGORIES = { 1: "Wellness", 6: "Community", 9: "Special" };
const GATED_CATEGORY = "Ceremony & Sound"; // breathwork/cacao/sound land here

const POSITIVE_ICP =
  /\b(breathwork|breath\s?work|cacao|kirtan|ecstatic|5\s?rhythms|contact improv|somatic|sound (bath|healing|journey)|gong|tantra|sensual|ceremony|ceremonial|sacred|medicine|shaman|womb|yoni|sufi|whirling|qawwali|devotional|bhakti|circle|cuddle|authentic relating)\b/i;
const NEGATIVE_ICP =
  /\b(reformer|pilates|barre|mat flex|nooe|vinyasa|hatha|yin yoga|yoga class|gym|hiit|crossfit|bootcamp|market tour|food tour|cooking class|wine|cocktail|brunch|networking|coworking|massage course|teacher training|ytt|\b\d{2,3}hr\b)\b/i;

function toHHMM(t) {
  // "3:00 PM" -> "15:00", "11:00 AM" -> "11:00"
  if (!t || typeof t !== "string") return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

function dateFromLink(link) {
  // https://todo.today/ubud/2026/06/02/slug -> 2026-06-02
  const m = (link || "").match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

const DOW = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
function recurrenceFrom(ev) {
  // recurring_label "Weekly", recurring_tooltip "Every tuesday · Until 28 Jul 2026"
  if (!ev.recurring_label) return { is_recurring: false, recurrence_rule: null, end_date: null };
  const tip = (ev.recurring_tooltip || "").toLowerCase();
  const dm = tip.match(/every\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);
  const day = dm ? DOW[dm[1]] : null;
  let end_date = null;
  const um = tip.match(/until\s+(\d{1,2})\s+([a-z]{3})\s+(\d{4})/i);
  if (um) {
    const months = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
    const mo = months[um[2].toLowerCase()];
    if (mo) end_date = `${um[3]}-${mo}-${String(um[1]).padStart(2, "0")}`;
  }
  const rule = day === null
    ? JSON.stringify({ frequency: "weekly" })
    : JSON.stringify({ frequency: "weekly", day_of_week: [day] });
  return { is_recurring: true, recurrence_rule: rule, end_date };
}

function mapEvent(ev) {
  const start_date = dateFromLink(ev.link);
  if (!ev.name || !start_date) return null;

  const allowed = CATEGORY_MAP[ev.category_id];
  const gated = GATED_CATEGORIES[ev.category_id];
  const hay = `${ev.name} ${ev.short_name || ""} ${ev.creator_name || ""}`;
  if (NEGATIVE_ICP.test(hay)) return null;
  let category;
  if (allowed) category = allowed;
  else if (gated && POSITIVE_ICP.test(hay)) category = GATED_CATEGORY;
  else return null; // off-ICP

  const rec = recurrenceFrom(ev);
  const facilitator = ev.creator_name ? ` with ${ev.creator_name}` : "";
  const venuePart = ev.venue ? ` at ${ev.venue}` : "";
  const recPart = ev.recurring_tooltip ? ` ${ev.recurring_tooltip}.` : "";

  return {
    title: ev.name,
    short_description: ev.short_name || ev.name,
    description: `${ev.name}${facilitator}${venuePart}.${recPart}`.trim(),
    category,
    venue_name: ev.venue || null,
    venue_map_url: ev.google_map || null,
    start_date,
    end_date: rec.end_date,
    start_time: toHHMM(ev.start_time),
    end_time: toHHMM(ev.end_time),
    is_recurring: rec.is_recurring,
    recurrence_rule: rec.recurrence_rule,
    price_info: ev.price_label || null,
    cover_image_url: ev.image || null,
    // Attribution: never store the todo.today link. Ticket-direct URL lives on
    // the detail page — left null for v1 (card renders without a CTA).
    external_ticket_url: null,
    source_url: null,
    source_event_id: `todo-${ev.id}`,
  };
}

async function fetchEvents(page, query) {
  return await page.evaluate(async (url) => {
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) return { error: r.status };
    return await r.json();
  }, query);
}

function flattenSections(data) {
  if (!data || !Array.isArray(data.sections)) return [];
  const out = [];
  for (const sec of data.sections) {
    if (Array.isArray(sec.events)) out.push(...sec.events);
  }
  return out;
}

(async () => {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf("--out");
  const outFile = outIdx >= 0 ? args[outIdx + 1] : null;
  const stamp =
    process.env.TODAY ||
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-features=IsolateOrigins,site-per-process"],
  });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
    timezoneId: "Asia/Makassar",
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    window.chrome = window.chrome || { runtime: {} };
  });

  const page = await ctx.newPage();
  await page.goto(CHANNEL_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  for (let i = 0; i < 30; i++) {
    const t = await page.title();
    if (t && !/just a moment/i.test(t)) break;
    await page.waitForTimeout(1000);
  }

  const todayData = await fetchEvents(page, API(""));
  const tomorrowData = await fetchEvents(page, API("&event_date=tomorrow"));
  await browser.close();

  const raw = [...flattenSections(todayData), ...flattenSections(tomorrowData)];
  // Dedup by todo.today id
  const byId = new Map();
  for (const ev of raw) if (ev && ev.id != null && !byId.has(ev.id)) byId.set(ev.id, ev);

  const events = [];
  let dropped = 0;
  for (const ev of byId.values()) {
    const mapped = mapEvent(ev);
    if (mapped) events.push(mapped);
    else dropped++;
  }

  const payload = { date: stamp, source: "todo-today", events };
  const json = JSON.stringify(payload, null, 2);
  if (outFile) {
    writeFileSync(outFile, json + "\n");
    process.stderr.write(`[todo-today-harvest] ${events.length} ICP events kept, ${dropped} dropped, ${byId.size} unique scanned -> ${outFile}\n`);
  } else {
    process.stdout.write(json + "\n");
    process.stderr.write(`[todo-today-harvest] ${events.length} ICP events kept, ${dropped} dropped, ${byId.size} unique scanned\n`);
  }
})().catch((e) => {
  process.stderr.write(`ERR ${e}\n`);
  process.exit(2);
});
