import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateAndNormalizeDate } from "@/lib/ingestion/date-validator";

describe("validateAndNormalizeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-16T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a valid YYYY-MM-DD date", () => {
    const result = validateAndNormalizeDate("2026-04-01", "start_date");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("2026-04-01");
    expect(result.error).toBeUndefined();
  });

  it("parses and normalizes a human-readable date", () => {
    const result = validateAndNormalizeDate("April 1, 2026", "start_date");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("2026-04-01");
  });

  it("returns invalid for null input", () => {
    const result = validateAndNormalizeDate(null, "start_date");
    expect(result.valid).toBe(false);
    expect(result.normalized).toBeNull();
    expect(result.error).toBe("start_date is empty");
  });

  it("returns invalid for undefined input", () => {
    const result = validateAndNormalizeDate(undefined, "start_date");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("start_date is empty");
  });

  it("returns invalid for empty string", () => {
    const result = validateAndNormalizeDate("  ", "start_date");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("start_date is empty");
  });

  it("returns invalid for unparseable string", () => {
    const result = validateAndNormalizeDate("not-a-date", "start_date");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not a valid date");
  });

  it("rejects dates more than 1 year in the future", () => {
    const result = validateAndNormalizeDate("2028-01-01", "start_date");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too far in the future");
  });

  it("rejects dates more than 1 month in the past", () => {
    const result = validateAndNormalizeDate("2025-12-01", "start_date");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too far in the past");
  });

  it("accepts a date just within the 1-year future window", () => {
    const result = validateAndNormalizeDate("2027-03-15", "start_date");
    expect(result.valid).toBe(true);
  });

  it("accepts a date just within the 1-month past window", () => {
    const result = validateAndNormalizeDate("2026-02-20", "start_date");
    expect(result.valid).toBe(true);
  });
});
