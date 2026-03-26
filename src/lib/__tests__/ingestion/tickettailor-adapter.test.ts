import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock source-adapter to prevent side-effect registration
vi.mock("@/lib/ingestion/source-adapter", () => ({
  registerAdapter: vi.fn(),
}));

import { fetchMessages } from "@/lib/ingestion/adapters/tickettailor";

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "ev_12345",
    name: "Morning Yoga",
    description: "<p>A beautiful <b>morning</b> yoga session</p>",
    url: "https://www.tickettailor.com/events/loveacademy/12345",
    online_event: "no",
    timezone: "Asia/Makassar",
    currency: "IDR",
    event_series_id: null,
    start: { date: "2026-04-01", time: "07:00" },
    end: { date: "2026-04-01", time: "09:00" },
    venue: { name: "Yoga Barn", postal_code: "80571" },
    images: {
      header: "https://cdn.tickettailor.com/header.jpg",
      thumbnail: "https://cdn.tickettailor.com/thumb.jpg",
    },
    ticket_types: [
      { status: "on_sale", type: "paid", price: 15000000 },
    ],
    ...overrides,
  };
}

function makeResponse(
  events: unknown[],
  next: string | null = null
) {
  return {
    data: events,
    links: { next },
  };
}

const baseConfig = {
  _preParsed: true,
  organizers: [
    { slug: "loveacademy", api_key: "sk_test_123", label: "Love Academy" },
  ],
};

