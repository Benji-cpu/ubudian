import { describe, it, expect } from "vitest";
import {
  parsePriceFromText,
  matchesPriceBracket,
  PRICE_BRACKETS,
} from "../price-parser";

describe("parsePriceFromText", () => {
  it("returns null for null/empty input", () => {
    expect(parsePriceFromText(null)).toBeNull();
    expect(parsePriceFromText("")).toBeNull();
    expect(parsePriceFromText("  ")).toBeNull();
  });

  it('parses "Free" as zero', () => {
    expect(parsePriceFromText("Free")).toEqual({ min: 0, max: 0 });
    expect(parsePriceFromText("FREE")).toEqual({ min: 0, max: 0 });
    expect(parsePriceFromText("free entry")).toEqual({ min: 0, max: 0 });
  });

  it('parses "Rp X,XXX" format', () => {
    expect(parsePriceFromText("Rp 55,000")).toEqual({
      min: 55_000,
      max: 55_000,
    });
    expect(parsePriceFromText("Rp 250,000")).toEqual({
      min: 250_000,
      max: 250_000,
    });
  });

  it("parses ranges like 'Rp 250,000 - Rp 300,000'", () => {
    const result = parsePriceFromText("Rp 250,000 - Rp 300,000");
    expect(result).toEqual({ min: 250_000, max: 300_000 });
  });

  it('parses "500k" shorthand format', () => {
    expect(parsePriceFromText("500k")).toEqual({
      min: 500_000,
      max: 500_000,
    });
    expect(parsePriceFromText("100k")).toEqual({
      min: 100_000,
      max: 100_000,
    });
  });

  it('parses "500k IDR discount..." with surrounding text', () => {
    const result = parsePriceFromText("500k IDR discount for early birds");
    expect(result).toEqual({ min: 500_000, max: 500_000 });
  });

  it("parses dot-separated format like 'Rp 55.000'", () => {
    expect(parsePriceFromText("Rp 55.000")).toEqual({
      min: 55_000,
      max: 55_000,
    });
  });

  it("parses plain numbers", () => {
    expect(parsePriceFromText("250000")).toEqual({
      min: 250_000,
      max: 250_000,
    });
  });

  it("returns null for unparseable text", () => {
    expect(parsePriceFromText("Contact organizer")).toBeNull();
    expect(parsePriceFromText("TBA")).toBeNull();
    expect(parsePriceFromText("By donation")).toBeNull();
  });
});

describe("matchesPriceBracket", () => {
  it("unparseable prices match every bracket except free", () => {
    for (const bracket of PRICE_BRACKETS) {
      const expected = bracket.value !== "free";
      expect(matchesPriceBracket(null, bracket.value)).toBe(expected);
      expect(matchesPriceBracket("TBA", bracket.value)).toBe(expected);
    }
  });

  it("free events match only 'free' bracket", () => {
    expect(matchesPriceBracket("Free", "free")).toBe(true);
    expect(matchesPriceBracket("Free", "under-100k")).toBe(false);
    expect(matchesPriceBracket("Free", "100k-300k")).toBe(false);
  });

  it("Rp 55,000 matches 'under-100k'", () => {
    expect(matchesPriceBracket("Rp 55,000", "free")).toBe(false);
    expect(matchesPriceBracket("Rp 55,000", "under-100k")).toBe(true);
    expect(matchesPriceBracket("Rp 55,000", "100k-300k")).toBe(false);
  });

  it("Rp 250,000 matches '100k-300k'", () => {
    expect(matchesPriceBracket("Rp 250,000", "100k-300k")).toBe(true);
    expect(matchesPriceBracket("Rp 250,000", "under-100k")).toBe(false);
  });

  it("500k matches '300k-500k'", () => {
    expect(matchesPriceBracket("500k", "300k-500k")).toBe(true);
    expect(matchesPriceBracket("500k", "500k-plus")).toBe(false);
  });

  it("Rp 750,000 matches '500k-plus'", () => {
    expect(matchesPriceBracket("Rp 750,000", "500k-plus")).toBe(true);
    expect(matchesPriceBracket("Rp 750,000", "300k-500k")).toBe(false);
  });
});

describe("formatPriceInfo", () => {
  it("makes raw rupiah readable and leaves everything else alone", async () => {
    const { formatPriceInfo } = await import("@/lib/price-parser");
    expect(formatPriceInfo("IDR 90000")).toBe("Rp 90K");
    expect(formatPriceInfo("IDR 194174")).toBe("Rp 194,174");
    expect(formatPriceInfo("IDR 4368932")).toBe("Rp 4.37M");
    expect(formatPriceInfo("IDR 1500000")).toBe("Rp 1.5M");
    expect(formatPriceInfo("Rp 250K")).toBe("Rp 250K");
    expect(formatPriceInfo("IDR 150,000")).toBe("IDR 150,000");
    expect(formatPriceInfo("Donation · Min. Rp 50K")).toBe("Donation · Min. Rp 50K");
    expect(formatPriceInfo(null)).toBeNull();
  });
});
