import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the admin client before importing the route
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, remaining: 4, resetAt: Date.now() + 900000 }),
  getClientIp: () => "127.0.0.1",
}));

import { POST } from "../route";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/events/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  title: "Test Event",
  description: "A test event with enough description text",
  category: "Music & Live Performance",
  start_date: "2026-04-01",
  organizer_name: "John",
  organizer_contact: "+62123456789",
  submitted_by_email: "test@example.com",
};

describe("POST /api/events/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock chain: trusted submitter lookup returns null
    mockFrom.mockImplementation((table: string) => {
      if (table === "trusted_submitters") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        };
      }
      if (table === "events") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => Promise.resolve({ data: null, error: null }),
        };
      }
      return {};
    });
  });

  it("returns 400 for missing required fields", async () => {
    const res = await POST(makeRequest({ title: "Incomplete" }));
    expect(res.status).toBe(400);
  });

  it("returns success for valid submission", async () => {
    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("silently returns success for honeypot triggers", async () => {
    const res = await POST(makeRequest({ ...validBody, website: "http://spam.com" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    // Should NOT have called supabase insert
    expect(mockFrom).not.toHaveBeenCalledWith("events");
  });

  it("auto-approves for trusted submitters", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "trusted_submitters") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { auto_approve: true }, error: null }),
            }),
          }),
        };
      }
      if (table === "events") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => Promise.resolve({ data: null, error: null }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(json.autoApproved).toBe(true);
  });
});
