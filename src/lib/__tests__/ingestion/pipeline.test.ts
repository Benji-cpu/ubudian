import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase admin client
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

// Mock queryWithRetry — pass through to the query function
vi.mock("@/lib/supabase/retry", () => ({
  queryWithRetry: async <T>(fn: () => PromiseLike<T>) => fn(),
}));

// Mock LLM parser
const mockClassifyAndParse = vi.fn();
const mockParseFromText = vi.fn();
const mockParseFromImage = vi.fn();

vi.mock("@/lib/ingestion/llm-parser", () => ({
  classifyAndParseMessage: (...args: unknown[]) => mockClassifyAndParse(...args),
  parseEventFromText: (...args: unknown[]) => mockParseFromText(...args),
  parseEventFromImage: (...args: unknown[]) => mockParseFromImage(...args),
  LLMApiError: class LLMApiError extends Error {
    public readonly retryable: boolean;
    constructor(message: string, retryable = true) {
      super(message);
      this.name = "LLMApiError";
      this.retryable = retryable;
    }
  },
}));

// Mock dedup
const mockFindDuplicates = vi.fn();
const mockRecordDedupMatch = vi.fn();

vi.mock("@/lib/ingestion/dedup", () => ({
  findDuplicates: (...args: unknown[]) => mockFindDuplicates(...args),
  recordDedupMatch: (...args: unknown[]) => mockRecordDedupMatch(...args),
}));

// Mock venue normalizer
vi.mock("@/lib/ingestion/venue-normalizer", () => ({
  normalizeVenue: vi.fn().mockResolvedValue("Yoga Barn"),
}));

// Mock fingerprint
vi.mock("@/lib/ingestion/fingerprint", () => ({
  generateFingerprint: vi.fn().mockResolvedValue("test-fingerprint-hash"),
}));

// Mock date validator
const defaultDateValidator = (dateStr: string | null | undefined) => {
  if (!dateStr) return { valid: false, normalized: null, error: "empty" };
  return { valid: true, normalized: dateStr };
};
const mockValidateDate = vi.fn().mockImplementation(defaultDateValidator);

vi.mock("@/lib/ingestion/date-validator", () => ({
  validateAndNormalizeDate: (...args: unknown[]) => mockValidateDate(...args),
}));

// Mock source adapter
const mockGetAdapter = vi.fn();
vi.mock("@/lib/ingestion/source-adapter", () => ({
  getAdapter: (...args: unknown[]) => mockGetAdapter(...args),
}));

// Mock URL enricher
const mockEnrichFromSourceUrl = vi.fn().mockResolvedValue({ enrichedFields: [] });
vi.mock("@/lib/ingestion/url-enricher", () => ({
  enrichFromSourceUrl: (...args: unknown[]) => mockEnrichFromSourceUrl(...args),
  applyEnrichment: (parsed: Record<string, unknown>, enrichment: { enrichedFields: string[] } & Record<string, unknown>) => {
    for (const k of enrichment.enrichedFields) {
      if (typeof enrichment[k] === "string") parsed[k] = enrichment[k];
    }
  },
}));

// Mock AI moderation gate. Default: pass. Tests can override per-case.
const mockModerateEvent = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/lib/events/moderation", () => ({
  moderateEvent: (...args: unknown[]) => mockModerateEvent(...args),
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  slugify: (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
}));

// Mock constants
vi.mock("@/lib/constants", () => ({
  EVENT_CATEGORIES: [
    "Dance & Movement",
    "Tantra & Intimacy",
    "Ceremony & Sound",
    "Yoga & Meditation",
    "Healing & Bodywork",
    "Circle & Community",
    "Music & Performance",
    "Art & Culture",
    "Retreat & Training",
    "Other",
  ],
}));

import { runIngestion, processRawMessage, createEventFromParsed } from "@/lib/ingestion/pipeline";
import type { RawMessage, ParsedEvent } from "@/lib/ingestion/types";

// ============================================
// Supabase mock helpers
// ============================================

/**
 * Create a flexible chainable Supabase query mock.
 * Supports any sequence of .select().eq().eq().gte().lte().limit().single()
 * and resolves to {data, error} when awaited or when .single() is called.
 */