describe("TicketTailor adapter", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  const consoleSpy = { error: vi.fn(), warn: vi.fn() };
  const originalConsole = { error: console.error, warn: console.warn };

  beforeEach(() => {
    fetchSpy = vi.fn();
    global.fetch = fetchSpy;
    console.error = consoleSpy.error;
    console.warn = consoleSpy.warn;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });

  it("returns mapped RawMessages for a single organizer", async () => {
    const ev1 = makeEvent();
    const ev2 = makeEvent({ id: "ev_99999", name: "Sound Healing" });
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeResponse([ev1, ev2])),
    });

    const result = await fetchMessages(baseConfig);
    expect(result).toHaveLength(2);

    expect(result[0].external_id).toBe("tt-ev_12345-loveacademy");
    expect(result[0].content_text).toContain("Morning Yoga");

    const parsed = (result[0].raw_data as unknown[])[0] as Record<string, unknown>;
    expect(parsed.title).toBe("Morning Yoga");
    expect(parsed.description).toBe("A beautiful morning yoga session");
    expect(parsed.venue_name).toBe("Yoga Barn");
    expect(parsed.start_date).toBe("2026-04-01");
    expect(parsed.start_time).toBe("07:00");
    expect(parsed.end_time).toBe("09:00");
    expect(parsed.source_event_id).toBe("ev_12345");
    expect(parsed.organizer_name).toBe("Love Academy");
    expect(parsed.cover_image_url).toBe("https://cdn.tickettailor.com/header.jpg");
    expect(parsed.external_ticket_url).toBe(
      "https://www.tickettailor.com/events/loveacademy/12345"
    );

    expect(result[1].external_id).toBe("tt-ev_99999-loveacademy");
  });

  it("handles multiple organizers", async () => {
    const config = {
      _preParsed: true,
      organizers: [
        { slug: "org1", api_key: "sk_1", label: "Org One" },
        { slug: "org2", api_key: "sk_2", label: "Org Two" },
      ],
    };

    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeResponse([makeEvent({ id: "ev_a" })])),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeResponse([makeEvent({ id: "ev_b" })])),
      });

    const result = await fetchMessages(config);
    expect(result).toHaveLength(2);
    expect(result[0].external_id).toBe("tt-ev_a-org1");
    expect(result[1].external_id).toBe("tt-ev_b-org2");
  });

  it("handles cursor pagination", async () => {
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            makeResponse(
              [makeEvent({ id: "ev_page1" })],
              "https://api.tickettailor.com/v1/events?starting_after=ev_page1"
            )
          ),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(makeResponse([makeEvent({ id: "ev_page2" })])),
      });

    const result = await fetchMessages(baseConfig);
    expect(result).toHaveLength(2);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1][0]).toBe(
      "https://api.tickettailor.com/v1/events?starting_after=ev_page1"
    );
  });

  it("filters out online events", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          makeResponse([
            makeEvent({ id: "ev_online", online_event: "yes" }),
            makeEvent({ id: "ev_inperson", online_event: "no" }),
          ])
        ),
    });

    const result = await fetchMessages(baseConfig);
    expect(result).toHaveLength(1);
    expect(result[0].external_id).toBe("tt-ev_inperson-loveacademy");
  });

  it("continues on single-organizer failure", async () => {
    const config = {
      _preParsed: true,
      organizers: [
        { slug: "failing", api_key: "sk_bad", label: "Failing Org" },
        { slug: "working", api_key: "sk_good", label: "Working Org" },
      ],
    };

    fetchSpy
      .mockResolvedValueOnce({ ok: false, status: 401, statusText: "Unauthorized" })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(makeResponse([makeEvent({ id: "ev_ok" })])),
      });

    const result = await fetchMessages(config);
    expect(result).toHaveLength(1);
    expect(result[0].external_id).toBe("tt-ev_ok-working");
    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
  });

  it("throws on empty organizers config", async () => {
    await expect(
      fetchMessages({ _preParsed: true, organizers: [] })
    ).rejects.toThrow("non-empty 'organizers' array");
  });

  it("throws on missing organizers config", async () => {
    await expect(fetchMessages({ _preParsed: true })).rejects.toThrow(
      "non-empty 'organizers' array"
    );
  });

  describe("pricing", () => {
    function fetchWithTickets(
      ticketTypes: unknown[],
      currency = "IDR"
    ) {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            makeResponse([
              makeEvent({ ticket_types: ticketTypes, currency }),
            ])
          ),
      });
      return fetchMessages(baseConfig);
    }

    it("shows Free for free events", async () => {
      const result = await fetchWithTickets([
        { status: "on_sale", type: "free", price: 0 },
      ]);
      const parsed = (result[0].raw_data as unknown[])[0] as Record<string, unknown>;
      expect(parsed.price_info).toBe("Free");
    });

    it("shows single price", async () => {
      const result = await fetchWithTickets([
        { status: "on_sale", type: "paid", price: 15000000 },
      ]);
      const parsed = (result[0].raw_data as unknown[])[0] as Record<string, unknown>;
      expect(parsed.price_info).toBe("IDR 150,000");
    });

    it("shows price range", async () => {
      const result = await fetchWithTickets([
        { status: "on_sale", type: "paid", price: 15000000 },
        { status: "on_sale", type: "paid", price: 50000000 },
      ]);
      const parsed = (result[0].raw_data as unknown[])[0] as Record<string, unknown>;
      expect(parsed.price_info).toBe("IDR 150,000 - 500,000");
    });

    it("uses USD symbol", async () => {
      const result = await fetchWithTickets(
        [{ status: "on_sale", type: "paid", price: 2500 }],
        "USD"
      );
      const parsed = (result[0].raw_data as unknown[])[0] as Record<string, unknown>;
      expect(parsed.price_info).toBe("$25");
    });

    it("ignores off-sale tickets", async () => {
      const result = await fetchWithTickets([
        { status: "off_sale", type: "paid", price: 5000000 },
      ]);
      const parsed = (result[0].raw_data as unknown[])[0] as Record<string, unknown>;
      expect(parsed.price_info).toBe("Free");
    });

    it("returns Free when no ticket types exist", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            makeResponse([makeEvent({ ticket_types: undefined })])
          ),
      });
      const result = await fetchMessages(baseConfig);
      const parsed = (result[0].raw_data as unknown[])[0] as Record<string, unknown>;
      expect(parsed.price_info).toBe("Free");
    });
  });

  it("handles missing optional fields", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          makeResponse([
            makeEvent({
              venue: undefined,
              images: undefined,
              end: undefined,
              event_series_id: null,
            }),
          ])
        ),
    });

    const result = await fetchMessages(baseConfig);
    const parsed = (result[0].raw_data as unknown[])[0] as Record<string, unknown>;
    expect(parsed.venue_name).toBeNull();
    expect(parsed.cover_image_url).toBeNull();
    expect(parsed.end_date).toBeNull();
    expect(parsed.end_time).toBeNull();
    expect(parsed.is_recurring).toBe(false);
  });

  it("falls back to thumbnail when header image is missing", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          makeResponse([
            makeEvent({ images: { thumbnail: "https://cdn.tt.com/thumb.jpg" } }),
          ])
        ),
    });

    const result = await fetchMessages(baseConfig);
    const parsed = (result[0].raw_data as unknown[])[0] as Record<string, unknown>;
    expect(parsed.cover_image_url).toBe("https://cdn.tt.com/thumb.jpg");
  });

  it("warns when timezone is not Asia/Makassar", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          makeResponse([makeEvent({ timezone: "America/New_York" })])
        ),
    });

    await fetchMessages(baseConfig);
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      expect.stringContaining("America/New_York")
    );
  });

  it("sets is_recurring when event_series_id is present", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          makeResponse([makeEvent({ event_series_id: "es_123" })])
        ),
    });

    const result = await fetchMessages(baseConfig);
    const parsed = (result[0].raw_data as unknown[])[0] as Record<string, unknown>;
    expect(parsed.is_recurring).toBe(true);
  });

  it("strips HTML from description", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          makeResponse([
            makeEvent({
              description:
                '<p>Join us for <strong>yoga</strong> &amp; meditation!</p><br/><p>Bring a mat.</p>',
            }),
          ])
        ),
    });

    const result = await fetchMessages(baseConfig);
    const parsed = (result[0].raw_data as unknown[])[0] as Record<string, unknown>;
    expect(parsed.description).toBe("Join us for yoga & meditation! Bring a mat.");
  });

  it("sends Basic auth with correct encoding", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeResponse([])),
    });

    await fetchMessages(baseConfig);
    const expectedAuth = `Basic ${Buffer.from("sk_test_123:").toString("base64")}`;
    expect(fetchSpy.mock.calls[0][1].headers.Authorization).toBe(expectedAuth);
  });
});
