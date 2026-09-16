import { describe, it, expect, vi } from "vitest";

/**
 * The delete is chunked, and this asserts the chunking rather than the intent.
 * PostgREST puts an `in` list in the QUERY STRING; ~2000 uuids overrun it and
 * the server answers "Bad Request", so the unchunked version purged nothing
 * and reported the failure into the digest's errors array, where nothing reads
 * it. The reference lookup beside it was already chunked, which is what made
 * the omission invisible on a read of the code.
 */
describe("purgeStalePendingMessages", () => {
  it("deletes in chunks no larger than the reference lookup uses", async () => {
    const CANDIDATES = 1000;
    const ids = Array.from({ length: CANDIDATES }, (_, i) =>
      `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    );
    const deleteBatches: number[] = [];

    const client = {
      from(table: string) {
        const b: Record<string, unknown> = {};
        Object.assign(b, {
          select: () => b,
          eq: () => b,
          lt: () => b,
          limit: () => Promise.resolve({ data: ids.map((id) => ({ id })), error: null }),
          // The references query: nothing is referenced, so everything is purgeable.
          in: (_col: string, chunk: string[]) => {
            if (table === "events") return Promise.resolve({ data: [], error: null });
            deleteBatches.push(chunk.length);
            return Promise.resolve({ error: null });
          },
          delete: () => b,
        });
        return b;
      },
    };

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({ createAdminClient: () => client }));
    const { purgeStalePendingMessages } = await import("@/lib/maintenance/expiry");
    const result = await purgeStalePendingMessages();
    vi.doUnmock("@/lib/supabase/admin");

    expect(result.errors).toEqual([]);
    expect(result.expired).toBe(CANDIDATES);
    expect(deleteBatches.length).toBeGreaterThan(1);
    expect(Math.max(...deleteBatches)).toBeLessThanOrEqual(200);
    expect(deleteBatches.reduce((a, b) => a + b, 0)).toBe(CANDIDATES);
  });
});
