import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock source-adapter to prevent side-effect registration
vi.mock("@/lib/ingestion/source-adapter", () => ({
  registerAdapter: vi.fn(),
}));

import {
  fetchSearchPage,
  fetchEventDetail,
  isUbudArea,
  mapCategory,
  stripHtml,
} from "@/lib/ingestion/adapters/megatix";

// Helper: build a search event
function makeSearchEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 101,
    name: "Sunset Yoga at Yoga Barn",
    slug: "sunset-yoga-yoga-barn",
    start_datetime: "2026-04-01T17:00:00",
    end_datetime: "2026-04-01T18:30:00",
    is_recurring: false,
    display_price: "Rp 170,000",
    promoter_name: "Yoga Barn",
    cover: "https://media.megatix.com.au/img/yoga.jpg",
    venue_name: "Yoga Barn, Ubud",
    ...overrides,
  };
}

// Helper: build a detail response
function makeDetailResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      id: 101,
      name: "Sunset Yoga at Yoga Barn",
      slug: "sunset-yoga-yoga-barn",
      description: "<p>Join us for a <strong>beautiful</strong> sunset yoga session.</p>",
      start_datetime: null, // recurring events return null
      end_datetime: null,
      is_recurring: false,
      display_price: "Rp 170,000",
      promoter_name: "Yoga Barn",
      cover: "https://media.megatix.com.au/img/yoga.jpg",
      venue: {
        name: "Yoga Barn",
        suburb: "Ubud",
        full_address: "Jl. Hanoman, Ubud, Gianyar, Bali 80571",
      },
      ...overrides,
    },
  };
}

// Helper: build a search response
function makeSearchResponse(
  events: ReturnType<typeof makeSearchEvent>[] = [makeSearchEvent()],
  meta: { last_page: number; current_page: number } = {
    last_page: 1,
    current_page: 1,
  }
) {
  return { data: events, meta };
}

