import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockOr = vi.fn();
const mockIn = vi.fn(() => ({ or: mockOr }));
const mockSelect = vi.fn(() => ({ in: mockIn }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

import { checkExternalLinkHealth } from "@/lib/maintenance/cleanups";

describe("checkExternalLinkHealth", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockOr.mockReset();
    mockIn.mockClear();
    mockSelect.mockClear();
    mockFrom.mockClear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("classifies 4xx/5xx and fetch failures as broken, leaves 2xx/3xx healthy", async () => {
    mockOr.mockResolvedValue({
      data: [
        {
          id: "evt-1",
          external_ticket_url: "https://ok.example/tickets/1",
          venue_name: "Yoga Barn",
          venue_map_url: "https://maps.example/yoga-barn",
          status: "approved",
        },
        {
          id: "evt-2",
          external_ticket_url: "https://broken.example/404",
          venue_name: null,
          venue_map_url: null,
          status: "pending",
        },
        {
          id: "evt-3",
          external_ticket_url: "https://throws.example/x",
          venue_name: "Old Place",
          venue_map_url: "https://maps.example/old-place-broken",
          status: "approved",
        },
        {
          id: "evt-4",
          external_ticket_url: null,
          venue_name: "Yoga Barn",
          venue_map_url: "https://maps.example/yoga-barn",
          status: "approved",
        },
      ],
      error: null,
    });

    const fetchMock = vi.fn(async (url: string | URL) => {
      const u = String(url);
      if (u === "https://ok.example/tickets/1") return new Response(null, { status: 200 });
      if (u === "https://maps.example/yoga-barn") return new Response(null, { status: 301 });
      if (u === "https://broken.example/404") return new Response(null, { status: 404 });
      if (u === "https://throws.example/x") throw new TypeError("network down");
      if (u === "https://maps.example/old-place-broken") return new Response(null, { status: 503 });
      throw new Error(`unexpected url ${u}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const report = await checkExternalLinkHealth();

    expect(mockFrom).toHaveBeenCalledWith("events");
    expect(mockIn).toHaveBeenCalledWith("status", ["approved", "pending"]);

    // 4 ticket URLs (3 non-null) + 2 unique map URLs = 5 unique targets.
    // headOnce retries with GET on 4xx/5xx or non-numeric status, so the 3
    // unhealthy URLs each get probed twice: 5 + 3 = 8 fetches total.
    expect(report.checked).toBe(5);
    expect(fetchMock).toHaveBeenCalledTimes(8);

    const byUrl = new Map(report.broken.map((b) => [b.url, b]));
    expect(byUrl.has("https://ok.example/tickets/1")).toBe(false);
    expect(byUrl.has("https://maps.example/yoga-barn")).toBe(false);

    expect(byUrl.get("https://broken.example/404")).toMatchObject({
      entity: "event",
      id: "evt-2",
      status: 404,
    });
    expect(byUrl.get("https://maps.example/old-place-broken")).toMatchObject({
      entity: "venue",
      id: "Old Place",
      status: 503,
    });
    const thrown = byUrl.get("https://throws.example/x");
    expect(thrown?.entity).toBe("event");
    expect(thrown?.id).toBe("evt-3");
    expect(typeof thrown?.status).toBe("string");
  });

  it("treats a Cloudflare challenge (403 + 'Just a moment') as healthy, not broken", async () => {
    mockOr.mockResolvedValue({
      data: [
        {
          id: "evt-cf",
          external_ticket_url: "https://www.tickettailor.com/events/barastudio/1755020",
          venue_name: null,
          venue_map_url: null,
          status: "approved",
        },
      ],
      error: null,
    });

    const fetchMock = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      // HEAD and GET both 403; only GET carries the interstitial body.
      if (init?.method === "GET") {
        return new Response("<title>Just a moment...</title>", { status: 403 });
      }
      return new Response(null, { status: 403 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const report = await checkExternalLinkHealth();
    expect(report.checked).toBe(1);
    expect(report.broken).toEqual([]); // challenge ≠ broken
  });

  it("flags a megatix 200 'already taken place' page as stale", async () => {
    mockOr.mockResolvedValue({
      data: [
        {
          id: "evt-stale",
          external_ticket_url: "https://megatix.co.id/events/mudra-kirtan",
          venue_name: null,
          venue_map_url: null,
          status: "approved",
        },
      ],
      error: null,
    });

    const fetchMock = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      if (init?.method === "GET") {
        return new Response("<p>This event has already taken place.</p>", { status: 200 });
      }
      return new Response(null, { status: 200 }); // healthy HEAD, but megatix is stale-prone → GET-verified
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const report = await checkExternalLinkHealth();
    expect(report.checked).toBe(1);
    expect(report.broken).toHaveLength(1);
    expect(report.broken[0]).toMatchObject({
      entity: "event",
      id: "evt-stale",
      status: "stale",
    });
  });

  it("flags a megatix 200 as stale via past JSON-LD date even when the 'taken place' copy is buried past the scan window", async () => {
    // Mirrors real megatix HTML: schema.org block near the top carries a past
    // startDate, while the human-readable "already taken place" copy sits ~26KB
    // deep. The JSON-LD signal must catch it regardless of body-scan limits.
    mockOr.mockResolvedValue({
      data: [
        {
          id: "evt-jsonld-stale",
          external_ticket_url: "https://megatix.co.id/events/beauty-way-jun",
          venue_name: null,
          venue_map_url: null,
          status: "approved",
        },
      ],
      error: null,
    });

    const body =
      `<html><head><script type="application/ld+json">` +
      `{"@context":"https://schema.org","@type":"Event",` +
      `"startDate":"2024-06-29T19:00:00+08:00","endDate":"2024-06-29T22:00:00+08:00"}` +
      `</script></head><body>${"x".repeat(28000)}` +
      `<p>This event has already taken place.</p></body></html>`;

    const fetchMock = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      if (init?.method === "GET") return new Response(body, { status: 200 });
      return new Response(null, { status: 200 }); // healthy HEAD → megatix GET-verified
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const report = await checkExternalLinkHealth();
    expect(report.checked).toBe(1);
    expect(report.broken).toHaveLength(1);
    expect(report.broken[0]).toMatchObject({ id: "evt-jsonld-stale", status: "stale" });
  });

  it("dedupes venue map URLs across events", async () => {
    mockOr.mockResolvedValue({
      data: [
        { id: "a", external_ticket_url: null, venue_name: "X", venue_map_url: "https://m.example/x", status: "approved" },
        { id: "b", external_ticket_url: null, venue_name: "X", venue_map_url: "https://m.example/x", status: "approved" },
        { id: "c", external_ticket_url: null, venue_name: "X", venue_map_url: "https://m.example/x", status: "pending" },
      ],
      error: null,
    });
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const report = await checkExternalLinkHealth();
    expect(report.checked).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(report.broken).toEqual([]);
  });

  it("throws when supabase returns an error", async () => {
    mockOr.mockResolvedValue({ data: null, error: { message: "no connection" } });
    await expect(checkExternalLinkHealth()).rejects.toThrow(/no connection/);
  });

  it("returns empty report when no rows have URLs", async () => {
    mockOr.mockResolvedValue({ data: [], error: null });
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const report = await checkExternalLinkHealth();
    expect(report).toEqual({ checked: 0, broken: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
