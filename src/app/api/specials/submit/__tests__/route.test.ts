import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) =>
      table === "deal_venues"
        ? { select: () => ({ ilike: () => ({ maybeSingle: async () => ({ data: { id: "venue-1" } }) }) }) }
        : { insert: mockInsert },
  }),
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, remaining: 4, resetAt: Date.now() + 3600000 }),
  getClientIp: () => "127.0.0.1",
}));

import { POST } from "../route";

const req = (body: Record<string, unknown>) =>
  new Request("http://localhost/api/specials/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const valid = {
  venue_name: "Warung Test",
  title: "Pasta + wine",
  price_idr: 135000,
  weekdays: [2, 2],
  start_time: "17:00",
  contact_name: "Made",
  contact_phone: "+62812000000",
  instagram_handle: "@warungtest",
};

describe("POST /api/specials/submit", () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockInsert.mockResolvedValue({ error: null });
  });

  it("publishes a valid special live with a 30-day expiry", async () => {
    const res = await POST(req(valid));
    expect(res.status).toBe(200);
    const row = mockInsert.mock.calls[0][0];
    expect(row.status).toBe("pending");
    expect(row.venue_id).toBe("venue-1");
    expect(row.source).toBe("form");
    expect(row.weekdays).toEqual([2]);
    expect(row.instagram_handle).toBe("warungtest");
    expect(row.expires_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("rejects links in the free text", async () => {
    const res = await POST(req({ ...valid, description: "cheap pills at www.spam.ru" }));
    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects a missing restaurant name", async () => {
    const res = await POST(req({ ...valid, venue_name: "" }));
    expect(res.status).toBe(400);
  });

  it("silently drops a filled honeypot", async () => {
    const res = await POST(req({ ...valid, website: "bot" }));
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
