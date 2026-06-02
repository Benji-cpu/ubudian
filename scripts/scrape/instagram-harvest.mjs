#!/usr/bin/env node
// scripts/scrape/instagram-harvest.mjs
//
// FREE Instagram harvester — replaces the paid Apify actor. Stealth headless
// Chromium loads each public profile, then calls IG's own web_profile_info API
// from inside the page context (carries cookies + the public x-ig-app-id), which
// returns the recent timeline posts (caption, image, shortcode, timestamp).
//
// Captions are unstructured, so we DON'T build events here — we pre-filter posts
// that *look* like events (a day/date/time/"join"/"every" signal) and POST the
// raw posts to /api/cron/instagram-ingest, which runs the existing Gemini
// classify/parse (parseEventFromImage / classifyAndParseMessage) and lands
// pending. The caption pre-filter keeps the LLM bill + queue noise down.
//
// HONEST CAVEAT: IG aggressively rate-limits/blocks DATACENTER IPs. This works
// reliably from a residential IP; from GH Actions runners it may 429/`error`
// intermittently. Per-handle failures are caught and skipped. If CI proves
// unreliable, run from a residential proxy or keep Apify as the fallback.
//
// USAGE
//   node scripts/scrape/instagram-harvest.mjs            # prints {date,source,posts}
//   node scripts/scrape/instagram-harvest.mjs --out f.json
//   IG_HANDLES=a,b,c node scripts/scrape/instagram-harvest.mjs   # override handles

import { chromium } from "playwright";
import { writeFileSync } from "fs";

const IG_APP_ID = "936619743392459"; // public web app id
const DEFAULT_HANDLES = ["yogabarnbali", "paradisoubud", "blossom.ubud", "thesanctuaryubud", "dragonflyvillageubud", "barastudio.ubud", "pyramidsofchi"];
const POSTS_PER_HANDLE = 8;

// A caption is event-likely if it mentions a weekday, a date, a clock time, or a
// joining/recurrence cue. Cheap pre-filter before the (paid) LLM parse.
const EVENT_SIGNAL = /\b(mon|tue|wed|thu|fri|sat|sun)(day|s)?\b|\b\d{1,2}(:\d{2})?\s?(am|pm)\b|\b\d{1,2}(st|nd|rd|th)\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b|\b(join us|this (week|weekend|friday|saturday|sunday)|every (mon|tue|wed|thu|fri|sat|sun)|tonight|tomorrow|rsvp|tickets?|doors open|line[- ]?up|workshop|ceremony|gathering|class|jam|session)\b/i;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchHandle(page, handle) {
  await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await delay(2500);
  const data = await page.evaluate(async ({ h, appId }) => {
    try {
      const r = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${h}`, { headers: { "x-ig-app-id": appId } });
      if (!r.ok) return { error: r.status };
      const j = await r.json();
      const edges = j?.data?.user?.edge_owner_to_timeline_media?.edges || [];
      return { edges: edges.map((e) => ({
        shortcode: e.node.shortcode,
        is_video: e.node.is_video,
        display_url: e.node.display_url || e.node.thumbnail_src || null,
        ts: e.node.taken_at_timestamp,
        caption: e.node.edge_media_to_caption?.edges?.[0]?.node?.text || "",
      })) };
    } catch (err) { return { error: String(err).slice(0, 80) }; }
  }, { h: handle, appId: IG_APP_ID });
  return data;
}

(async () => {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf("--out");
  const outFile = outIdx >= 0 ? args[outIdx + 1] : null;
  const handles = (process.env.IG_HANDLES ? process.env.IG_HANDLES.split(",") : DEFAULT_HANDLES).map((h) => h.trim()).filter(Boolean);
  const stamp = process.env.TODAY ||
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const browser = await chromium.launch({ headless: true, args: ["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-features=IsolateOrigins,site-per-process"] });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 }, locale: "en-US", timezoneId: "Asia/Makassar",
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
    window.chrome = window.chrome || { runtime: {} };
  });
  const page = await ctx.newPage();

  const posts = [];
  const handleStats = {};
  for (const handle of handles) {
    let res;
    try { res = await fetchHandle(page, handle); }
    catch (e) { res = { error: String(e).slice(0, 80) }; }
    if (res.error) { handleStats[handle] = `err:${res.error}`; await delay(3000); continue; }
    const recent = (res.edges || []).slice(0, POSTS_PER_HANDLE);
    const kept = recent.filter((p) => EVENT_SIGNAL.test(p.caption));
    for (const p of kept) {
      posts.push({
        handle,
        caption: p.caption.slice(0, 2200),
        image_urls: p.display_url ? [p.display_url] : [],
        permalink: `https://www.instagram.com/p/${p.shortcode}/`,
        external_id: `ig-${p.shortcode}`,
        timestamp: p.ts ? new Date(p.ts * 1000).toISOString() : null,
      });
    }
    handleStats[handle] = `${kept.length}/${recent.length} event-like`;
    await delay(2500 + Math.floor(2000 * ((handle.length % 5) / 5))); // jittered, deterministic
  }
  await browser.close();

  const payload = { date: stamp, source: "instagram-public", posts };
  const json = JSON.stringify(payload, null, 2);
  if (outFile) writeFileSync(outFile, json + "\n");
  else process.stdout.write(json + "\n");
  process.stderr.write(`[instagram-harvest] ${posts.length} event-like posts from ${handles.length} handles\n`);
  for (const [h, s] of Object.entries(handleStats)) process.stderr.write(`  ${h}: ${s}\n`);
})().catch((e) => { process.stderr.write(`ERR ${e}\n`); process.exit(2); });
