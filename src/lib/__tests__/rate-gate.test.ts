import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateGate } from "@/lib/rate-gate";

/**
 * The property that matters is the START rate under CONCURRENCY — the thing a
 * concurrency cap does not give you, and the reason the sweep kept 429ing.
 */
describe("createRateGate", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("spaces concurrent callers instead of letting them all start at once", async () => {
    const gate = createRateGate(60); // one per second
    const started: number[] = [];
    const t0 = Date.now();

    // Ten workers all reach the gate in the same tick, as they do in the sweep.
    const all = Promise.all(
      Array.from({ length: 10 }, () => gate().then(() => started.push(Date.now() - t0))),
    );
    await vi.advanceTimersByTimeAsync(10_000);
    await all;

    expect(started).toHaveLength(10);
    // Each call starts ~1s after the previous one, not all at zero.
    for (let i = 1; i < started.length; i++) {
      expect(started[i] - started[i - 1]).toBeGreaterThanOrEqual(1000);
    }
    expect(started[9]).toBeGreaterThanOrEqual(9000);
  });

  it("does not delay a caller that arrives after the ceiling has gone quiet", async () => {
    const gate = createRateGate(60);
    await vi.advanceTimersByTimeAsync(0);
    await gate();
    await vi.advanceTimersByTimeAsync(5_000);
    const t = Date.now();
    await gate();
    expect(Date.now() - t).toBe(0);
  });

  it("rejects a nonsense rate rather than dividing by zero", () => {
    expect(() => createRateGate(0)).toThrow(/positive rpm/);
    expect(() => createRateGate(-5)).toThrow(/positive rpm/);
    expect(() => createRateGate(Number.NaN)).toThrow(/positive rpm/);
  });
});
