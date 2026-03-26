import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM retry to pass through
vi.mock("@/lib/ingestion/llm-retry", () => ({
  withLLMRetry: async <T>(fn: () => Promise<T>) => fn(),
}));

// Mock llm-prompts
vi.mock("@/lib/ingestion/llm-prompts", () => ({
  CLASSIFY_MESSAGE_PROMPT: "classify prompt",
  CLASSIFY_AND_PARSE_PROMPT: "classify and parse prompt",
  PARSE_EVENT_PROMPT: "parse prompt",
  PARSE_EVENT_IMAGE_PROMPT: "parse image prompt",
  SEMANTIC_DEDUP_PROMPT: "dedup {EVENT_A} vs {EVENT_B}",
}));

// Mock Google Generative AI
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class MockGoogleGenerativeAI {
    constructor() {}
    getGenerativeModel = mockGetGenerativeModel;
  },
  SchemaType: {
    OBJECT: "OBJECT",
    STRING: "STRING",
    NUMBER: "NUMBER",
    BOOLEAN: "BOOLEAN",
    ARRAY: "ARRAY",
  },
}));

import {
  extractJSON,
  classifyMessage,
  classifyAndParseMessage,
  parseEventFromText,
  parseEventFromImage,
  compareEventsSemantically,
  LLMApiError,
} from "@/lib/ingestion/llm-parser";

describe("extractJSON", () => {
  it("extracts JSON from markdown code fence", () => {
    const text = '```json\n{"key": "value"}\n```';
    expect(extractJSON(text)).toBe('{"key": "value"}');
  });

  it("extracts JSON from code fence without language tag", () => {
    const text = '```\n{"key": "value"}\n```';
    expect(extractJSON(text)).toBe('{"key": "value"}');
  });

  it("extracts JSON object from mixed text", () => {
    const text = 'Here is the result: {"key": "value"} and more text';
    expect(extractJSON(text)).toBe('{"key": "value"}');
  });

  it("extracts JSON array from mixed text", () => {
    const text = 'Result: [1, 2, 3] done';
    expect(extractJSON(text)).toBe("[1, 2, 3]");
  });

  it("returns text as-is when no JSON found", () => {
    const text = "no json here";
    expect(extractJSON(text)).toBe("no json here");
  });
});

describe("classifyMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("returns classification result from Gemini", async () => {
    const classificationResponse = {
      is_event: true,
      confidence: 0.95,
      reason: "Contains event details",
    };

    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(classificationResponse) },
    });

    const result = await classifyMessage("Join us for yoga tomorrow at 5pm");
    expect(result.is_event).toBe(true);
    expect(result.confidence).toBe(0.95);
    expect(result.reason).toBe("Contains event details");
  });

  it("throws LLMApiError for unparseable response", async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => "not json" },
    });

    await expect(classifyMessage("test")).rejects.toThrow(LLMApiError);
  });
});

describe("classifyAndParseMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("returns combined classify+parse result", async () => {
    const response = {
      is_event: true,
      confidence: 0.9,
      events: [{
        title: "Sunset Yoga",
        description: "Yoga at sunset",
        category: "Yoga & Wellness",
        start_date: "2026-03-20",
      }],
    };

    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(response) },
    });

    const result = await classifyAndParseMessage("Sunset yoga March 20 at Yoga Barn");
    expect(result.is_event).toBe(true);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].title).toBe("Sunset Yoga");
  });
});

describe("parseEventFromText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("returns parsed events from text", async () => {
    const response = {
      events: [{
        title: "Jazz Night",
        description: "Live jazz at Bridges",
        category: "Music & Live Performance",
        start_date: "2026-03-25",
        venue_name: "Bridges Bali",
      }],
    };

    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(response) },
    });

    const events = await parseEventFromText("Jazz Night at Bridges, March 25");
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Jazz Night");
    expect(events[0].venue_name).toBe("Bridges Bali");
  });

  it("handles single event response without events wrapper", async () => {
    const response = {
      title: "Solo Event",
      description: "A single event",
      category: "Other",
      start_date: "2026-04-01",
    };

    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(response) },
    });

    const events = await parseEventFromText("Solo event April 1");
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Solo Event");
  });
});

describe("parseEventFromImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("fetches image and parses event from it", async () => {
    // Mock the global fetch for image download
    const imageBuffer = new ArrayBuffer(8);
    const view = new Uint8Array(imageBuffer);
    view[0] = 0xff; view[1] = 0xd8; // JPEG magic bytes

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(imageBuffer),
      headers: new Headers({ "content-type": "image/jpeg" }),
    });

    const response = {
      events: [{
        title: "Flyer Event",
        description: "Event from flyer",
        category: "Art & Culture",
        start_date: "2026-04-10",
      }],
    };

    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(response) },
    });

    const events = await parseEventFromImage("https://example.com/flyer.jpg");
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Flyer Event");
  });

  it("returns empty array when image fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const events = await parseEventFromImage("https://example.com/missing.jpg");
    expect(events).toEqual([]);
  });

  it("detects image type from magic bytes for octet-stream", async () => {
    const imageBuffer = new ArrayBuffer(8);
    const view = new Uint8Array(imageBuffer);
    view[0] = 0x89; view[1] = 0x50; // PNG magic bytes

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(imageBuffer),
      headers: new Headers({ "content-type": "application/octet-stream" }),
    });

    const response = { events: [{ title: "PNG Event", description: "test", category: "Other", start_date: "2026-04-10" }] };
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(response) },
    });

    await parseEventFromImage("https://example.com/image.png");
    // Verify model was called with PNG mime type
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateContent.mock.calls[0][0];
    const inlineDataPart = callArgs.find((p: unknown) => typeof p === "object" && p !== null && "inlineData" in p);
    expect(inlineDataPart.inlineData.mimeType).toBe("image/png");
  });
});

describe("compareEventsSemantically", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("returns semantic dedup result", async () => {
    const response = {
      is_duplicate: true,
      confidence: 0.92,
      reasoning: "Same event, different descriptions",
    };

    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(response) },
    });

    const result = await compareEventsSemantically(
      { title: "Yoga", description: "Morning yoga", start_date: "2026-03-20" },
      { title: "Yoga Session", description: "Yoga in the morning", start_date: "2026-03-20" }
    );

    expect(result.is_duplicate).toBe(true);
    expect(result.confidence).toBe(0.92);
  });

  it("returns not-duplicate result", async () => {
    const response = {
      is_duplicate: false,
      confidence: 0.85,
      reasoning: "Different events",
    };

    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(response) },
    });

    const result = await compareEventsSemantically(
      { title: "Yoga", description: "Morning yoga", start_date: "2026-03-20" },
      { title: "Jazz Night", description: "Live music", start_date: "2026-03-20" }
    );

    expect(result.is_duplicate).toBe(false);
  });
});

describe("LLMApiError", () => {
  it("is retryable by default", () => {
    const err = new LLMApiError("test error");
    expect(err.retryable).toBe(true);
    expect(err.message).toBe("test error");
    expect(err.name).toBe("LLMApiError");
  });

  it("can be non-retryable", () => {
    const err = new LLMApiError("bad parse", false);
    expect(err.retryable).toBe(false);
  });
});
