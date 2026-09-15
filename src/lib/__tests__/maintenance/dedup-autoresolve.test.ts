import { describe, it, expect } from "vitest";
import { decideMatch } from "@/lib/maintenance/dedup-autoresolve";

const NOW = new Date("2026-09-15T00:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

function match(overrides: Partial<Parameters<typeof decideMatch>[0]> = {}) {
  return {
    id: "m1",
    event_a_id: "a",
    event_b_id: "b",
    confidence: 0.78,
    metadata: { recurring_cross_date: true, weekdayShared: true },
    created_at: daysAgo(1),
    ...overrides,
  };
}

describe("decideMatch", () => {
  it("resolves a match whose counterpart is archived or rejected", () => {
    expect(decideMatch(match(), { id: "a", status: "archived", is_recurring: true }, { id: "b", status: "pending", is_recurring: true }, NOW))
      .toEqual({ rule: "counterpart-gone" });
    expect(decideMatch(match(), { id: "a", status: "pending", is_recurring: true }, { id: "b", status: "rejected", is_recurring: false }, NOW))
      .toEqual({ rule: "counterpart-gone" });
    expect(decideMatch(match(), undefined, { id: "b", status: "pending", is_recurring: true }, NOW))
      .toEqual({ rule: "counterpart-gone" });
  });

  it("archives a pending weekly row that matches an already-live series", () => {
    const live = { id: "a", status: "approved", is_recurring: true };
    const waiting = { id: "b", status: "pending", is_recurring: true };
    expect(decideMatch(match(), live, waiting, NOW)).toEqual({ rule: "series-already-live", archive: "b" });
    // Either column order.
    expect(decideMatch(match(), waiting, live, NOW)).toEqual({ rule: "series-already-live", archive: "b" });
  });

  it("never merges when the dedup engine ruled out a shared weekday, or below the bar", () => {
    const live = { id: "a", status: "approved", is_recurring: true };
    const waiting = { id: "b", status: "pending", is_recurring: true };
    expect(decideMatch(match({ metadata: { recurring_cross_date: true, weekdayShared: false } }), live, waiting, NOW)).toBeNull();
    expect(decideMatch(match({ confidence: 0.7 }), live, waiting, NOW)).toBeNull();
    // A one-off matched against a series is not "the series".
    expect(decideMatch(match(), live, { id: "b", status: "pending", is_recurring: false }, NOW)).toBeNull();
  });

  it("times out a pending-pending match nobody resolved in 14 days, and waits on a young one", () => {
    const a = { id: "a", status: "pending", is_recurring: true };
    const b = { id: "b", status: "pending", is_recurring: true };
    expect(decideMatch(match({ created_at: daysAgo(15) }), a, b, NOW)).toEqual({ rule: "unresolved-timeout" });
    expect(decideMatch(match({ created_at: daysAgo(3) }), a, b, NOW)).toBeNull();
  });

  it("leaves two live rows alone — that is an editorial merge, not a gate decision", () => {
    const a = { id: "a", status: "approved", is_recurring: true };
    const b = { id: "b", status: "approved", is_recurring: true };
    expect(decideMatch(match({ created_at: daysAgo(40) }), a, b, NOW)).toBeNull();
  });
});
