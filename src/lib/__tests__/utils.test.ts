import { describe, it, expect } from "vitest";
import { slugify, calculateReadTime, formatEventDate, formatEventTime } from "../utils";

describe("slugify", () => {
  it("converts a title to a slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Yoga & Wellness: Morning Class!")).toBe("yoga-wellness-morning-class");
  });

  it("handles multiple spaces and hyphens", () => {
    expect(slugify("  Too   many   spaces  ")).toBe("too-many-spaces");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("calculateReadTime", () => {
  it("returns 1 for very short content", () => {
    expect(calculateReadTime("Hello world")).toBe(1);
  });

  it("returns correct read time for longer content", () => {
    const words = Array(400).fill("word").join(" ");
    expect(calculateReadTime(words)).toBe(2);
  });

  it("rounds up to next minute", () => {
    const words = Array(201).fill("word").join(" ");
    expect(calculateReadTime(words)).toBe(2);
  });
});

describe("formatEventDate", () => {
  it("formats a single day event", () => {
    const result = formatEventDate("2026-03-15");
    expect(result).toBe("Sunday, March 15, 2026");
  });

  it("formats same-day start and end", () => {
    const result = formatEventDate("2026-03-15", "2026-03-15");
    expect(result).toBe("Sunday, March 15, 2026");
  });

  it("formats multi-day same month", () => {
    const result = formatEventDate("2026-03-15", "2026-03-20");
    expect(result).toContain("March 15");
    expect(result).toContain("20, 2026");
  });

  it("formats multi-day different months", () => {
    const result = formatEventDate("2026-03-28", "2026-04-02");
    expect(result).toContain("March 28");
    expect(result).toContain("April 2, 2026");
  });
});

describe("formatEventTime", () => {
  it("returns empty string for no start time", () => {
    expect(formatEventTime()).toBe("");
    expect(formatEventTime(null)).toBe("");
  });

  it("formats start time only", () => {
    expect(formatEventTime("14:00")).toBe("2 PM");
  });

  it("formats start and end time", () => {
    expect(formatEventTime("09:30", "11:00")).toBe("9:30 AM – 11 AM");
  });

  it("formats midnight correctly", () => {
    expect(formatEventTime("00:00")).toBe("12 AM");
  });

  it("formats noon correctly", () => {
    expect(formatEventTime("12:00")).toBe("12 PM");
  });
});
