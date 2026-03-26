import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock source-adapter to prevent side-effect registration
vi.mock("@/lib/ingestion/source-adapter", () => ({
  registerAdapter: vi.fn(),
}));

// Mock Supabase admin client
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({}),
}));

import {
  parseWahaWebhook,
  downloadWahaMedia,
  verifyWahaWebhookSecret,
} from "@/lib/ingestion/adapters/whatsapp";
import type { WahaWebhookPayload } from "@/lib/ingestion/adapters/whatsapp";

function makePayload(overrides: Partial<WahaWebhookPayload["payload"]> = {}): WahaWebhookPayload {
  return {
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
      body: "Join us for Sunset Yoga at Yoga Barn tomorrow at 5pm! A beautiful evening session.",
      hasMedia: false,
      ack: 1,
      ...overrides,
    },
  };
}

describe("parseWahaWebhook", () => {
  it("parses a valid group message into RawMessage", () => {
    const result = parseWahaWebhook(makePayload());
    expect(result).not.toBeNull();
    expect(result!.external_id).toBe("msg-123");
    expect(result!.content_text).toContain("Sunset Yoga");
    expect(result!.sender_name).toBe("5551234567");
    expect(result!.sender_id).toBe("5551234567@c.us");
  });

  it("returns null for fromMe messages", () => {
    const result = parseWahaWebhook(makePayload({ fromMe: true }));
    expect(result).toBeNull();
  });

  it("returns null for non-group messages", () => {
    const result = parseWahaWebhook(makePayload({ from: "5551234567@c.us" }));
    expect(result).toBeNull();
  });

  it("returns null for non-message events", () => {
    const payload = makePayload();
    payload.event = "message.ack";
    const result = parseWahaWebhook(payload);
    expect(result).toBeNull();
  });

  it("returns null for short messages without media", () => {
    const result = parseWahaWebhook(makePayload({ body: "Hi" }));
    expect(result).toBeNull();
  });

  it("accepts short messages with image media", () => {
    const result = parseWahaWebhook(
      makePayload({
        body: "Event",
        hasMedia: true,
        type: "image",
      })
    );
    expect(result).not.toBeNull();
  });

  it("uses caption for media messages", () => {
    const result = parseWahaWebhook(
      makePayload({
        body: "",
        caption: "Check out this amazing yoga retreat at Yoga Barn in Ubud, March 20th",
        hasMedia: true,
        type: "image",
      })
    );
    expect(result).not.toBeNull();
    expect(result!.content_text).toContain("yoga retreat");
  });

  it("falls back to from when participant is missing", () => {
    const result = parseWahaWebhook(
      makePayload({ participant: undefined })
    );
    expect(result).not.toBeNull();
    expect(result!.sender_id).toBe("1234567890@g.us");
  });
});

describe("downloadWahaMedia", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, WAHA_API_KEY: "test-api-key" };
  });

  it("downloads media with auth header", async () => {
    const buffer = Buffer.from("fake-image-data");
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: () => Promise.resolve(buffer.buffer),
    });

    const result = await downloadWahaMedia("https://waha.example.com/media/123");
    expect(result).not.toBeNull();
    expect(result!.contentType).toBe("image/jpeg");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://waha.example.com/media/123",
      { headers: { "X-Api-Key": "test-api-key" } }
    );
  });

  it("returns null when WAHA_API_KEY is missing", async () => {
    delete process.env.WAHA_API_KEY;
    const result = await downloadWahaMedia("https://waha.example.com/media/123");
    expect(result).toBeNull();
  });

  it("returns null when fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const result = await downloadWahaMedia("https://waha.example.com/media/123");
    expect(result).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const result = await downloadWahaMedia("https://waha.example.com/media/123");
    expect(result).toBeNull();
  });
});

describe("verifyWahaWebhookSecret", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, WAHA_WEBHOOK_SECRET: "my-secret" };
  });

  it("returns true for matching secret", () => {
    expect(verifyWahaWebhookSecret("my-secret")).toBe(true);
  });

  it("returns false for mismatched secret", () => {
    expect(verifyWahaWebhookSecret("wrong-secret")).toBe(false);
  });

  it("returns false when env var is not set", () => {
    delete process.env.WAHA_WEBHOOK_SECRET;
    expect(verifyWahaWebhookSecret("any-secret")).toBe(false);
  });

  it("returns false for null header", () => {
    expect(verifyWahaWebhookSecret(null)).toBe(false);
  });
});
