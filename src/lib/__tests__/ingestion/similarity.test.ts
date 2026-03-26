import { describe, it, expect } from "vitest";
import {
  levenshteinDistance,
  stringSimilarity,
  normalizeForComparison,
  titlesMatch,
  eventSimilarityScore,
} from "@/lib/ingestion/similarity";

describe("levenshteinDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshteinDistance("hello", "hello")).toBe(0);
  });

  it("returns length of non-empty string when other is empty", () => {
    expect(levenshteinDistance("", "abc")).toBe(3);
    expect(levenshteinDistance("abc", "")).toBe(3);
  });

  it("returns 0 for two empty strings", () => {
    expect(levenshteinDistance("", "")).toBe(0);
  });

  it("calculates correct distance for single edits", () => {
    expect(levenshteinDistance("cat", "hat")).toBe(1); // substitution
    expect(levenshteinDistance("cat", "cats")).toBe(1); // insertion
    expect(levenshteinDistance("cats", "cat")).toBe(1); // deletion
  });

  it("calculates correct distance for multiple edits", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });

  it("is symmetric", () => {
    expect(levenshteinDistance("abc", "xyz")).toBe(levenshteinDistance("xyz", "abc"));
  });
});

describe("stringSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(stringSimilarity("hello", "hello")).toBe(1);
  });

  it("returns 1 for two empty strings", () => {
    expect(stringSimilarity("", "")).toBe(1);
  });

  it("returns 0 for completely different single chars", () => {
    expect(stringSimilarity("a", "b")).toBe(0);
  });

  it("returns value between 0 and 1 for similar strings", () => {
    const sim = stringSimilarity("hello", "hallo");
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
    expect(sim).toBe(0.8); // 1 - 1/5
  });
});

describe("normalizeForComparison", () => {
  it("lowercases text", () => {
    expect(normalizeForComparison("Hello World")).toBe("hello world");
  });

  it("strips non-alphanumeric characters", () => {
    expect(normalizeForComparison("Hello, World!")).toBe("hello world");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeForComparison("hello   world")).toBe("hello world");
  });

  it("trims whitespace", () => {
    expect(normalizeForComparison("  hello  ")).toBe("hello");
  });

  it("handles combined transformations", () => {
    expect(normalizeForComparison("  Yoga & Wellness!!  ")).toBe("yoga wellness");
  });
});

describe("titlesMatch", () => {
  it("matches identical titles", () => {
    expect(titlesMatch("Sunset Yoga", "Sunset Yoga")).toBe(true);
  });

  it("matches titles differing only in case and punctuation", () => {
    expect(titlesMatch("Sunset Yoga!", "sunset yoga")).toBe(true);
  });

  it("does not match completely different titles", () => {
    expect(titlesMatch("Sunset Yoga", "Morning Market")).toBe(false);
  });

  it("respects custom threshold", () => {
    // "yoga" vs "yogi" normalized: similarity = 0.75
    expect(titlesMatch("yoga", "yogi", 0.7)).toBe(true);
    expect(titlesMatch("yoga", "yogi", 0.8)).toBe(false);
  });
});

describe("eventSimilarityScore", () => {
  it("returns high score for identical events", () => {
    const score = eventSimilarityScore(
      { title: "Sunset Yoga", venue: "Yoga Barn", date: "2026-03-15" },
      { title: "Sunset Yoga", venue: "Yoga Barn", date: "2026-03-15" }
    );
    expect(score).toBe(1.0); // title:1*0.5 + venue:1*0.3 + date:1*0.2
  });

  it("returns lower score when venues differ", () => {
    const score = eventSimilarityScore(
      { title: "Sunset Yoga", venue: "Yoga Barn", date: "2026-03-15" },
      { title: "Sunset Yoga", venue: "Radiantly Alive", date: "2026-03-15" }
    );
    // title: 1*0.5 + venue: low*0.3 + date: 1*0.2 = 0.7 + venue contribution
    expect(score).toBeLessThan(1.0);
    expect(score).toBeGreaterThan(0.5);
  });

  it("uses 0.3 when both venues are null", () => {
    const score = eventSimilarityScore(
      { title: "Sunset Yoga", venue: null, date: "2026-03-15" },
      { title: "Sunset Yoga", venue: null, date: "2026-03-15" }
    );
    // title: 1*0.5 + venue: 0.3*0.3 + date: 1*0.2 = 0.5 + 0.09 + 0.2 = 0.79
    expect(score).toBeCloseTo(0.79, 2);
  });

  it("uses 0.2 when one venue is null", () => {
    const score = eventSimilarityScore(
      { title: "Sunset Yoga", venue: "Yoga Barn", date: "2026-03-15" },
      { title: "Sunset Yoga", venue: null, date: "2026-03-15" }
    );
    // title: 1*0.5 + venue: 0.2*0.3 + date: 1*0.2 = 0.5 + 0.06 + 0.2 = 0.76
    expect(score).toBeCloseTo(0.76, 2);
  });

  it("returns 0 for date component when dates differ", () => {
    const score = eventSimilarityScore(
      { title: "Sunset Yoga", venue: "Yoga Barn", date: "2026-03-15" },
      { title: "Sunset Yoga", venue: "Yoga Barn", date: "2026-03-16" }
    );
    // title: 1*0.5 + venue: 1*0.3 + date: 0*0.2 = 0.8
    expect(score).toBeCloseTo(0.8, 2);
  });

  it("returns low score for completely different events", () => {
    const score = eventSimilarityScore(
      { title: "Sunset Yoga", venue: "Yoga Barn", date: "2026-03-15" },
      { title: "Jazz Night", venue: "Bridges Bali", date: "2026-04-01" }
    );
    expect(score).toBeLessThan(0.5);
  });
});
