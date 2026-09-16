import { describe, it, expect, vi } from "vitest";
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

/**
 * The write path, which is where this actually broke. `decideMatch` was fully
 * covered and correct; `autoResolveDedupMatches` then wrote the rule string
 * into `resolved_by`, a uuid FK to `profiles`, and Postgres rejected every
 * update with `invalid input syntax for type uuid`. The pure function's tests
 * could never have seen it, so the payload is asserted here against the
 * column types the table actually has.
 */
describe("autoResolveDedupMatches write payload", () => {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  it("never writes a non-uuid into resolved_by, and records the rule in metadata", async () => {
    const updates: Record<string, unknown>[] = [];
    const matchRow = {
      id: "11111111-1111-4111-8111-111111111111",
      event_a_id: "22222222-2222-4222-8222-222222222222",
      event_b_id: "33333333-3333-4333-8333-333333333333",
      confidence: 0.78,
      metadata: { recurring_cross_date: true, weekdayShared: true },
      created_at: daysAgo(1),
    };
    const events = [
      { id: matchRow.event_a_id, status: "archived", is_recurring: true },
      { id: matchRow.event_b_id, status: "pending", is_recurring: true },
    ];

    const client = {
      from(table: string) {
        const b: Record<string, unknown> = {};
        const chain = () => b;
        Object.assign(b, {
          select: () => b,
          eq: () => b,
          in: () => Promise.resolve({ data: events, error: null }),
          limit: () => Promise.resolve({ data: table === "dedup_matches" ? [matchRow] : [], error: null }),
          update: (payload: Record<string, unknown>) => {
            if (table === "dedup_matches") updates.push(payload);
            return { eq: () => ({ eq: () => Promise.resolve({ error: null }) }) };
          },
          then: undefined,
        });
        return chain();
      },
    };

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({ createAdminClient: () => client }));
    const { autoResolveDedupMatches } = await import("@/lib/maintenance/dedup-autoresolve");
    await autoResolveDedupMatches(NOW);
    vi.doUnmock("@/lib/supabase/admin");

    expect(updates).toHaveLength(1);
    const payload = updates[0] as { resolved_by?: unknown; metadata?: Record<string, unknown> };
    if (payload.resolved_by != null) expect(String(payload.resolved_by)).toMatch(UUID);
    expect(payload.metadata?.auto_rule).toBe("counterpart-gone");
    // The pre-existing metadata survives rather than being clobbered.
    expect(payload.metadata?.weekdayShared).toBe(true);
  });
});
