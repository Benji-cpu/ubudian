import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/beehiiv", () => ({
  addSubscriber: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, remaining: 4, resetAt: Date.now() + 900000 }),
  getClientIp: () => "127.0.0.1",
}));

import { POST } from "../route";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/newsletter/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation(() => ({
      upsert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }));
  });

  it("returns 400 for missing email", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("subscribes valid email", async () => {
    const res = await POST(makeRequest({ email: "test@example.com" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("handles database errors gracefully", async () => {
    mockFrom.mockImplementation(() => ({
      upsert: () => Promise.resolve({ data: null, error: { message: "DB error", code: "500" } }),
    }));

    const res = await POST(makeRequest({ email: "test@example.com" }));
    expect(res.status).toBe(500);
  });
});
