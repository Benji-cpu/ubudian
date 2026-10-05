import { describe, it, expect, vi } from "vitest";
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/email", () => ({ sendTransactionalEmail: vi.fn() }));
import { isDueForReconfirm, groupForReconfirm, daysUpdates, type ReconfirmRow } from "@/lib/specials/reconfirm";
import { buildSpecialReconfirmEmailHtml } from "@/lib/email/special-reconfirm-email";

const today = "2026-10-05";
const now = new Date("2026-10-05T02:00:00Z");
const row = (o: Partial<ReconfirmRow> = {}): ReconfirmRow => ({
  id: "a",
  venue_name: "Warung",
  title: "Pasta",
  status: "live",
  expires_on: "2026-10-10",
  contact_email: "w@example.com",
  confirm_token: "00000000-0000-0000-0000-000000000000",
  reconfirm_sent_at: null,
  ...o,
});

describe("reconfirm rules", () => {
  it("asks within a week of lapsing, not before", () => {
    expect(isDueForReconfirm(row(), today, now)).toBe(true);
    expect(isDueForReconfirm(row({ expires_on: "2026-10-12" }), today, now)).toBe(true);
    expect(isDueForReconfirm(row({ expires_on: "2026-10-13" }), today, now)).toBe(false);
  });

  it("skips hidden, lapsed and unreachable rows", () => {
    expect(isDueForReconfirm(row({ status: "hidden" }), today, now)).toBe(false);
    expect(isDueForReconfirm(row({ expires_on: "2026-10-04" }), today, now)).toBe(false);
    expect(isDueForReconfirm(row({ contact_email: null }), today, now)).toBe(false);
  });

  it("doesn't ask again within five days", () => {
    expect(isDueForReconfirm(row({ reconfirm_sent_at: "2026-10-02T02:00:00Z" }), today, now)).toBe(false);
    expect(isDueForReconfirm(row({ reconfirm_sent_at: "2026-09-30T01:00:00Z" }), today, now)).toBe(true);
  });

  it("sends one message per venue and address", () => {
    const groups = groupForReconfirm([
      row({ id: "1" }),
      row({ id: "2", venue_name: "warung " }),
      row({ id: "3", venue_name: "Other" }),
    ]);
    expect(groups.map((g) => g.map((r) => r.id))).toEqual([["1", "2"], ["3"]]);
  });

  it("escapes venue-supplied text in the email", () => {
    const html = buildSpecialReconfirmEmailHtml({
      venueName: "<b>Bar</b>",
      titles: ["2-for-1 <script>"],
      expiresOn: "2026-11-04",
      confirmUrl: "https://theubudian.life/tonight/confirm/x",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;b&gt;Bar&lt;/b&gt;");
    expect(html).toContain("https://theubudian.life/tonight/confirm/x");
  });

  it("lets a venue date only its own kept deals that had no days", () => {
    const specials = [
      { id: "u1", days_stated: false },
      { id: "u2", days_stated: false },
      { id: "s1", days_stated: true },
    ];
    const updates = daysUpdates(specials, ["u1", "s1"], {
      u1: [5, 1, 1, 9],
      u2: [3],
      s1: [2],
      other: [4],
    });
    // u2 was taken down, s1 already had days, "other" isn't this venue's; 9 isn't a day.
    expect(updates).toEqual([{ id: "u1", weekdays: [1, 5] }]);
    expect(daysUpdates(specials, ["u1"], { u1: [] })).toEqual([]);
  });
});
