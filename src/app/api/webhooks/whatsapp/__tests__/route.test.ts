import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase admin client
const mockFrom = vi.fn();
const mockStorage = {
  from: vi.fn().mockReturnValue({
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: "https://storage.example.com/images/test.jpg" },
    }),
  }),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
    storage: mockStorage,
  }),
}));

// Mock pipeline
const mockProcessRawMessage = vi.fn();
vi.mock("@/lib/ingestion/pipeline", () => ({
  processRawMessage: (...args: unknown[]) => mockProcessRawMessage(...args),
}));

// Mock whatsapp adapter
const mockParseWebhook = vi.fn();
const mockDownloadMedia = vi.fn();
const mockVerifySecret = vi.fn();

vi.mock("@/lib/ingestion/adapters/whatsapp", () => ({
  parseWahaWebhook: (...args: unknown[]) => mockParseWebhook(...args),
  downloadWahaMedia: (...args: unknown[]) => mockDownloadMedia(...args),
  verifyWahaWebhookSecret: (...args: unknown[]) => mockVerifySecret(...args),
}));

// Mock after() from next/server to execute immediately
vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");
  return {
    ...actual,
    after: (fn: () => Promise<void>) => fn(),
  };
});

import { POST } from "../route";

function makeRequest(
  body: Record<string, unknown>,
  secret = "valid-secret"
): Request {
  return new Request("http://localhost/api/webhooks/whatsapp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": secret,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  event: "message",
  session: "default",
  engine: "WEBJS",
  payload: {
    id: "msg-123",
    timestamp: Date.now(),
    from: "1234567890@g.us",
    to: "me@c.us",
    participant: "5551234567@c.us",
    fromMe: false,
    body: "Join us for Sunset Yoga tomorrow at Yoga Barn, 5pm! Bring a mat.",
    hasMedia: false,
    ack: 1,
  },
};

describe("POST /api/webhooks/whatsapp", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: verify secret succeeds
    mockVerifySecret.mockReturnValue(true);

    // Default: parse returns a valid message
    mockParseWebhook.mockReturnValue({
      external_id: "msg-123",
      content_text: "Join us for Sunset Yoga tomorrow at Yoga Barn, 5pm!",
      sender_name: "5551234567",
      sender_id: "5551234567@c.us",
      raw_data: validBody,
    });

    // Default: source exists
    mockFrom.mockImplementation((table: string) => {
      if (table === "event_sources") {
        return {
          select: () => ({
            eq: (col: string) => {
              if (col === "source_type") {
                return {
                  eq: () => ({
                    limit: () => ({
                      single: () =>
                        Promise.resolve({
                          data: { id: "src-1", config: {}, is_enabled: true, events_ingested_count: 0 },
                          error: null,
                        }),
                    }),
                  }),
                };
              }
              return {};
            },
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === "raw_ingestion_messages") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({ data: { id: "stored-1" }, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    });

    mockProcessRawMessage.mockResolvedValue({
      messageId: "stored-1",
      status: "created",
      eventId: "evt-1",
    });
  });

  it("returns 401 for invalid webhook secret", async () => {
    mockVerifySecret.mockReturnValue(false);

    const res = await POST(makeRequest(validBody, "wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 200 ok when message is filtered out (null parse)", async () => {
    mockParseWebhook.mockReturnValue(null);

    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
  });

  it("returns 200 ok when no WhatsApp source configured", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "event_sources") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () => ({
                  single: () =>
                    Promise.resolve({ data: null, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("returns 200 ok and skips duplicate external_id", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "event_sources") {
        return {
          select: () => ({
            eq: (col: string) => {
              if (col === "source_type") {
                return {
                  eq: () => ({
                    limit: () => ({
                      single: () =>
                        Promise.resolve({
                          data: { id: "src-1", config: {}, is_enabled: true, events_ingested_count: 0 },
                          error: null,
                        }),
                    }),
                  }),
                };
              }
              return {};
            },
          }),
        };
      }
      if (table === "raw_ingestion_messages") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () =>
                  Promise.resolve({
                    data: [{ id: "existing-msg" }],
                    error: null,
                  }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(json.ok).toBe(true);
    // processRawMessage should NOT have been called
    expect(mockProcessRawMessage).not.toHaveBeenCalled();
  });

  it("stores message and processes it successfully", async () => {
    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockProcessRawMessage).toHaveBeenCalledWith(
      "stored-1",
      expect.objectContaining({ external_id: "msg-123" }),
      "src-1",
      {}
    );
  });

  it("filters by allowed_groups when configured", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "event_sources") {
        return {
          select: () => ({
            eq: (col: string) => {
              if (col === "source_type") {
                return {
                  eq: () => ({
                    limit: () => ({
                      single: () =>
                        Promise.resolve({
                          data: {
                            id: "src-1",
                            config: { allowed_groups: ["other-group@g.us"] },
                            is_enabled: true,
                          },
                          error: null,
                        }),
                    }),
                  }),
                };
              }
              return {};
            },
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(json.ok).toBe(true);
    // Should have been filtered out — processRawMessage NOT called
    expect(mockProcessRawMessage).not.toHaveBeenCalled();
  });

  it("handles store failure gracefully", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "event_sources") {
        return {
          select: () => ({
            eq: (col: string) => {
              if (col === "source_type") {
                return {
                  eq: () => ({
                    limit: () => ({
                      single: () =>
                        Promise.resolve({
                          data: { id: "src-1", config: {}, is_enabled: true, events_ingested_count: 0 },
                          error: null,
                        }),
                    }),
                  }),
                };
              }
              return {};
            },
          }),
        };
      }
      if (table === "raw_ingestion_messages") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: null,
                  error: { message: "Insert failed" },
                }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.error).toBe("store_failed");
  });

  it("downloads and uploads media inside after() for image messages", async () => {
    const mediaBody = {
      ...validBody,
      payload: {
        ...validBody.payload,
        hasMedia: true,
        mediaUrl: "https://waha.example.com/media/123",
        type: "image" as const,
      },
    };

    mockDownloadMedia.mockResolvedValue({
      buffer: Buffer.from("fake-image"),
      contentType: "image/jpeg",
    });

    const res = await POST(makeRequest(mediaBody));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    // Media download happens inside after() (which our mock executes synchronously)
    expect(mockDownloadMedia).toHaveBeenCalledWith("https://waha.example.com/media/123");
  });
});
