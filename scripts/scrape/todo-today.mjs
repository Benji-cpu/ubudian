#!/usr/bin/env node
// scripts/scrape/todo-today.mjs
//
// Cloudflare-bypassing fetch for todo.today/ubud. The site uses a "managed"
// challenge that rejects HeadlessChrome user-agents and looks at
// navigator.webdriver. With a real Chrome UA + a stealth init script, the
// challenge passes in headless mode.
//
// Usage:
//   node scripts/scrape/todo-today.mjs [url]
//   # default url: https://todo.today/ubud/
//
// Why this script exists, not just inlined in the curator agent: the agent's
// WebFetch tool can't override UA or inject init scripts. This is a Node
// shim the agent calls via Bash. Keep it dependency-free — relies only on
// the playwright package already in node_modules.

import { chromium } from "playwright";

const TARGET = process.argv[2] || "https://todo.today/ubud/";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
    timezoneId: "Asia/Makassar",
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    // @ts-ignore
    window.chrome = window.chrome || { runtime: {} };
  });

  const page = await ctx.newPage();
  await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 60_000 });

  // Wait up to 30s for the Cloudflare challenge title to resolve
  for (let i = 0; i < 30; i++) {
    const title = await page.title();
    if (title && !/Just a moment/i.test(title)) break;
    await page.waitForTimeout(1000);
  }

  // Tomorrow page is JS-populated; give it time to render event cards
  if (/tomorrow|today\/$/i.test(TARGET)) {
    await page.waitForTimeout(3000);
  }

  const html = await page.content();
  process.stdout.write(html);

  await browser.close();
})().catch((e) => {
  process.stderr.write(`ERR ${e}\n`);
  process.exit(2);
});
