import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

const mockFetchEventDetail = vi.fn();
vi.mock("@/lib/ingestion/adapters/megatix", () => ({
  fetchEventDetail: (...args: unknown[]) => mockFetchEventDetail(...args),
}));

const mockLogActivity = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/ingestion/activity-log", () => ({
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
}));

import { extractMegatixSlug, refreshLinkedEvents } from "@/lib/ingestion/refresher";

// --- Helpers ---

interface RowOverrides {
  id?: string;
  title?: string;
  source_url?: string | null;
  external_ticket_url?: string | null;
  cover_image_url?: string | null;
  price_info?: string | null;
  organizer_name?: string | null;
  venue_address?: string | null;
  start_date?: string;
}

function makeRow(over: RowOverrides = {}) {
  return {
    id: "evt-1",
    title: "Dissolve Eros",
    source_url: "https://megatix.co.id/events/dissolve-eros",
    external_ticket_url: "https://megatix.co.id/events/dissolve-eros",
    cover_image_url: "https://media.megatix.com.au/e/19050/old.jpg",
    price_info: "Rp 200,000",
    organizer_name: "Dissolve Dances",
    venue_address: null,
    start_date: "2026-04-28",
    ...over,
  };
}

interface ScenarioOptions {
  rows: ReturnType<typeof makeRow>[];
  updateError?: { message: string } | null;
}

function setupSupabase({ rows, updateError = null }: ScenarioOptions) {
  const updateCalls: Array<{ id: string; payload: Record<string, unknown> }> = [];

  mockFrom.mockReset();
  mockFrom.mockImplementation((_table: string) => {
    let lastUpdatePayload: Record<string, unknown> | null = null;

    const selectChain: Record<string, unknown> = {};
    selectChain.eq = vi.fn().mockReturnValue(selectChain);
    selectChain.gte = vi.fn().mockReturnValue(selectChain);
    selectChain.not = vi.fn().mockReturnValue(selectChain);
    selectChain.or = vi.fn().mockReturnValue(selectChain);
    selectChain.order = vi.fn().mockReturnValue(selectChain);
    selectChain.limit = vi.fn().mockReturnValue(selectChain);
    selectChain.then = (resolve: (v: unknown) => void) =>
      Promise.resolve({ data: rows, error: null }).then(resolve);

    return {
      select: vi.fn().mockReturnValue(selectChain),
      update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
        lastUpdatePayload = payload;
        return {
          eq: vi.fn().mockImplementation((_col: string, id: string) => {
            updateCalls.push({ id, payload: lastUpdatePayload! });
            return Promise.resolve({ error: updateError });
          }),
        };
      }),
    };
  });

  return { updateCalls };
}

// --- Tests ---

describe("extractMegatixSlug", () => {
  it("extracts slug from canonical URL", () => {
    expect(extractMegatixSlug("https://megatix.co.id/events/dissolve-eros")).toBe("dissolve-eros");
  });
  it("extracts slug ignoring query string", () => {
    expect(extractMegatixSlug("https://megatix.co.id/events/dissolve-play?source=home")).toBe("dissolve-play");
  });
  it("returns null for non-megatix URL", () => {
    expect(extractMegatixSlug("https://www.eventbrite.com/e/foo-12345")).toBeNull();
  });
  it("returns null for malformed URL", () => {
    expect(extractMegatixSlug("not a url")).toBeNull();
  });
  it("returns null for null/empty input", () => {
    expect(extractMegatixSlug(null)).toBeNull();
    expect(extractMegatixSlug("")).toBeNull();
  });
});

