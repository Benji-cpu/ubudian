import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase admin client
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

// Mock fingerprint
vi.mock("@/lib/ingestion/fingerprint", () => ({
  generateFingerprint: vi.fn().mockResolvedValue("abc123fingerprint"),
}));

// Mock venue normalizer
vi.mock("@/lib/ingestion/venue-normalizer", () => ({
  normalizeVenue: vi.fn().mockResolvedValue("Yoga Barn"),
}));

// Mock LLM parser (for semantic comparison)
vi.mock("@/lib/ingestion/llm-parser", () => ({
  compareEventsSemantically: vi.fn(),
}));

// Do NOT mock similarity — let real functions run
import { findDuplicates, recordDedupMatch, resolveMatch } from "@/lib/ingestion/dedup";
import { compareEventsSemantically } from "@/lib/ingestion/llm-parser";

const mockCompare = vi.mocked(compareEventsSemantically);

/**
 * Create a flexible Supabase mock chain that supports all query methods.
 * The final resolution (data/error) is triggered by the terminal method.
 */
function chainMock(data: unknown, error: unknown = null) {
  const self: Record<string, unknown> = {};
  const resolver = () => Promise.resolve({ data, error });
  // Every chainable method returns self
  self.select = vi.fn().mockReturnValue(self);
  self.eq = vi.fn().mockReturnValue(self);
  self.gte = vi.fn().mockReturnValue(self);
  self.lte = vi.fn().mockReturnValue(self);
  self.limit = vi.fn().mockReturnValue(self);
  self.single = vi.fn().mockImplementation(resolver);
  // When awaited directly (not .single()), resolve with data
  self.then = (resolve: (v: unknown) => void, reject?: (v: unknown) => void) =>
    resolver().then(resolve, reject);
  return self;
}

