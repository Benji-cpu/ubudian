import { describe, it, expect, vi, beforeEach } from "vitest";

/** A fake PostgREST query: records its filters and serves `rows` by `.range()`. */
let rows: { venue_slug: string; kind: string; created_at: string }[] = [];
const calls: { eq: [string, string][]; gte: [string, string][]; ranges: [number, number][] } = { eq: [], gte: [], ranges: [] };
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => {
        const filters: { eq: [string, string][]; gte: [string, string][]; range: [number, number] } = { eq: [], gte: [], range: [0, 999] };
        const q = {
          gte: (col: string, v: string) => (filters.gte.push([col, v]), calls.gte.push([col, v]), q),
          eq: (col: string, v: string) => (filters.eq.push([col, v]), calls.eq.push([col, v]), q),
          order: () => q,
          range: (a: number, b: number) => ((filters.range = [a, b]), calls.ranges.push([a, b]), q),
          then: (resolve: (r: { data: unknown[]; error: null }) => void) => {
            const matching = rows
              .filter((r) => filters.gte.every(([, v]) => r.created_at >= v))
              .filter((r) => filters.eq.every(([c, v]) => (r as Record<string, string>)[c] === v));
            resolve({ data: matching.slice(filters.range[0], filters.range[1] + 1), error: null });
          },
        };
        return q;
      },
    }),
  }),
}));

import {
  dealTrackSchema,
  emptyCounts,
  getAllDealPageCounts,
  getDealPageCounts,
  isBotUserAgent,
  sinceIso,
  summarizeCounts,
} from "@/lib/specials/deal-counts";

describe("isBotUserAgent", () => {
  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0)",
    "Mozilla/5.0 (compatible; Yahoo! Slurp)",
    "Baiduspider/2.0",
    "CCBot/2.0 crawler",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "WhatsApp/2.23.20.0 A",
    "TelegramBot (like TwitterBot)",
    "Slackbot-LinkExpanding 1.0",
    "Mozilla/5.0 (compatible; Discordbot/2.0)",
    "Mozilla/5.0 ... Chrome-Lighthouse",
    "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh) Google Page Preview",
    "curl/8.4.0",
    "python-requests/2.31.0",
    "Go-http-client/2.0",
    "Mozilla/5.0 Playwright/1.48",
    "Mozilla/5.0 Puppeteer",
  ])("flags %s", (ua) => {
    expect(isBotUserAgent(ua)).toBe(true);
  });

  it("flags an empty or missing user agent", () => {
    expect(isBotUserAgent("")).toBe(true);
    expect(isBotUserAgent("   ")).toBe(true);
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent(undefined)).toBe(true);
  });

  it.each([
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
  ])("lets a real browser through: %s", (ua) => {
    expect(isBotUserAgent(ua)).toBe(false);
  });
});

describe("dealTrackSchema", () => {
  it("accepts every kind the table allows", () => {
    for (const kind of ["view", "map", "website", "instagram", "share", "book"]) {
      expect(dealTrackSchema.safeParse({ slug: "moksa", kind }).success).toBe(true);
    }
  });

  it("rejects an unknown kind, a non-slug and a non-uuid deal id", () => {
    expect(dealTrackSchema.safeParse({ slug: "moksa", kind: "tap" }).success).toBe(false);
    expect(dealTrackSchema.safeParse({ slug: "Moksa Ubud", kind: "view" }).success).toBe(false);
    expect(dealTrackSchema.safeParse({ slug: "", kind: "view" }).success).toBe(false);
    expect(dealTrackSchema.safeParse({ slug: "a".repeat(121), kind: "view" }).success).toBe(false);
    expect(dealTrackSchema.safeParse({ slug: "moksa", kind: "view", specialId: "abc" }).success).toBe(false);
  });
});

describe("summarizeCounts", () => {
  it("counts views apart from taps, and taps by kind", () => {
    const c = summarizeCounts([
      { kind: "view" },
      { kind: "view" },
      { kind: "view" },
      { kind: "map" },
      { kind: "map" },
      { kind: "instagram" },
      { kind: "share" },
      { kind: "book" },
    ]);
    expect(c.views).toBe(3);
    expect(c.taps).toBe(5);
    expect(c.byKind).toEqual({ view: 3, map: 2, website: 0, instagram: 1, share: 1, book: 1 });
  });

  it("is all zeros for no rows, with every kind present", () => {
    expect(summarizeCounts([])).toEqual(emptyCounts());
    expect(Object.keys(emptyCounts().byKind)).toEqual(["view", "map", "website", "instagram", "share", "book"]);
  });

  it("skips a kind the table doesn't know rather than calling it a tap", () => {
    expect(summarizeCounts([{ kind: "scroll" }, { kind: "view" }])).toMatchObject({ views: 1, taps: 0 });
  });
});

describe("sinceIso", () => {
  it("is `days` days before now", () => {
    expect(sinceIso(30, new Date("2026-11-09T12:00:00Z"))).toBe("2026-10-10T12:00:00.000Z");
    expect(sinceIso(0, new Date("2026-11-09T12:00:00Z"))).toBe("2026-11-09T12:00:00.000Z");
  });
});

describe("getDealPageCounts / getAllDealPageCounts", () => {
  beforeEach(() => {
    calls.eq = [];
    calls.gte = [];
    calls.ranges = [];
    const recent = new Date(Date.now() - 2 * 86_400_000).toISOString();
    const old = new Date(Date.now() - 40 * 86_400_000).toISOString();
    rows = [
      { venue_slug: "moksa", kind: "view", created_at: recent },
      { venue_slug: "moksa", kind: "view", created_at: recent },
      { venue_slug: "moksa", kind: "map", created_at: recent },
      { venue_slug: "moksa", kind: "view", created_at: old },
      { venue_slug: "hita-spa-ubud", kind: "view", created_at: recent },
      { venue_slug: "hita-spa-ubud", kind: "share", created_at: recent },
    ];
  });

  it("returns one venue's views and taps within the window", async () => {
    const c = await getDealPageCounts("moksa", 30);
    expect(c).toMatchObject({ views: 2, taps: 1 });
    expect(c.byKind.map).toBe(1);
    expect(calls.eq).toContainEqual(["venue_slug", "moksa"]);
    expect(calls.gte[0][0]).toBe("created_at");
  });

  it("widens with the window", async () => {
    expect((await getDealPageCounts("moksa", 60)).views).toBe(3);
  });

  it("is zero for a venue with no rows", async () => {
    expect(await getDealPageCounts("cilantro-mexican-restaurant", 30)).toEqual(emptyCounts());
  });

  it("keys every venue by slug", async () => {
    const all = await getAllDealPageCounts(30);
    expect([...all.keys()].sort()).toEqual(["hita-spa-ubud", "moksa"]);
    expect(all.get("hita-spa-ubud")).toMatchObject({ views: 1, taps: 1 });
  });

  it("reads past PostgREST's 1,000-row page", async () => {
    const recent = new Date(Date.now() - 86_400_000).toISOString();
    rows = Array.from({ length: 2500 }, () => ({ venue_slug: "moksa", kind: "view", created_at: recent }));
    expect((await getDealPageCounts("moksa", 30)).views).toBe(2500);
    expect(calls.ranges).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });
});