describe("refreshLinkedEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("overwrites cover_image_url and price_info when Megatix has new values", async () => {
    const { updateCalls } = setupSupabase({
      rows: [makeRow({ cover_image_url: "https://media.megatix.com.au/e/123/old.jpg" })],
    });
    mockFetchEventDetail.mockResolvedValue({
      id: 19050,
      slug: "dissolve-eros",
      cover: "https://media.megatix.com.au/e/19050/new.jpg",
      display_price: "Rp 250,000",
      promoter_name: "Dissolve Dances",
      venue: { full_address: null, name: "Paradiso", suburb: "Ubud" },
      description: null,
      start_datetime: null,
      end_datetime: null,
      is_recurring: false,
      name: "Dissolve :: Eros",
    });

    const summary = await refreshLinkedEvents({ fetchDelayMs: 0 });

    expect(summary.updated).toBe(1);
    expect(summary.archived).toBe(0);
    const updateForEvent = updateCalls.find((c) => c.id === "evt-1");
    expect(updateForEvent?.payload.cover_image_url).toBe(
      "https://media.megatix.com.au/e/19050/new.jpg"
    );
    expect(updateForEvent?.payload.price_info).toBe("Rp 250,000");
    expect(updateForEvent?.payload.last_refreshed_at).toBeDefined();
  });

  it("does not touch organizer_name when already set, but fills venue_address when null", async () => {
    const { updateCalls } = setupSupabase({
      rows: [
        makeRow({
          cover_image_url: "https://media.megatix.com.au/e/19050/same.jpg",
          price_info: "Rp 200,000",
          organizer_name: "Manual Override",
          venue_address: null,
        }),
      ],
    });
    mockFetchEventDetail.mockResolvedValue({
      id: 19050,
      slug: "dissolve-eros",
      cover: "https://media.megatix.com.au/e/19050/same.jpg",
      display_price: "Rp 200,000",
      promoter_name: "Megatix Promoter",
      venue: { full_address: "Jl. Goutama Sel., Ubud", name: null, suburb: null },
      description: null,
      start_datetime: null,
      end_datetime: null,
      is_recurring: false,
      name: "Dissolve :: Eros",
    });

    const summary = await refreshLinkedEvents({ fetchDelayMs: 0 });

    expect(summary.updated).toBe(1);
    const upd = updateCalls.find((c) => c.id === "evt-1");
    expect(upd?.payload.organizer_name).toBeUndefined(); // protected
    expect(upd?.payload.venue_address).toBe("Jl. Goutama Sel., Ubud"); // filled null
    expect(upd?.payload.cover_image_url).toBeUndefined(); // unchanged
  });

  it("archives event when Megatix returns 404", async () => {
    const { updateCalls } = setupSupabase({ rows: [makeRow()] });
    mockFetchEventDetail.mockRejectedValue(
      new Error('Megatix detail API error for "dissolve-eros": 404 Not Found')
    );

    const summary = await refreshLinkedEvents({ fetchDelayMs: 0 });

    expect(summary.archived).toBe(1);
    expect(summary.updated).toBe(0);
    const upd = updateCalls.find((c) => c.id === "evt-1");
    expect(upd?.payload.status).toBe("archived");
    expect(mockLogActivity).toHaveBeenCalled();
  });

  it("counts unsupported sources as skipped without fetching", async () => {
    setupSupabase({
      rows: [
        makeRow({
          source_url: "https://www.eventbrite.com/e/foo",
          external_ticket_url: null,
        }),
      ],
    });

    const summary = await refreshLinkedEvents({ fetchDelayMs: 0 });

    expect(summary.skipped).toBe(1);
    expect(summary.updated).toBe(0);
    expect(mockFetchEventDetail).not.toHaveBeenCalled();
  });

  it("dry-run does not call .update()", async () => {
    const { updateCalls } = setupSupabase({ rows: [makeRow()] });
    mockFetchEventDetail.mockResolvedValue({
      id: 19050,
      slug: "dissolve-eros",
      cover: "https://media.megatix.com.au/e/19050/new.jpg",
      display_price: null,
      promoter_name: null,
      venue: null,
      description: null,
      start_datetime: null,
      end_datetime: null,
      is_recurring: false,
      name: "Dissolve :: Eros",
    });

    const summary = await refreshLinkedEvents({ dryRun: true, fetchDelayMs: 0 });

    expect(summary.updated).toBe(1); // counted as would_update
    expect(summary.results[0].status).toBe("would_update");
    expect(updateCalls).toHaveLength(0);
  });

  it("returns no_changes when nothing differs", async () => {
    const { updateCalls } = setupSupabase({
      rows: [
        makeRow({
          cover_image_url: "https://media.megatix.com.au/e/19050/same.jpg",
          price_info: "Rp 200,000",
          organizer_name: "Dissolve Dances",
          venue_address: "Jl. Goutama Sel., Ubud",
        }),
      ],
    });
    mockFetchEventDetail.mockResolvedValue({
      id: 19050,
      slug: "dissolve-eros",
      cover: "https://media.megatix.com.au/e/19050/same.jpg",
      display_price: "Rp 200,000",
      promoter_name: "Dissolve Dances",
      venue: { full_address: "Jl. Goutama Sel., Ubud", name: null, suburb: null },
      description: null,
      start_datetime: null,
      end_datetime: null,
      is_recurring: false,
      name: "Dissolve :: Eros",
    });

    const summary = await refreshLinkedEvents({ fetchDelayMs: 0 });

    expect(summary.noChanges).toBe(1);
    // Only last_refreshed_at update
    expect(updateCalls).toHaveLength(1);
    expect(Object.keys(updateCalls[0].payload)).toEqual(["last_refreshed_at"]);
  });

  it("respects budgetMs and stops processing", async () => {
    const rows = [makeRow({ id: "evt-a" }), makeRow({ id: "evt-b" }), makeRow({ id: "evt-c" })];
    setupSupabase({ rows });
    let calls = 0;
    mockFetchEventDetail.mockImplementation(async () => {
      calls++;
      // simulate a slow fetch that exceeds budget after 1
      await new Promise((r) => setTimeout(r, 60));
      return {
        cover: null,
        display_price: null,
        promoter_name: null,
        venue: null,
        description: null,
      };
    });

    const summary = await refreshLinkedEvents({ budgetMs: 80, fetchDelayMs: 0 });

    expect(summary.processed).toBeLessThan(3);
    expect(calls).toBe(summary.processed);
  });
});
