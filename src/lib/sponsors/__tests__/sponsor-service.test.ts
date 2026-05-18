import { describe, it, expect } from "vitest";
import { isSponsorshipActive } from "@/lib/sponsors/sponsor-service";

const FIXED_NOW = new Date("2026-06-01T12:00:00Z");

describe("isSponsorshipActive", () => {
  it("is active when starts in the past and ends_at is null (ongoing)", () => {
    const row = { starts_at: "2026-05-01T00:00:00Z", ends_at: null };
    expect(isSponsorshipActive(row, FIXED_NOW)).toBe(true);
  });

  it("is active when starts in the past and ends_at is in the future", () => {
    const row = { starts_at: "2026-05-01T00:00:00Z", ends_at: "2026-07-01T00:00:00Z" };
    expect(isSponsorshipActive(row, FIXED_NOW)).toBe(true);
  });

  it("is inactive when ends_at is in the past", () => {
    const row = { starts_at: "2026-05-01T00:00:00Z", ends_at: "2026-05-15T00:00:00Z" };
    expect(isSponsorshipActive(row, FIXED_NOW)).toBe(false);
  });

  it("is inactive when ends_at equals now (exclusive upper bound)", () => {
    const row = { starts_at: "2026-05-01T00:00:00Z", ends_at: FIXED_NOW.toISOString() };
    expect(isSponsorshipActive(row, FIXED_NOW)).toBe(false);
  });

  it("is inactive when starts_at is in the future", () => {
    const row = { starts_at: "2026-07-01T00:00:00Z", ends_at: null };
    expect(isSponsorshipActive(row, FIXED_NOW)).toBe(false);
  });

  it("is active when starts_at equals now (inclusive lower bound)", () => {
    const row = { starts_at: FIXED_NOW.toISOString(), ends_at: null };
    expect(isSponsorshipActive(row, FIXED_NOW)).toBe(true);
  });

  it("treats unparseable starts_at as inactive", () => {
    const row = { starts_at: "not-a-date", ends_at: null };
    expect(isSponsorshipActive(row, FIXED_NOW)).toBe(false);
  });

  it("treats unparseable ends_at as ongoing (defensive)", () => {
    const row = { starts_at: "2026-05-01T00:00:00Z", ends_at: "garbage" };
    expect(isSponsorshipActive(row, FIXED_NOW)).toBe(true);
  });
});
