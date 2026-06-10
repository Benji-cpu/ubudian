import { describe, it, expect, vi, beforeEach } from "vitest";

// Organizer self-serve update route — the load-bearing guarantees:
// ownership (submitted_by_email must match the signed-in profile),
// moderation gate on edited content, and status never changing here.

const mockGetCurrentProfile = vi.fn();
vi.mock("@/lib/auth", () => ({
  getCurrentProfile: () => mockGetCurrentProfile(),
}));

const mockModerateEvent = vi.fn();
vi.mock("@/lib/events/moderation", () => ({
  moderateEvent: (...args: unknown[]) => mockModerateEvent(...args),
}));

const mockSingle = vi.fn();
const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
      update: mockUpdate,
    }),
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true }),
  getClientIp: () => "127.0.0.1",
}));

import { PATCH } from "../route";

const validBody = {
  title: "Edited Title",
  description: "A perfectly reasonable description of a gathering.",
  category: "Ceremony & Sound",
  start_date: "2026-07-15",
  organizer_name: "Org",
  organizer_contact: "+62 000",
  is_recurring: false,
};

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/events/abc/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "abc" });

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCurrentProfile.mockResolvedValue({ id: "p1", email: "owner@example.com" });
  mockModerateEvent.mockResolvedValue({ ok: true });
  mockSingle.mockResolvedValue({
    data: { id: "abc", submitted_by_email: "owner@example.com", status: "approved" },
  });
  mockUpdateEq.mockResolvedValue({ error: null });
});

describe("PATCH /api/events/[id]/update", () => {
  it("401s when not signed in", async () => {
    mockGetCurrentProfile.mockResolvedValue(null);
    const res = await PATCH(makeRequest(validBody), { params });
    expect(res.status).toBe(401);
  });

  it("403s when the event belongs to someone else", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "abc", submitted_by_email: "someone-else@example.com", status: "approved" },
    });
    const res = await PATCH(makeRequest(validBody), { params });
    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("403s when the event has no submitter (ingested events are not editable)", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "abc", submitted_by_email: null, status: "approved" },
    });
    const res = await PATCH(makeRequest(validBody), { params });
    expect(res.status).toBe(403);
  });

  it("422s when moderation rejects the edit, without writing", async () => {
    mockModerateEvent.mockResolvedValue({ ok: false, reason: "nope", flag: "spam" });
    const res = await PATCH(makeRequest(validBody), { params });
    expect(res.status).toBe(422);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates whitelisted fields, stamps the edit, never touches status", async () => {
    const res = await PATCH(makeRequest(validBody), { params });
    expect(res.status).toBe(200);
    const payload = mockUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.title).toBe("Edited Title");
    expect(payload.last_edited_by_submitter_at).toBeTruthy();
    expect(payload).not.toHaveProperty("status");
    expect(payload).not.toHaveProperty("slug");
    expect(payload).not.toHaveProperty("submitted_by_email");
    expect(payload).not.toHaveProperty("event_tier");
  });

  it("ownership check is case-insensitive", async () => {
    mockGetCurrentProfile.mockResolvedValue({ id: "p1", email: "OWNER@Example.com" });
    const res = await PATCH(makeRequest(validBody), { params });
    expect(res.status).toBe(200);
  });

  it("409s for rejected events", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "abc", submitted_by_email: "owner@example.com", status: "rejected" },
    });
    const res = await PATCH(makeRequest(validBody), { params });
    expect(res.status).toBe(409);
  });
});
