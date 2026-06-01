import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isStaleProneTicketHost,
  embeddedLastDay,
  fetchTicketLastDay,
} from "@/lib/events/ticket-freshness";

describe("isStaleProneTicketHost", () => {
  it("matches megatix country domains, not other hosts", () => {
    expect(isStaleProneTicketHost("https://megatix.co.id/events/x")).toBe(true);
    expect(isStaleProneTicketHost("https://megatix.com.sg/events/y")).toBe(true);
    expect(isStaleProneTicketHost("https://www.tickettailor.com/events/z")).toBe(false);
    expect(isStaleProneTicketHost("https://dragonfly-village.com/activity/x")).toBe(false);
  });
});

describe("embeddedLastDay", () => {
  it("prefers endDate, falls back to startDate, null when absent", () => {
    expect(
      embeddedLastDay('{"startDate":"2024-06-29T19:00:00+08:00","endDate":"2024-07-01T22:00:00+08:00"}'),
    ).toBe("2024-07-01");
    expect(embeddedLastDay('{"startDate":"2022-06-05T18:30:00+08:00"}')).toBe("2022-06-05");
    expect(embeddedLastDay("<html>no structured data here</html>")).toBeNull();
  });
});

describe("fetchTicketLastDay", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns the JSON-LD date for a stale-prone host", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response('<script type="application/ld+json">{"startDate":"2022-06-05T18:30:00+08:00"}</script>', {
        status: 200,
      }),
    ) as unknown as typeof fetch;
    expect(await fetchTicketLastDay("https://megatix.co.id/events/old")).toBe("2022-06-05");
  });

  it("skips non-stale-prone hosts without fetching", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    expect(await fetchTicketLastDay("https://www.eventbrite.com/e/123")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null on a 403 challenge (can't verify → don't block)", async () => {
    globalThis.fetch = vi.fn(async () => new Response("Just a moment...", { status: 403 })) as unknown as typeof fetch;
    expect(await fetchTicketLastDay("https://megatix.co.id/events/walled")).toBeNull();
  });

  it("returns null when the fetch throws", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("network down");
    }) as unknown as typeof fetch;
    expect(await fetchTicketLastDay("https://megatix.co.id/events/x")).toBeNull();
  });
});