function chain(data: unknown, error: unknown = null) {
  const resolver = () => Promise.resolve({ data, error });
  const self: Record<string, unknown> = {};
  self.select = vi.fn().mockReturnValue(self);
  self.eq = vi.fn().mockReturnValue(self);
  self.gte = vi.fn().mockReturnValue(self);
  self.lte = vi.fn().mockReturnValue(self);
  self.limit = vi.fn().mockReturnValue(self);
  self.single = vi.fn().mockImplementation(resolver);
  self.then = (res: (v: unknown) => void, rej?: (v: unknown) => void) =>
    resolver().then(res, rej);
  return self;
}

/** Default mock: returns empty/null for any table query */
function setupDefaultMocks() {
  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });

  mockFrom.mockImplementation((table: string) => {
    switch (table) {
      case "event_sources":
        return {
          select: () =>
            chain({
              id: "src-1",
              slug: "whatsapp",
              config: {},
              last_fetched_at: null,
              events_ingested_count: 0,
            }),
          update: mockUpdate,
        };
      case "ingestion_runs":
        return {
          insert: () => chain({ id: "run-1" }),
          update: mockUpdate,
        };
      case "raw_ingestion_messages":
        return {
          // select chain for dup-check: .select().eq().eq().limit() → []
          select: () => chain([]),
          // insert chain: .insert().select().single() → { id: "msg-1" }
          insert: () => chain({ id: "msg-1" }),
          update: mockUpdate,
        };
      case "events":
        return {
          // select chain for slug-check: .select().eq().single() → null
          select: () => chain(null),
          // insert chain: .insert().select().single() → { id: "evt-1" }
          insert: () => chain({ id: "evt-1" }),
          update: mockUpdate,
        };
      case "dedup_matches":
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      default:
        return { select: () => chain(null), insert: () => chain(null), update: mockUpdate };
    }
  });

  return { mockUpdate };
}

// ============================================
// runIngestion tests
// ============================================

describe("runIngestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateDate.mockImplementation(defaultDateValidator);
    mockEnrichFromSourceUrl.mockResolvedValue({ enrichedFields: [] });
    mockModerateEvent.mockResolvedValue({ ok: true });
    setupDefaultMocks();
  });

  it("returns failed when source not found", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "event_sources") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: null,
                  error: { message: "Not found" },
                }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await runIngestion("nonexistent-source");
    expect(result.status).toBe("failed");
    expect(result.errors[0].error).toContain("Source not found");
  });

  it("returns failed when no adapter registered for slug", async () => {
    mockGetAdapter.mockReturnValue(undefined);

    const result = await runIngestion("src-1");
    expect(result.status).toBe("failed");
    expect(result.errors[0].error).toContain("No adapter registered");
  });

  it("completes successfully with events", async () => {
    const mockAdapter = {
      sourceSlug: "whatsapp",
      fetchMessages: vi.fn().mockResolvedValue([
        {
          external_id: "ext-1",
          content_text: "Join us for Sunset Yoga at Yoga Barn March 20th at 5pm!",
        },
      ]),
    };
    mockGetAdapter.mockReturnValue(mockAdapter);

    mockClassifyAndParse.mockResolvedValue({
      is_event: true,
      confidence: 0.95,
      events: [{
        title: "Sunset Yoga",
        description: "Yoga at sunset",
        category: "Yoga & Meditation",
        start_date: "2026-03-20",
        venue_name: "Yoga Barn",
      }],
    });

    mockFindDuplicates.mockResolvedValue([]);
    mockRecordDedupMatch.mockResolvedValue(undefined);

    const result = await runIngestion("src-1");
    expect(result.status).toBe("completed");
    expect(result.messagesFetched).toBe(1);
    expect(result.eventsCreated).toBe(1);
  });

  it("handles adapter fetch error", async () => {
    const mockAdapter = {
      sourceSlug: "whatsapp",
      fetchMessages: vi.fn().mockRejectedValue(new Error("Network timeout")),
    };
    mockGetAdapter.mockReturnValue(mockAdapter);

    const result = await runIngestion("src-1");
    expect(result.status).toBe("failed");
    expect(result.errors.some((e) => e.error.includes("Network timeout"))).toBe(true);
  });
});

// ============================================
// processRawMessage tests
// ============================================

