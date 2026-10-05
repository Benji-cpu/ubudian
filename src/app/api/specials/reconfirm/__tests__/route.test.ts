import { describe, it, expect, vi, beforeEach } from "vitest";

const mockApply = vi.fn();
vi.mock("@/lib/specials/reconfirm", () => ({ applyReconfirm: (...a: unknown[]) => mockApply(...a) }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, remaining: 19, resetAt: Date.now() + 3600000 }),
  getClientIp: () => "127.0.0.1",
}));

import { POST } from "../route";

const token = "3f2b8c1e-4a5d-4e6f-9a7b-8c9d0e1f2a3b";
const req = (body: unknown) =>
  new Request("http://localhost/api/specials/reconfirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/specials/reconfirm", () => {
  beforeEach(() => mockApply.mockReset());

  it("confirms with a valid token", async () => {
    mockApply.mockResolvedValue({ confirmed: 2, stopped: 0 });
    const res = await POST(req({ token }));
    expect(res.status).toBe(200);
    expect(mockApply).toHaveBeenCalledWith(token, []);
  });

  it("404s an unknown token", async () => {
    mockApply.mockResolvedValue(null);
    expect((await POST(req({ token }))).status).toBe(404);
  });

  it("400s a malformed token without touching the database", async () => {
    expect((await POST(req({ token: "abc" }))).status).toBe(400);
    expect(mockApply).not.toHaveBeenCalled();
  });
});
