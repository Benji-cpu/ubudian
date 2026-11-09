import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ insert: mockInsert }) }),
}));
const mockLive = vi.fn();
vi.mock("@/lib/specials/queries", () => ({ getLiveSpecials: () => mockLive() }));
const mockRate = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => mockRate(),
  getClientIp: () => "127.0.0.1",
}));

import { POST } from "../route";

const BROWSER = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const DEAL_ID = "8c1f2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";

const req = (body: unknown, ua: string | null = BROWSER) =>
  new Request("http://localhost/api/deals/track", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(ua === null ? {} : { "User-Agent": ua }) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/deals/track", () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockInsert.mockResolvedValue({ error: null });
    mockLive.mockReset();
    mockLive.mockResolvedValue([
      { id: DEAL_ID, venue_name: "Hita Spa Ubud" },
      { id: "11111111-2222-4333-8444-555555555555", venue_name: "Moksa" },
    ]);
    mockRate.mockReset();
    mockRate.mockReturnValue({ success: true, remaining: 100, resetAt: Date.now() + 3600000 });
  });

  it("writes a view for a venue with a live deal and returns 204", async () => {
    const res = await POST(req({ slug: "hita-spa-ubud", kind: "view" }));
    expect(res.status).toBe(204);
    expect(mockInsert).toHaveBeenCalledWith({ venue_slug: "hita-spa-ubud", kind: "view", special_id: null });
  });

  it("stores only the slug, kind and deal id: no user agent, IP or referrer", async () => {
    await POST(req({ slug: "hita-spa-ubud", kind: "map", specialId: DEAL_ID }));
    expect(Object.keys(mockInsert.mock.calls[0][0]).sort()).toEqual(["kind", "special_id", "venue_slug"]);
    expect(mockInsert.mock.calls[0][0].special_id).toBe(DEAL_ID);
  });

  it("drops a deal id that belongs to another venue", async () => {
    await POST(req({ slug: "moksa", kind: "share", specialId: DEAL_ID }));
    expect(mockInsert.mock.calls[0][0]).toEqual({ venue_slug: "moksa", kind: "share", special_id: null });
  });

  it.each([
    ["an unknown kind", { slug: "moksa", kind: "click" }],
    ["a missing slug", { kind: "view" }],
    ["a slug with capitals or slashes", { slug: "../Moksa", kind: "view" }],
    ["a deal id that isn't a uuid", { slug: "moksa", kind: "view", specialId: "42" }],
  ])("returns 400 for %s", async (_label, body) => {
    const res = await POST(req(body));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ data: null, error: "Invalid event" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 400 for a body that isn't JSON", async () => {
    const res = await POST(req("not json"));
    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "facebookexternalhit/1.1",
    "WhatsApp/2.23.20.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0 Safari/537.36",
    "curl/8.4.0",
    "python-requests/2.31",
    "Go-http-client/1.1",
  ])("returns 204 without writing for the bot %s", async (ua) => {
    const res = await POST(req({ slug: "hita-spa-ubud", kind: "view" }, ua));
    expect(res.status).toBe(204);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("treats a missing user agent as a bot", async () => {
    const res = await POST(req({ slug: "hita-spa-ubud", kind: "view" }, null));
    expect(res.status).toBe(204);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("writes nothing for a slug with no live deal", async () => {
    const res = await POST(req({ slug: "no-such-venue", kind: "view" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ data: null, error: "Unknown deal page" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 429 and writes nothing once the rate limit is hit", async () => {
    mockRate.mockReturnValue({ success: false, remaining: 0, resetAt: Date.now() + 3600000 });
    const res = await POST(req({ slug: "hita-spa-ubud", kind: "view" }));
    expect(res.status).toBe(429);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 500 in the { data, error } shape when the write fails", async () => {
    mockInsert.mockResolvedValue({ error: { message: "boom" } });
    const res = await POST(req({ slug: "hita-spa-ubud", kind: "view" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ data: null, error: "Could not save" });
  });
});