describe("processRawMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateDate.mockImplementation(defaultDateValidator);
    mockEnrichFromSourceUrl.mockResolvedValue({ enrichedFields: [] });
    mockModerateEvent.mockResolvedValue({ ok: true });
    setupDefaultMocks();
  });

  it("classifies and creates an event from text", async () => {
    mockClassifyAndParse.mockResolvedValue({
      is_event: true,
      confidence: 0.9,
      events: [{
        title: "Sunset Yoga",
        description: "Yoga session",
        category: "Yoga & Meditation",
        start_date: "2026-03-20",
      }],
    });
    mockFindDuplicates.mockResolvedValue([]);

    const rawMsg: RawMessage = {
      external_id: "ext-1",
      content_text: "Sunset Yoga March 20",
    };

    const result = await processRawMessage("msg-1", rawMsg, "src-1", {});
    expect(result.status).toBe("created");
    expect(result.eventId).toBeDefined();
  });

  it("returns not_event when classification says no", async () => {
    mockClassifyAndParse.mockResolvedValue({
      is_event: false,
      confidence: 0.1,
      events: [],
    });

    const rawMsg: RawMessage = {
      content_text: "Just chatting about weather",
    };

    const result = await processRawMessage("msg-1", rawMsg, "src-1", {});
    expect(result.status).toBe("not_event");
  });

  it("parses image messages and sets cover_image_url from analyzed image", async () => {
    const mockInsert = vi.fn().mockReturnValue(chain({ id: "evt-1" }));
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: () => chain(null),
          insert: mockInsert,
        };
      }
      if (table === "raw_ingestion_messages") {
        return {
          select: () => chain([]),
          insert: () => chain({ id: "msg-1" }),
          update: mockUpdate,
        };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    mockParseFromImage.mockResolvedValue([
      {
        title: "Flyer Event",
        description: "From image",
        category: "Art & Culture",
        start_date: "2026-04-01",
      },
    ]);
    mockFindDuplicates.mockResolvedValue([]);

    const rawMsg: RawMessage = {
      content_text: "Check this out",
      image_urls: ["https://storage.supabase.co/images/flyer.jpg"],
    };

    const result = await processRawMessage("msg-1", rawMsg, "src-1", {});
    expect(result.status).toBe("created");
    expect(mockParseFromImage).toHaveBeenCalled();
    // The analyzed image should be set as cover_image_url
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ cover_image_url: "https://storage.supabase.co/images/flyer.jpg" })
    );
  });

  it("does not overwrite LLM-provided cover_image_url", async () => {
    const mockInsert = vi.fn().mockReturnValue(chain({ id: "evt-1" }));
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: () => chain(null),
          insert: mockInsert,
        };
      }
      if (table === "raw_ingestion_messages") {
        return {
          select: () => chain([]),
          insert: () => chain({ id: "msg-1" }),
          update: mockUpdate,
        };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    mockParseFromImage.mockResolvedValue([
      {
        title: "Flyer Event",
        description: "From image",
        category: "Art & Culture",
        start_date: "2026-04-01",
        cover_image_url: "https://llm-provided-url.com/image.jpg",
      },
    ]);
    mockFindDuplicates.mockResolvedValue([]);

    const rawMsg: RawMessage = {
      content_text: "Check this out",
      image_urls: ["https://storage.supabase.co/images/flyer.jpg"],
    };

    const result = await processRawMessage("msg-1", rawMsg, "src-1", {});
    expect(result.status).toBe("created");
    // LLM-provided URL should NOT be overwritten
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ cover_image_url: "https://llm-provided-url.com/image.jpg" })
    );
  });

  it("sets cover_image_url from first image on text fallback path", async () => {
    const mockInsert = vi.fn().mockReturnValue(chain({ id: "evt-1" }));
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: () => chain(null),
          insert: mockInsert,
        };
      }
      if (table === "raw_ingestion_messages") {
        return {
          select: () => chain([]),
          insert: () => chain({ id: "msg-1" }),
          update: mockUpdate,
        };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    // Image parse returns nothing — falls back to text
    mockParseFromImage.mockResolvedValue([]);
    mockClassifyAndParse.mockResolvedValue({
      is_event: true,
      confidence: 0.9,
      events: [{
        title: "Text Fallback Event",
        description: "Parsed from text",
        category: "Circle & Community",
        start_date: "2026-04-15",
      }],
    });
    mockFindDuplicates.mockResolvedValue([]);

    const rawMsg: RawMessage = {
      content_text: "Community cleanup this Saturday at 9am, Ubud Palace",
      image_urls: [
        "https://storage.supabase.co/images/photo1.jpg",
        "https://storage.supabase.co/images/photo2.jpg",
      ],
    };

    const result = await processRawMessage("msg-1", rawMsg, "src-1", {});
    expect(result.status).toBe("created");
    // Should use the first image as cover since text fallback was used
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ cover_image_url: "https://storage.supabase.co/images/photo1.jpg" })
    );
  });

  it("uses the correct image URL when multiple images and second one parses", async () => {
    const mockInsert = vi.fn().mockReturnValue(chain({ id: "evt-1" }));
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: () => chain(null),
          insert: mockInsert,
        };
      }
      if (table === "raw_ingestion_messages") {
        return {
          select: () => chain([]),
          insert: () => chain({ id: "msg-1" }),
          update: mockUpdate,
        };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    // First image yields nothing, second image yields an event
    mockParseFromImage
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          title: "Second Image Event",
          description: "From second image",
          category: "Music & Performance",
          start_date: "2026-05-01",
        },
      ]);
    mockFindDuplicates.mockResolvedValue([]);

    const rawMsg: RawMessage = {
      content_text: "",
      image_urls: [
        "https://storage.supabase.co/images/selfie.jpg",
        "https://storage.supabase.co/images/event-flyer.jpg",
      ],
    };

    const result = await processRawMessage("msg-1", rawMsg, "src-1", {});
    expect(result.status).toBe("created");
    // Should use the second image (the one that actually parsed)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ cover_image_url: "https://storage.supabase.co/images/event-flyer.jpg" })
    );
  });

  it("skips classification with _preParsed flag", async () => {
    mockFindDuplicates.mockResolvedValue([]);

    const rawMsg: RawMessage = {
      content_text: "Pre-parsed event",
      raw_data: [
        {
          title: "Pre-parsed Event",
          description: "Already structured",
          category: "Other",
          start_date: "2026-04-01",
        },
      ],
    };

    const result = await processRawMessage("msg-1", rawMsg, "src-1", { _preParsed: true });
    expect(result.status).toBe("created");
    expect(mockClassifyAndParse).not.toHaveBeenCalled();
  });

  it("uses parseEventFromText directly with _skipClassification", async () => {
    mockParseFromText.mockResolvedValue([
      {
        title: "Direct Parse",
        description: "Skipped classification",
        category: "Other",
        start_date: "2026-04-01",
      },
    ]);
    mockFindDuplicates.mockResolvedValue([]);

    const rawMsg: RawMessage = {
      content_text: "Some structured source text with enough content here",
    };

    const result = await processRawMessage("msg-1", rawMsg, "src-1", { _skipClassification: true });
    expect(result.status).toBe("created");
    expect(mockParseFromText).toHaveBeenCalled();
    expect(mockClassifyAndParse).not.toHaveBeenCalled();
  });

  it("returns failed on LLM error", async () => {
    const { LLMApiError } = await import("@/lib/ingestion/llm-parser");
    mockClassifyAndParse.mockRejectedValue(new LLMApiError("Gemini unavailable"));

    const rawMsg: RawMessage = { content_text: "Test message" };
    const result = await processRawMessage("msg-1", rawMsg, "src-1", {});
    expect(result.status).toBe("failed");
    expect(result.error).toContain("Gemini unavailable");
  });

  it("returns not_event for image-only message with no events", async () => {
    // Image parsing returns no events — should be not_event, not failed
    mockParseFromImage.mockResolvedValue([]);

    const rawMsg: RawMessage = {
      content_text: "",
      image_urls: ["https://example.com/food-photo.jpg"],
    };

    const result = await processRawMessage("msg-1", rawMsg, "src-1", {});
    expect(result.status).toBe("not_event");
    expect(result.error).toBeUndefined();
  });

  it("returns not_event when confidence is below 0.5", async () => {
    mockClassifyAndParse.mockResolvedValue({
      is_event: false,
      confidence: 0.3,
      events: [],
    });

    const rawMsg: RawMessage = { content_text: "Maybe an event maybe not" };
    const result = await processRawMessage("msg-1", rawMsg, "src-1", {});
    expect(result.status).toBe("not_event");
  });
});

