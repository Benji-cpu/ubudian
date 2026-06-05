import { describe, it, expect } from "vitest";
import { estimateMrrCents, formatUsd } from "@/lib/analytics/mrr";

describe("estimateMrrCents", () => {
  it("returns 0 with no active subscriptions", () => {
    expect(estimateMrrCents({ monthly: 0, yearly: 0 })).toBe(0);
  });

  it("counts monthly subs at the monthly price (999¢ each)", () => {
    expect(estimateMrrCents({ monthly: 3, yearly: 0 })).toBe(2997);
  });

  it("normalises yearly subs to a monthly figure (9900¢ / 12 = 825¢)", () => {
    expect(estimateMrrCents({ monthly: 0, yearly: 1 })).toBe(825);
    expect(estimateMrrCents({ monthly: 0, yearly: 2 })).toBe(1650);
  });

  it("sums monthly and yearly contributions", () => {
    // 1 monthly (999) + 2 yearly (2 * 825 = 1650) = 2649
    expect(estimateMrrCents({ monthly: 1, yearly: 2 })).toBe(2649);
  });
});

describe("formatUsd", () => {
  it("formats cents as two-decimal USD by default", () => {
    expect(formatUsd(999)).toBe("$9.99");
    expect(formatUsd(2997)).toBe("$29.97");
    expect(formatUsd(0)).toBe("$0.00");
  });

  it("can drop the decimals", () => {
    expect(formatUsd(9900, { decimals: false })).toBe("$99");
  });
});
