import { describe, it, expect } from "vitest";
import { titleSimilarity } from "@/lib/maintenance/similarity";

describe("titleSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(titleSimilarity("Ecstatic Dance", "Ecstatic Dance")).toBe(1);
  });

  it("returns 1 for case- and punctuation-insensitive matches", () => {
    expect(titleSimilarity("Ecstatic Dance!", "ecstatic dance")).toBe(1);
  });

  it("scores high for prefix/suffix variants", () => {
    expect(titleSimilarity("Ecstatic Dance", "Ecstatic Dance Sunday Edition")).toBeGreaterThanOrEqual(
      0.4,
    );
  });

  it("scores low for unrelated titles", () => {
    expect(titleSimilarity("Tantra Workshop", "Sound Healing Ceremony")).toBeLessThan(0.2);
  });

  it("catches near-duplicate reposts with extra words", () => {
    const sim = titleSimilarity(
      "Full Moon Cacao Ceremony",
      "Full Moon Cacao Ceremony — Sound Bath",
    );
    expect(sim).toBeGreaterThanOrEqual(0.7);
  });

  it("handles empty strings without throwing", () => {
    expect(titleSimilarity("", "anything")).toBe(0);
    expect(titleSimilarity("anything", "")).toBe(0);
    expect(titleSimilarity("", "")).toBe(0);
  });

  it("treats single-token titles consistently", () => {
    expect(titleSimilarity("Tantra", "Tantra")).toBe(1);
    expect(titleSimilarity("Tantra", "Yoga")).toBe(0);
  });
});