describe("Megatix Adapter", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("fetchSearchPage", () => {
    it("fetches and returns search results", async () => {
      const mockResponse = makeSearchResponse();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchSearchPage("ubud", 1);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Sunset Yoga at Yoga Barn");
      expect(result.meta.last_page).toBe(1);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://megatix.co.id/api/v2/events/search?search=ubud&page=1",
        expect.objectContaining({
          headers: expect.objectContaining({ "User-Agent": expect.any(String) }),
        })
      );
    });

    it("throws on API error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      });

      await expect(fetchSearchPage("ubud", 1)).rejects.toThrow(
        "Megatix search API error: 403 Forbidden"
      );
    });
  });

  describe("fetchEventDetail", () => {
    it("fetches and returns event detail", async () => {
      const mockDetail = makeDetailResponse();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDetail),
      });

      const result = await fetchEventDetail("sunset-yoga-yoga-barn");

      expect(result.name).toBe("Sunset Yoga at Yoga Barn");
      expect(result.venue?.suburb).toBe("Ubud");
    });

    it("throws on API error with slug in message", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(fetchEventDetail("nonexistent")).rejects.toThrow(
        'Megatix detail API error for "nonexistent": 404 Not Found'
      );
    });
  });

  describe("isUbudArea", () => {
    it("matches venue in Ubud suburb", () => {
      expect(
        isUbudArea({ name: "Some Venue", suburb: "Ubud", full_address: null })
      ).toBe(true);
    });

    it("matches venue with Ubud in address", () => {
      expect(
        isUbudArea({
          name: "Random Place",
          suburb: "Somewhere",
          full_address: "Jl. Raya Ubud, Bali",
        })
      ).toBe(true);
    });

    it("matches venue in Tegallalang", () => {
      expect(
        isUbudArea({
          name: "Rice Terrace Cafe",
          suburb: "Tegallalang",
          full_address: null,
        })
      ).toBe(true);
    });

    it("matches venue with locality in name", () => {
      expect(
        isUbudArea({
          name: "Campuhan Ridge Walk",
          suburb: null,
          full_address: null,
        })
      ).toBe(true);
    });

    it("rejects venue outside Ubud area", () => {
      expect(
        isUbudArea({
          name: "Beach Club",
          suburb: "Seminyak",
          full_address: "Jl. Petitenget, Seminyak, Bali",
        })
      ).toBe(false);
    });

    it("rejects venue with all null fields", () => {
      expect(
        isUbudArea({ name: null, suburb: null, full_address: null })
      ).toBe(false);
    });

    it("uses custom localities when provided", () => {
      expect(
        isUbudArea(
          { name: "Custom Place", suburb: "Kintamani", full_address: null },
          ["Kintamani"]
        )
      ).toBe(true);
    });
  });

  describe("mapCategory", () => {
    it.each([
      // Dance & Movement
      ["Ecstatic Dance", "weekly gathering", "Dance & Movement"],
      ["Conscious Dance", "", "Dance & Movement"],
      // Tantra & Intimacy
      ["Tantra Workshop", "", "Tantra & Intimacy"],
      // Ceremony & Sound
      ["Cacao Ceremony", "", "Ceremony & Sound"],
      ["Full Moon Sound Healing", "", "Ceremony & Sound"],
      ["Kirtan Night", "", "Ceremony & Sound"],
      // Yoga & Meditation
      ["Sunset Yoga at Yoga Barn", "", "Yoga & Meditation"],
      ["Morning Meditation", "", "Yoga & Meditation"],
      // Healing & Bodywork
      ["Breathwork Journey", "", "Healing & Bodywork"],
      ["Reiki Healing Session", "", "Healing & Bodywork"],
      // Circle & Community
      ["Community Cleanup", "", "Circle & Community"],
      ["Women's Circle", "", "Circle & Community"],
      // Music & Performance
      ["Jazz Night at Bridges", "", "Music & Performance"],
      ["Open Mic Night", "", "Music & Performance"],
      ["Live Music at Laughing Buddha", "", "Music & Performance"],
      // Art & Culture
      ["Art Exhibition", "gallery opening", "Art & Culture"],
      ["Balinese Painting Class", "", "Art & Culture"],
      // Retreat & Training
      ["Yoga Teacher Training", "", "Yoga & Meditation"],
      ["Permaculture Workshop", "", "Retreat & Training"],
      ["Balinese Cooking Class", "", "Retreat & Training"],
      // Other (no match)
      ["Random Event Name", "nothing special", "Other"],
      ["Food Tasting Night", "", "Other"],
      ["Organic Farmers Market", "", "Other"],
      ["Kids Fun Day", "", "Other"],
    ])('maps "%s" + "%s" → "%s"', (title, desc, expected) => {
      expect(mapCategory(title, desc)).toBe(expected);
    });

    it("does not match short words without word boundaries", () => {
      // "art" in "starting" should NOT match Art & Culture
      expect(mapCategory("ATV AND RAFTING ONEDAY TRIP", "starting at 8am")).toBe("Other");
      // "dj" in "adjust" should NOT match Music & Performance
      expect(mapCategory("Adjust Your Schedule", "")).toBe("Other");
      // "gig" in "gigantic" should NOT match Music & Performance
      expect(mapCategory("Gigantic Sale", "")).toBe("Other");
      // "class" in "classic" should NOT match Retreat & Training
      expect(mapCategory("Classic Car Show", "")).toBe("Other");
      // "community" should still match with word boundary
      expect(mapCategory("Community Garden", "")).toBe("Circle & Community");
    });
  });

  describe("stripHtml", () => {
    it("strips HTML tags", () => {
      expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe(
        "Hello world"
      );
    });

    it("decodes HTML entities", () => {
      expect(stripHtml("Tom &amp; Jerry &lt;3&gt;")).toBe("Tom & Jerry <3>");
    });

    it("converts br and p tags to newlines", () => {
      const html = "Line 1<br>Line 2<br/>Line 3</p>Next paragraph";
      const result = stripHtml(html);
      expect(result).toContain("Line 1\nLine 2\nLine 3");
    });

    it("collapses excess whitespace", () => {
      expect(stripHtml("  too   many   spaces  ")).toBe("too many spaces");
    });

    it("handles &nbsp; and &#39;", () => {
      expect(stripHtml("don&#39;t&nbsp;stop")).toBe("don't stop");
    });

    it("handles empty string", () => {
      expect(stripHtml("")).toBe("");
    });
  });

  describe("fetchMessages (integration)", () => {
    it("returns RawMessage[] with correct structure for Ubud events", async () => {
      const searchEvent = makeSearchEvent();
      const searchResponse = makeSearchResponse([searchEvent]);
      const detailResponse = makeDetailResponse();

      // First call: search page; Second call: detail fetch
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(detailResponse),
        });

      // Import the adapter via the registerAdapter mock
      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const registeredAdapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      expect(registeredAdapter).toBeDefined();

      const messages = await registeredAdapter!.fetchMessages(
        {
          search_terms: ["ubud"],
          fetch_delay_ms: 0,
          max_events_per_run: 10,
        },
        undefined
      );

      expect(messages).toHaveLength(1);
      const msg = messages[0];
      expect(msg.external_id).toBe("101");
      expect(msg.content_text).toContain("Sunset Yoga");
      expect(msg.raw_data).toBeDefined();

      const parsed = (msg.raw_data as ParsedEvent[])[0];
      expect(parsed.title).toBe("Sunset Yoga at Yoga Barn");
      expect(parsed.start_date).toBe("2026-04-01");
      expect(parsed.start_time).toBe("17:00");
      expect(parsed.end_date).toBe("2026-04-01");
      expect(parsed.end_time).toBe("18:30");
      expect(parsed.price_info).toBe("Rp 170,000");
      expect(parsed.venue_name).toBe("Yoga Barn");
      expect(parsed.venue_address).toBe("Jl. Hanoman, Ubud, Gianyar, Bali 80571");
      expect(parsed.category).toBe("Yoga & Meditation");
      expect(parsed.quality_score).toBe(0.9);
      expect(parsed.external_ticket_url).toBe(
        "https://megatix.co.id/events/sunset-yoga-yoga-barn"
      );
      expect(parsed.source_event_id).toBe("101");
      expect(parsed.cover_image_url).toBe(
        "https://media.megatix.com.au/img/yoga.jpg"
      );
      expect(parsed.organizer_name).toBe("Yoga Barn");
      expect(parsed.is_recurring).toBe(false);
    });

    it("filters out events not in Ubud area", async () => {
      const searchEvent = makeSearchEvent({
        venue_name: "Potato Head Beach Club",
      });
      const searchResponse = makeSearchResponse([searchEvent]);
      const detailResponse = makeDetailResponse({
        venue: {
          name: "Potato Head Beach Club",
          suburb: "Seminyak",
          full_address: "Jl. Petitenget, Seminyak",
        },
      });

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(detailResponse),
        });

      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const adapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      const messages = await adapter!.fetchMessages(
        { search_terms: ["ubud"], fetch_delay_ms: 0 },
        undefined
      );

      expect(messages).toHaveLength(0);
    });

    it("skips venue with Ubud in name without detail fetch", async () => {
      const searchEvent = makeSearchEvent({ venue_name: "Yoga Barn, Ubud" });
      const searchResponse = makeSearchResponse([searchEvent]);
      const detailResponse = makeDetailResponse();

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(detailResponse),
        });

      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const adapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      const messages = await adapter!.fetchMessages(
        { search_terms: ["ubud"], fetch_delay_ms: 0 },
        undefined
      );

      expect(messages).toHaveLength(1);
      // Detail should still be fetched for description, but venue check is skipped
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("deduplicates events across search terms", async () => {
      const event = makeSearchEvent();
      const response1 = makeSearchResponse([event]);
      const response2 = makeSearchResponse([event]); // same event
      const detailResponse = makeDetailResponse();

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(response1),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(response2),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(detailResponse),
        });

      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const adapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      const messages = await adapter!.fetchMessages(
        { search_terms: ["ubud", "yoga"], fetch_delay_ms: 0 },
        undefined
      );

      expect(messages).toHaveLength(1);
    });

    it("respects max_events_per_run limit", async () => {
      const events = Array.from({ length: 5 }, (_, i) =>
        makeSearchEvent({ id: 100 + i, slug: `event-${i}`, venue_name: `Venue Ubud ${i}` })
      );
      const searchResponse = makeSearchResponse(events);

      // Each event triggers a detail fetch
      const mockFetch = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(searchResponse),
      });
      for (let i = 0; i < 5; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve(
              makeDetailResponse({
                id: 100 + i,
                slug: `event-${i}`,
                venue: {
                  name: `Venue Ubud ${i}`,
                  suburb: "Ubud",
                  full_address: "Ubud, Bali",
                },
              })
            ),
        });
      }
      global.fetch = mockFetch;

      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const adapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      const messages = await adapter!.fetchMessages(
        { search_terms: ["ubud"], fetch_delay_ms: 0, max_events_per_run: 2 },
        undefined
      );

      expect(messages).toHaveLength(2);
    });

    it("skips events with no start_datetime", async () => {
      const event = makeSearchEvent({
        start_datetime: null,
        venue_name: "Yoga Barn, Ubud",
      });
      const searchResponse = makeSearchResponse([event]);
      const detailResponse = makeDetailResponse();

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(detailResponse),
        });

      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const adapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      const messages = await adapter!.fetchMessages(
        { search_terms: ["ubud"], fetch_delay_ms: 0 },
        undefined
      );

      expect(messages).toHaveLength(0);
    });

    it("uses default config values when none provided", async () => {
      const event = makeSearchEvent();
      const searchResponse = makeSearchResponse([event]);
      const detailResponse = makeDetailResponse();

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(detailResponse),
        });

      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const adapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      // Pass empty config — should use defaults
      const messages = await adapter!.fetchMessages({}, undefined);
      // Should work with defaults (search_terms: ["ubud"])
      expect(Array.isArray(messages)).toBe(true);
    });

    it("handles recurring events correctly", async () => {
      const event = makeSearchEvent({
        is_recurring: true,
        start_datetime: "2026-04-01T09:00:00",
        venue_name: "Ubud Yoga Centre",
      });
      const searchResponse = makeSearchResponse([event]);
      const detailResponse = makeDetailResponse({
        is_recurring: true,
        start_datetime: null, // recurring events return null in detail
      });

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(detailResponse),
        });

      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const adapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      const messages = await adapter!.fetchMessages(
        { search_terms: ["ubud"], fetch_delay_ms: 0 },
        undefined
      );

      expect(messages).toHaveLength(1);
      const parsed = (messages[0].raw_data as ParsedEvent[])[0];
      expect(parsed.is_recurring).toBe(true);
      // Uses list endpoint's date, not detail's null
      expect(parsed.start_date).toBe("2026-04-01");
      expect(parsed.start_time).toBe("09:00");
    });

    it("caps list page fetches at max_list_pages", async () => {
      // Create 3 pages of results for term "ubud"
      const event1 = makeSearchEvent({ id: 1, slug: "e1", venue_name: "Venue Ubud" });
      const event2 = makeSearchEvent({ id: 2, slug: "e2", venue_name: "Venue Ubud" });
      const event3 = makeSearchEvent({ id: 3, slug: "e3", venue_name: "Venue Ubud" });

      const mockFetch = vi.fn();
      // Page 1 of "ubud" search
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            makeSearchResponse([event1], { last_page: 3, current_page: 1 })
          ),
      });
      // Page 2 of "ubud" search — this is the cap (max_list_pages: 2)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            makeSearchResponse([event2], { last_page: 3, current_page: 2 })
          ),
      });
      // Page 3 should NOT be fetched
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            makeSearchResponse([event3], { last_page: 3, current_page: 3 })
          ),
      });
      // Detail fetches for the 2 events found
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeDetailResponse()),
      });

      global.fetch = mockFetch;

      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const adapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      const messages = await adapter!.fetchMessages(
        { search_terms: ["ubud"], fetch_delay_ms: 0, max_list_pages: 2 },
        undefined
      );

      // Should only have events from pages 1 and 2
      expect(messages).toHaveLength(2);
      // 2 search pages + 2 detail fetches = 4 calls (page 3 never fetched)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it("treats known_ubud_venues as quickMatch without locality in name", async () => {
      // "The Yoga Barn" doesn't contain any locality like "Ubud"
      const event = makeSearchEvent({
        id: 200,
        slug: "ecstatic-dance-yoga-barn",
        venue_name: "The Yoga Barn",
      });
      const searchResponse = makeSearchResponse([event]);
      const detailResponse = makeDetailResponse({
        venue: {
          name: "The Yoga Barn",
          suburb: "Ubud",
          full_address: "Jl. Hanoman, Ubud",
        },
      });

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(detailResponse),
        });

      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const adapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      const messages = await adapter!.fetchMessages(
        {
          search_terms: ["yoga barn"],
          fetch_delay_ms: 0,
          known_ubud_venues: ["The Yoga Barn", "Sayuri"],
        },
        undefined
      );

      // Should include the event (known venue = quickMatch)
      expect(messages).toHaveLength(1);
      expect(messages[0].external_id).toBe("200");
    });

    it("known_ubud_venues match is case-insensitive", async () => {
      const event = makeSearchEvent({
        id: 300,
        slug: "kirtan-sayuri",
        venue_name: "sayuri healing food",
      });
      const searchResponse = makeSearchResponse([event]);
      const detailResponse = makeDetailResponse({
        venue: {
          name: "Sayuri Healing Food",
          suburb: "Ubud",
          full_address: "Jl. Sukma, Ubud",
        },
      });

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(detailResponse),
        });

      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const adapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      const messages = await adapter!.fetchMessages(
        {
          search_terms: ["sayuri"],
          fetch_delay_ms: 0,
          known_ubud_venues: ["Sayuri"],
        },
        undefined
      );

      expect(messages).toHaveLength(1);
    });

    it("skips junk listings (deposits, vouchers, reservations)", async () => {
      const junkEvents = [
        makeSearchEvent({ id: 401, slug: "deposit-1", name: "Deposit Payment - Paint and Sip", venue_name: "Studio Ubud" }),
        makeSearchEvent({ id: 402, slug: "voucher-1", name: "Bali Art Workshops Studio Gift Voucher", venue_name: "Studio Ubud" }),
        makeSearchEvent({ id: 403, slug: "reservation-1", name: "Cretya Ubud Seating Reservation", venue_name: "Cretya Ubud" }),
        makeSearchEvent({ id: 404, slug: "drink-1", name: "First Drink Charge Ticket Cretya Ubud Bali", venue_name: "Cretya Ubud" }),
        makeSearchEvent({ id: 405, slug: "private-1", name: "Private Event Payments", venue_name: "Venue Ubud" }),
        makeSearchEvent({ id: 406, slug: "real-event", name: "Sunset Yoga at Yoga Barn", venue_name: "Yoga Barn, Ubud" }),
      ];
      const searchResponse = makeSearchResponse(junkEvents);
      const detailResponse = makeDetailResponse();

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResponse),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(detailResponse),
        });

      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const adapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      const messages = await adapter!.fetchMessages(
        { search_terms: ["ubud"], fetch_delay_ms: 0 },
        undefined
      );

      // Only the real event should pass through
      expect(messages).toHaveLength(1);
      expect(messages[0].external_id).toBe("406");
    });

    it("continues processing when detail fetch fails for ambiguous venue", async () => {
      const event = makeSearchEvent({ venue_name: "Unknown Place" });
      const searchResponse = makeSearchResponse([event]);

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(searchResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

      const { registerAdapter } = await import(
        "@/lib/ingestion/source-adapter"
      );
      const adapter = vi.mocked(registerAdapter).mock.calls.find(
        (call) => call[0].sourceSlug === "megatix"
      )?.[0];

      const messages = await adapter!.fetchMessages(
        { search_terms: ["ubud"], fetch_delay_ms: 0 },
        undefined
      );

      // Should skip the event, not crash
      expect(messages).toHaveLength(0);
    });
  });
});

// Import ParsedEvent type for type assertions in tests
import type { ParsedEvent } from "@/lib/ingestion/types";
