#!/usr/bin/env node
// scripts/scrape/pyramids-harvest.mjs
//
// GH-Actions harvester for Pyramids of Chi's own events calendar
// (https://pyramidsofchi.com/events/, a Modern Events Calendar page). Sound
// healing, breathwork, kundalini, moon ceremonies: dead-centre for the site.
// Plain fetch + regex over the listing markup, no browser, no LLM, no deps.
// POSTs pre-parsed events to /api/cron/curator-ingest under source
// "pyramids-of-chi", where the route dedups, geocodes and queues them as
// pending for the nightly gate (same path as megatix-harvest.mjs).
//
// Each listing article carries date, start/end time, title, link and image.
// We drop 1:1 private sessions (not gatherings) and keep at most
// MAX_PER_TITLE upcoming dates per session so daily repeats don't flood the
// site.
//
// USAGE
//   node scripts/scrape/pyramids-harvest.mjs            # prints {date,source,events} JSON
//   node scripts/scrape/pyramids-harvest.mjs --out f.json

import { writeFileSync } from "fs";

const LIST_URL = "https://pyramidsofchi.com/events/";
// A plain UA: the site's Cloudflare 403s a full Chrome UA string.
const UA = "Mozilla/5.0";
const VENUE_NAME = "Pyramids of Chi";
const VENUE_ADDRESS = "Jl. Raya Lungsiakan, Kedewatan, Ubud, Bali";
const WINDOW_DAYS = 21;
const MAX_PER_TITLE = 4;
const FETCH_DELAY_MS = 250;

const PRIVATE = /^\s*1\s*:\s*1\b|\bprivate\b|\bone[- ]on[- ]one\b/i;
const CATEGORY_RULES = [
  [/breath|ice immersion|rebirthing/i, "Healing & Bodywork"],
  [/sound|gong|handpan|frequency|scalar|dome/i, "Ceremony & Sound"],
  [/moon|ceremony|cacao|kirtan/i, "Ceremony & Sound"],
  [/kundalini|meditation|kriya|yoga|chakra/i, "Yoga & Meditation"],
  [/hypno|emdr|therapy|healing|reiki/i, "Healing & Bodywork"],
  [/circle|leela|game|community/i, "Circle & Community"],
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) =>
  s.replace(/&#0?38;|&amp;/g, "&").replace(/&#8211;|&ndash;/g, "–").replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

function to24h(t) {
  const m = /(\d{1,2}):(\d{2})\s*(am|pm)/i.exec(t || "");
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === "pm") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}


function mapCategory(title) {
  for (const [re, cat] of CATEGORY_RULES) if (re.test(title)) return cat;
  return "Healing & Bodywork";
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

// The monthly calendar groups articles under one section per day:
//   <div class="mec-calendar-events-sec" ... data-mec-cell="20261009">
//     <article class="mec-event-article "> ... mec-event-time "12:00 pm - 1:30 pm"
//       <h4 class="mec-event-title"><a href="…/event/slug/">Title</a></h4>
function parseListing(html) {
  const out = [];
  const sections = html.split('mec-calendar-events-sec"');
  for (const sec of sections.slice(1)) {
    const cell = /data-mec-cell="(\d{4})(\d{2})(\d{2})"/.exec(sec.slice(0, 300));
    if (!cell) continue;
    const date = `${cell[1]}-${cell[2]}-${cell[3]}`;
    for (const art of sec.split('<article class="mec-event-article').slice(1)) {
      const block = art.slice(0, 3000);
      const times = /mec-event-time[^>]*>(?:\s*<i[^>]*><\/i>)?\s*([^<]+)</.exec(block)?.[1] || "";
      const [s, e] = times.split(/\s+-\s+/);
      const link = /<h4 class="mec-event-title">\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/.exec(block);
      if (!link) continue;
      const image = /data-src="([^"]+\.(?:jpe?g|png|webp))"/i.exec(block)?.[1] || null;
      out.push({ date, start: to24h(s), end: to24h(e), url: link[1], title: decode(link[2]), image });
    }
  }
  return out;
}

async function description(url) {
  try {
    const html = await fetchText(url);
    const og = /<meta property="og:description" content="([^"]*)"/.exec(html)?.[1];
    return og ? decode(og) : "";
  } catch {
    return "";
  }
}

async function harvest() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(new Date());
  const last = new Date(Date.now() + WINDOW_DAYS * 864e5).toISOString().slice(0, 10);
  const rows = parseListing(await fetchText(LIST_URL));

  const seen = new Set();
  const perTitle = new Map();
  const picked = [];
  let dropped = 0;
  for (const r of rows.sort((a, b) => (a.date + (a.start || "")).localeCompare(b.date + (b.start || "")))) {
    if (r.date < today || r.date > last) continue;
    if (PRIVATE.test(r.title)) { dropped++; continue; }
    const key = `${r.title}|${r.date}|${r.start}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const n = perTitle.get(r.title) || 0;
    if (n >= MAX_PER_TITLE) { dropped++; continue; }
    perTitle.set(r.title, n + 1);
    picked.push(r);
  }

  const descByUrl = new Map();
  const events = [];
  for (const r of picked) {
    if (!descByUrl.has(r.url)) {
      await delay(FETCH_DELAY_MS);
      descByUrl.set(r.url, await description(r.url));
    }
    const desc = descByUrl.get(r.url) || r.title;
    events.push({
      title: r.title,
      description: desc,
      short_description: desc.slice(0, 200) || null,
      category: mapCategory(r.title),
      venue_name: VENUE_NAME,
      venue_address: VENUE_ADDRESS,
      start_date: r.date,
      end_date: r.date,
      start_time: r.start,
      end_time: r.end,
      is_recurring: false,
      price_info: null,
      external_ticket_url: r.url,
      organizer_name: VENUE_NAME,
      cover_image_url: r.image,
      source_url: r.url,
      source_event_id: `${r.url}#${r.date}T${r.start || ""}`,
    });
  }
  return { events, scanned: rows.length, kept: events.length, dropped };
}

(async () => {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf("--out");
  const outFile = outIdx >= 0 ? args[outIdx + 1] : null;
  const stamp = process.env.TODAY ||
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const { events, scanned, kept, dropped } = await harvest();
  const payload = { date: stamp, source: "pyramids-of-chi", events };
  const json = JSON.stringify(payload, null, 2);
  if (outFile) writeFileSync(outFile, json + "\n");
  else process.stdout.write(json + "\n");
  process.stderr.write(`[pyramids-harvest] ${kept} events kept, ${dropped} dropped, ${scanned} listing rows${outFile ? ` -> ${outFile}` : ""}\n`);
})().catch((e) => { process.stderr.write(`ERR ${e}\n`); process.exit(2); });
