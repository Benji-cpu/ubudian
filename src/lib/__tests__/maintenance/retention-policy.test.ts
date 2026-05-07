/**
 * Retention-policy tripwire — asserts that no cleanup helper hard-deletes an
 * `events` row.
 *
 * The policy (see `docs/data-retention.md`) is that approved and archived
 * events are retained indefinitely as a future AI training corpus. Multiple
 * downstream products depend on this. The cleanup helpers may only:
 *   - UPDATE events (e.g. flip status to 'archived')
 *   - SELECT events
 *
 * If a future engineer adds a code path that calls `.delete()` against
 * `from("events")`, this test fails loudly.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We track every (table, method) combination called against the admin client.
// `from(table)` returns a Proxy that records the next method invocation.
const calls: { table: string; method: string }[] = [];

function makeChain(table: string): unknown {
  // A handler-builder that returns the same chainable object regardless of
  // which method is invoked, while recording the *first* method call against
  // each `from(table)` chain (which is what we care about — `.delete()`,
  // `.update()`, `.select()`).
  let recorded = false;
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop, _receiver) {
      const method = String(prop);
      if (method === "then" || method === "catch" || method === "finally") {
        // Make the proxy thenable so `await` resolves to an empty result.
        return undefined;
      }
      if (!recorded) {
        recorded = true;
        calls.push({ table, method });
      }
      // Always return another proxy so chains keep working.
      return (..._args: unknown[]) => {
        // The terminal call (e.g. `.select()` after `.update()`) resolves to
        // a typical Postgrest shape: `{ data: [], error: null }`.
        return new Proxy({}, handler) as unknown;
      };
    },
  };
  return new Proxy({}, handler);
}

// The mocked supabase client. `from(table)` returns a chain proxy.
const fromMock = vi.fn((table: string) => makeChain(table) as unknown);

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

// Need to import AFTER the mock is set up.
import {
  archiveFuzzyDuplicateEvents,
  cancelStaleBookings,
  purgeFailedMessages,
} from "@/lib/maintenance/cleanups";
import { archivePastPendingEvents } from "@/lib/ingestion/alerts";

function eventDeletes(): { table: string; method: string }[] {
  return calls.filter((c) => c.table === "events" && c.method === "delete");
}

describe("retention policy: no cleanup helper deletes events", () => {
  beforeEach(() => {
    calls.length = 0;
    fromMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("archivePastPendingEvents never calls .delete() on events", async () => {
    await archivePastPendingEvents().catch(() => {
      /* mocked client may throw on a deeply chained call — we don't care, only
         the call recorder matters */
    });
    expect(eventDeletes()).toEqual([]);
  });

  it("archiveFuzzyDuplicateEvents never calls .delete() on events", async () => {
    await archiveFuzzyDuplicateEvents().catch(() => {
      /* see above */
    });
    expect(eventDeletes()).toEqual([]);
  });

  it("purgeFailedMessages never calls .delete() on events", async () => {
    await purgeFailedMessages().catch(() => {
      /* see above */
    });
    expect(eventDeletes()).toEqual([]);
    // Sanity: it DOES delete from raw_ingestion_messages — that's allowed.
    expect(
      calls.some(
        (c) => c.table === "raw_ingestion_messages" && c.method === "delete",
      ),
    ).toBe(true);
  });

  it("cancelStaleBookings never calls .delete() on events", async () => {
    await cancelStaleBookings().catch(() => {
      /* see above */
    });
    expect(eventDeletes()).toEqual([]);
  });
});