// ============================================
// createEventFromParsed tests
// ============================================

describe("createEventFromParsed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateDate.mockImplementation(defaultDateValidator);
    mockEnrichFromSourceUrl.mockResolvedValue({ enrichedFields: [] });
    mockModerateEvent.mockResolvedValue({ ok: true });
    setupDefaultMocks();
    mockFindDuplicates.mockResolvedValue([]);
    mockRecordDedupMatch.mockResolvedValue(undefined);
  });

  describe("URL enrichment", () => {
    it("calls the enricher when source_url is present and a target field is missing", async () => {
      const parsed: ParsedEvent = {
        title: "Sunset Yoga",
        description: "x",
        category: "Yoga & Meditation",
        start_date: "2026-03-20",
        venue_name: "Yoga Barn",
        source_url: "https://example.com/event",
        // cover_image_url is missing → enrichment should fire
      };
      await createEventFromParsed("msg-1", parsed, "src-1", true);
      expect(mockEnrichFromSourceUrl).toHaveBeenCalledTimes(1);
      expect(mockEnrichFromSourceUrl).toHaveBeenCalledWith(
        "https://example.com/event",
        expect.objectContaining({ source_url: "https://example.com/event" })
      );
    });

    it("skips enrichment when source_url is missing", async () => {
      const parsed: ParsedEvent = {
        title: "Sunset Yoga",
        description: "x",
        category: "Yoga & Meditation",
        start_date: "2026-03-20",
      };
      await createEventFromParsed("msg-1", parsed, "src-1", true);
      expect(mockEnrichFromSourceUrl).not.toHaveBeenCalled();
    });

    it("skips enrichment when all enrichable fields already present", async () => {
      const parsed: ParsedEvent = {
        title: "Sunset Yoga",
        description: "x",
        short_description: "Brief",
        category: "Yoga & Meditation",
        start_date: "2026-03-20",
        venue_name: "Yoga Barn",
        venue_address: "Jl. Hanoman 44",
        organizer_name: "Saraswati",
        cover_image_url: "https://existing.com/img.jpg",
        price_info: "150k IDR",
        external_ticket_url: "https://tickets.com/x",
        source_url: "https://example.com/event",
      };
      await createEventFromParsed("msg-1", parsed, "src-1", true);
      expect(mockEnrichFromSourceUrl).not.toHaveBeenCalled();
    });

    it("never crashes the pipeline when enrichment throws", async () => {
      mockEnrichFromSourceUrl.mockRejectedValue(new Error("boom"));
      const parsed: ParsedEvent = {
        title: "Sunset Yoga",
        description: "x",
        category: "Yoga & Meditation",
        start_date: "2026-03-20",
        source_url: "https://example.com/event",
      };
      const result = await createEventFromParsed("msg-1", parsed, "src-1", true);
      expect(result.status).toBe("created");
    });
  });

  it("creates an event from valid parsed data", async () => {
    const parsed: ParsedEvent = {
      title: "Sunset Yoga",
      description: "Evening yoga session",
      category: "Yoga & Meditation",
      start_date: "2026-03-20",
      venue_name: "Yoga Barn",
    };

    const result = await createEventFromParsed("msg-1", parsed, "src-1", true);
    expect(result.status).toBe("created");
    expect(result.eventId).toBe("evt-1");
  });

  it("returns failed for missing title", async () => {
    const parsed: ParsedEvent = {
      title: "",
      description: "No title",
      category: "Other",
      start_date: "2026-03-20",
    };

    const result = await createEventFromParsed("msg-1", parsed, "src-1", true);
    expect(result.status).toBe("failed");
    expect(result.error).toContain("Missing required fields");
  });

  it("returns failed for missing start_date", async () => {
    // Empty start_date triggers the early return in createEventFromParsed
    // (the `!parsed.start_date` check happens before validateAndNormalizeDate)
    const parsed: ParsedEvent = {
      title: "No Date Event",
      description: "Missing date",
      category: "Other",
      start_date: "",
    };

    const result = await createEventFromParsed("msg-1", parsed, "src-1", true);
    expect(result.status).toBe("failed");
    expect(result.error).toContain("Missing required fields");
  });

  it("defaults invalid category to Other", async () => {
    const mockInsert = vi.fn().mockReturnValue(chain({ id: "evt-2" }));
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: () => chain(null), // slug check — no collision
          insert: mockInsert,
        };
      }
      if (table === "raw_ingestion_messages") {
        return { update: mockUpdate };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    const parsed: ParsedEvent = {
      title: "Test Event",
      description: "Testing",
      category: "Invalid Category XYZ",
      start_date: "2026-03-20",
    };

    await createEventFromParsed("msg-1", parsed, "src-1", true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Other" })
    );
  });

  it("returns duplicate for high-confidence dedup match (>= 0.9)", async () => {
    mockFindDuplicates.mockResolvedValue([
      {
        eventId: "existing-evt",
        matchType: "fingerprint",
        confidence: 0.95,
        metadata: {},
      },
    ]);

    const parsed: ParsedEvent = {
      title: "Duplicate Event",
      description: "Already exists",
      category: "Other",
      start_date: "2026-03-20",
    };

    const result = await createEventFromParsed("msg-1", parsed, "src-1", true);
    expect(result.status).toBe("duplicate");
  });

  it("creates event + records match for lower-confidence dedup", async () => {
    mockFindDuplicates.mockResolvedValue([
      {
        eventId: "maybe-dup",
        matchType: "fuzzy_title",
        confidence: 0.75,
        metadata: {},
      },
    ]);

    const parsed: ParsedEvent = {
      title: "Maybe Duplicate",
      description: "Possibly exists",
      category: "Other",
      start_date: "2026-03-20",
    };

    const result = await createEventFromParsed("msg-1", parsed, "src-1", true);
    expect(result.status).toBe("created");
    expect(mockRecordDedupMatch).toHaveBeenCalledWith("evt-1", expect.objectContaining({
      confidence: 0.75,
    }));
  });

  it("appends timestamp suffix on slug collision", async () => {
    const mockInsert = vi.fn().mockReturnValue(chain({ id: "evt-new" }));
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    // First slug check returns existing match (collision), so slug gets a suffix
    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return {
          // queryWithRetry calls the fn which returns .select().eq().single()
          // The slug check finds a collision first time
          select: () => chain({ slug: "slug-collision-event" }),
          insert: mockInsert,
        };
      }
      if (table === "raw_ingestion_messages") {
        return { update: mockUpdate };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    const parsed: ParsedEvent = {
      title: "Slug Collision Event",
      description: "Test",
      category: "Other",
      start_date: "2026-03-20",
    };

    await createEventFromParsed("msg-1", parsed, "src-1", true);
    // The insert should use a slug with timestamp suffix
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: expect.stringMatching(/slug-collision-event-[a-z0-9]+/),
      })
    );
  });

  it("returns failed on Supabase insert error", async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return {
          select: () => chain(null), // slug check
          insert: () => chain(null, { message: "Unique constraint violation" }),
        };
      }
      if (table === "raw_ingestion_messages") {
        return { update: mockUpdate };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    const parsed: ParsedEvent = {
      title: "Insert Fail Event",
      description: "Will fail",
      category: "Other",
      start_date: "2026-03-20",
    };

    const result = await createEventFromParsed("msg-1", parsed, "src-1", true);
    expect(result.status).toBe("failed");
    expect(result.error).toContain("Failed to insert event");
  });

  // ============================================
  // Auto-approve tests
  // ============================================

  it("auto-approves clean events regardless of source config", async () => {
    const mockInsert = vi.fn().mockReturnValue(chain({ id: "evt-1" }));
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return { select: () => chain(null), insert: mockInsert };
      }
      if (table === "raw_ingestion_messages") {
        return { update: mockUpdate };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    const parsed: ParsedEvent = {
      title: "Great Event",
      description: "Fully detailed event",
      category: "Yoga & Meditation",
      start_date: "2026-03-20",
      quality_score: 0.95,
      content_flags: [],
    };

    const result = await createEventFromParsed("msg-1", parsed, "src-1", true, {
      _autoApproveEnabled: false,
      _autoApproveThreshold: 0.85,
    });
    expect(result.status).toBe("created");
    expect(result.eventsAutoApproved).toBe(1);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" })
    );
  });

  it("auto-approves even when no source config is provided", async () => {
    const mockInsert = vi.fn().mockReturnValue(chain({ id: "evt-1" }));
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return { select: () => chain(null), insert: mockInsert };
      }
      if (table === "raw_ingestion_messages") {
        return { update: mockUpdate };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    const parsed: ParsedEvent = {
      title: "Great Event",
      description: "Fully detailed event",
      category: "Yoga & Meditation",
      start_date: "2026-03-20",
      quality_score: 0.92,
      content_flags: [],
    };

    const result = await createEventFromParsed("msg-1", parsed, "src-1", true);
    expect(result.status).toBe("created");
    expect(result.eventsAutoApproved).toBe(1);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" })
    );
  });

  it("auto-approves even when quality_score is low", async () => {
    const mockInsert = vi.fn().mockReturnValue(chain({ id: "evt-1" }));
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return { select: () => chain(null), insert: mockInsert };
      }
      if (table === "raw_ingestion_messages") {
        return { update: mockUpdate };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    const parsed: ParsedEvent = {
      title: "Vague Event",
      description: "Something happening",
      category: "Other",
      start_date: "2026-03-20",
      quality_score: 0.2,
      content_flags: ["low_quality"],
    };

    const result = await createEventFromParsed("msg-1", parsed, "src-1", true);
    expect(result.status).toBe("created");
    expect(result.eventsAutoApproved).toBe(1);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" })
    );
  });

  it("rejects when the AI moderation gate flags spam", async () => {
    mockModerateEvent.mockResolvedValueOnce({
      ok: false,
      flag: "spam",
      reason: "Crypto promotion, not a community event.",
    });

    const mockInsert = vi.fn().mockReturnValue(chain({ id: "evt-1" }));
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return { select: () => chain(null), insert: mockInsert };
      }
      if (table === "raw_ingestion_messages") {
        return { update: mockUpdate };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    const parsed: ParsedEvent = {
      title: "Suspicious Event",
      description: "Come join our crypto event",
      category: "Other",
      start_date: "2026-03-20",
      quality_score: 0.9,
      content_flags: [],
    };

    const result = await createEventFromParsed("msg-1", parsed, "src-1", true);
    expect(result.status).toBe("created");
    expect(result.eventsAutoApproved).toBe(0);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "rejected",
        moderation_reason: "Crypto promotion, not a community event.",
        content_flags: expect.arrayContaining(["spam"]),
      })
    );
  });

  it("rejects when the AI moderation gate flags inappropriate", async () => {
    mockModerateEvent.mockResolvedValueOnce({
      ok: false,
      flag: "inappropriate",
      reason: "Contains hate speech.",
    });

    const mockInsert = vi.fn().mockReturnValue(chain({ id: "evt-1" }));
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return { select: () => chain(null), insert: mockInsert };
      }
      if (table === "raw_ingestion_messages") {
        return { update: mockUpdate };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    const parsed: ParsedEvent = {
      title: "Inappropriate Event",
      description: "...",
      category: "Other",
      start_date: "2026-03-20",
      quality_score: 0.9,
      content_flags: [],
    };

    const result = await createEventFromParsed("msg-1", parsed, "src-1", true);
    expect(result.status).toBe("created");
    expect(result.eventsAutoApproved).toBe(0);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected" })
    );
  });

  it("stores quality_score and content_flags on the event", async () => {
    const mockInsert = vi.fn().mockReturnValue(chain({ id: "evt-1" }));
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "events") {
        return { select: () => chain(null), insert: mockInsert };
      }
      if (table === "raw_ingestion_messages") {
        return { update: mockUpdate };
      }
      if (table === "dedup_matches") {
        return { upsert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: () => chain(null), update: mockUpdate };
    });

    const parsed: ParsedEvent = {
      title: "Test Event",
      description: "Testing quality storage",
      category: "Other",
      start_date: "2026-03-20",
      quality_score: 0.78,
      content_flags: ["low_quality"],
    };

    await createEventFromParsed("msg-1", parsed, "src-1", true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        quality_score: 0.78,
        content_flags: ["low_quality"],
      })
    );
  });
});