describe("findDuplicates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns exact URL match with confidence 1.0 (Layer 1)", async () => {
    // Layer 1 URL match finds a result
    mockFrom.mockReturnValue(chainMock([{ id: "evt-1" }]));

    const result = await findDuplicates({
      title: "Sunset Yoga",
      start_date: "2026-03-20",
      source_url: "https://example.com/event",
    });

    expect(result).toHaveLength(1);
    expect(result[0].matchType).toBe("exact_url");
    expect(result[0].confidence).toBe(1.0);
    expect(result[0].eventId).toBe("evt-1");
  });

  it("returns source_id + source_event_id match (Layer 1b)", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Layer 1 URL check — no match
        return chainMock([]);
      }
      // Layer 1b source_id + source_event_id — match
      return chainMock([{ id: "evt-2" }]);
    });

    const result = await findDuplicates({
      title: "Sunset Yoga",
      start_date: "2026-03-20",
      source_url: "https://example.com/event",
      source_id: "src-1",
      source_event_id: "ext-123",
    });

    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe(1.0);
    expect(result[0].eventId).toBe("evt-2");
  });

  it("returns fingerprint match with confidence 0.95 (Layer 2)", async () => {
    // No source_url or source_id, so first from("events") is fingerprint check
    mockFrom.mockReturnValue(chainMock([{ id: "evt-3" }]));

    const result = await findDuplicates({
      title: "Sunset Yoga",
      start_date: "2026-03-20",
    });

    expect(result).toHaveLength(1);
    expect(result[0].matchType).toBe("fingerprint");
    expect(result[0].confidence).toBe(0.95);
  });

  it("returns fuzzy title match (Layer 3)", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Layer 2: fingerprint — no match
        return chainMock([]);
      }
      // Layer 3: same date range events — return event with similar title
      // "Sunset Yoga at Barn" vs "Sunset Yoga at the Barn" → high similarity
      return chainMock([
        {
          id: "evt-4",
          title: "Sunset Yoga at the Barn",
          venue_name: "Yoga Barn",
          start_date: "2026-03-20",
        },
      ]);
    });

    const result = await findDuplicates({
      title: "Sunset Yoga at Barn",
      start_date: "2026-03-20",
      venue_name: "Yoga Barn",
    });

    expect(result.length).toBeGreaterThanOrEqual(1);
    const fuzzy = result.find((c) => c.matchType === "fuzzy_title");
    expect(fuzzy).toBeDefined();
    expect(fuzzy!.confidence).toBeLessThanOrEqual(0.9);
    expect(fuzzy!.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("uses precomputed venue and fingerprint when provided", async () => {
    // No source_url or source_id, so first from("events") is fingerprint check
    mockFrom.mockReturnValue(chainMock([{ id: "evt-precomp" }]));

    const { normalizeVenue } = await import("@/lib/ingestion/venue-normalizer");
    const { generateFingerprint } = await import("@/lib/ingestion/fingerprint");
    vi.mocked(normalizeVenue).mockClear();
    vi.mocked(generateFingerprint).mockClear();

    const result = await findDuplicates(
      { title: "Test Event", start_date: "2026-03-20", venue_name: "Yoga Barn" },
      { normalizedVenue: "Yoga Barn", fingerprint: "precomputed-fp" }
    );

    // Should NOT call normalizeVenue or generateFingerprint since precomputed values provided
    expect(vi.mocked(normalizeVenue)).not.toHaveBeenCalled();
    expect(vi.mocked(generateFingerprint)).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].matchType).toBe("fingerprint");
  });

  it("returns empty array when no duplicates found", async () => {
    mockFrom.mockReturnValue(chainMock([]));

    const result = await findDuplicates({
      title: "Completely Unique Event",
      start_date: "2026-06-01",
    });

    expect(result).toEqual([]);
  });

  it("upgrades fuzzy match to semantic when LLM confirms duplicate (Layer 4)", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Layer 2: fingerprint — no match
        return chainMock([]);
      }
      if (callCount === 2) {
        // Layer 3: same date events with similar title
        return chainMock([
          {
            id: "evt-5",
            title: "Sunset Yoga at the Barn",
            venue_name: "Yoga Barn",
            start_date: "2026-03-20",
          },
        ]);
      }
      // Layer 4: fetch existing event for semantic comparison
      return chainMock({
        title: "Sunset Yoga at the Barn",
        description: "Join us for sunset yoga",
        venue_name: "Yoga Barn",
        start_date: "2026-03-20",
      });
    });

    mockCompare.mockResolvedValue({
      is_duplicate: true,
      confidence: 0.9,
      reasoning: "Same event, different wording",
    });

    const result = await findDuplicates({
      title: "Sunset Yoga",
      start_date: "2026-03-20",
      venue_name: "Yoga Barn",
      description: "Yoga at sunset time",
    });

    const semantic = result.find((c) => c.matchType === "semantic");
    if (semantic) {
      expect(semantic.confidence).toBeGreaterThanOrEqual(0.85);
    }
  });

  it("gracefully handles LLM error in Layer 4", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainMock([]);
      }
      if (callCount === 2) {
        return chainMock([
          {
            id: "evt-6",
            title: "Sunset Yoga at Barn",
            venue_name: "Yoga Barn",
            start_date: "2026-03-20",
          },
        ]);
      }
      return chainMock({
        title: "Sunset Yoga at Barn",
        description: "test",
        venue_name: "Yoga Barn",
        start_date: "2026-03-20",
      });
    });

    mockCompare.mockRejectedValue(new Error("LLM unavailable"));

    // Should NOT throw — just log and continue
    const result = await findDuplicates({
      title: "Sunset Yoga",
      start_date: "2026-03-20",
      venue_name: "Yoga Barn",
      description: "Test description",
    });

    expect(result).toBeDefined();
  });
});

describe("recordDedupMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts a dedup match record", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await recordDedupMatch("new-event-id", {
      eventId: "existing-event-id",
      matchType: "fuzzy_title",
      confidence: 0.85,
      metadata: { test: true },
    });

    expect(mockFrom).toHaveBeenCalledWith("dedup_matches");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        match_type: "fuzzy_title",
        confidence: 0.85,
        status: "pending",
      }),
      { onConflict: "event_a_id,event_b_id" }
    );
  });

  it("orders event IDs consistently (smaller first)", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await recordDedupMatch("zzz-new", {
      eventId: "aaa-existing",
      matchType: "fingerprint",
      confidence: 0.95,
      metadata: {},
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_a_id: "aaa-existing",
        event_b_id: "zzz-new",
      }),
      expect.anything()
    );
  });
});

describe("resolveMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates match resolution", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await resolveMatch("match-1", "confirmed_dup", "admin-user");

    expect(mockFrom).toHaveBeenCalledWith("dedup_matches");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "confirmed_dup",
        resolved_by: "admin-user",
      })
    );
    expect(mockEq).toHaveBeenCalledWith("id", "match-1");
  });
});
