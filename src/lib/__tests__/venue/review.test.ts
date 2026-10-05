import { describe, it, expect, vi } from "vitest";
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
import { toReviewItem, updateFor, type Decision } from "@/lib/venue/review";

const NOW = "2026-10-05T10:00:00.000Z";
const d = (action: Decision["action"]): Decision => ({ id: "00000000-0000-4000-8000-000000000000", action, note: "checked against their menu" });
const pendingRow = { id: "a", status: "pending", pending_changes: null };
const liveEdit = { id: "b", status: "live", pending_changes: { title: "Pay 1 get 2", price_idr: 120000, contact_email: "x@y.z" } };

describe("deals review decisions", () => {
  it("publishes a new deal for 30 days", () => {
    const u = updateFor(pendingRow, d("publish"), "2026-10-05", NOW)!;
    expect(u.status).toBe("live");
    expect(u.expires_on).toBe("2026-11-04");
    expect(u.review_note).toBe("publish: checked against their menu");
  });

  it("applies an approved edit to a live deal, editable fields only", () => {
    const u = updateFor(liveEdit, d("publish"), "2026-10-05", NOW)!;
    expect(u.title).toBe("Pay 1 get 2");
    expect(u.price_idr).toBe(120000);
    expect(u).not.toHaveProperty("contact_email");
    expect(u.pending_changes).toBeNull();
    expect(u).not.toHaveProperty("status");
  });

  it("a flag leaves it waiting with a note", () => {
    const u = updateFor(pendingRow, d("flag"), "2026-10-05", NOW)!;
    expect(u).not.toHaveProperty("status");
    expect(u.review_note).toMatch(/^flag:/);
  });

  it("rejecting a new deal hides it; rejecting an edit keeps the live version", () => {
    expect(updateFor(pendingRow, d("reject"), "2026-10-05", NOW)!.status).toBe("hidden");
    const u = updateFor(liveEdit, d("reject"), "2026-10-05", NOW)!;
    expect(u.pending_changes).toBeNull();
    expect(u).not.toHaveProperty("status");
  });

  it("skips a deal that changed since the routine read it", () => {
    expect(updateFor({ id: "c", status: "hidden", pending_changes: null }, d("publish"), "2026-10-05", NOW)).toBeNull();
    expect(updateFor({ id: "c", status: "live", pending_changes: null }, d("publish"), "2026-10-05", NOW)).toBeNull();
  });

  it("the review file never carries contact details", () => {
    const item = toReviewItem({
      ...liveEdit,
      venue_name: "Bar",
      title: "Old",
      contact_email: "secret@venue.id",
      contact_phone: "+62",
      updated_at: NOW,
    } as never);
    expect(JSON.stringify(item)).not.toMatch(/secret@venue|\+62/);
    expect(item.kind).toBe("edit");
    expect(item.current?.title).toBe("Old");
    expect(item.proposed.title).toBe("Pay 1 get 2");
  });
});
