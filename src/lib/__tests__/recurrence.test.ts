import { describe, it, expect } from "vitest";
import { parseRecurrenceRule, expandRecurrence, formatRecurrenceRule } from "../recurrence";

describe("parseRecurrenceRule", () => {
  it("parses a valid rule", () => {
    const result = parseRecurrenceRule('{"frequency":"weekly","day_of_week":2}');
    expect(result).toEqual({ frequency: "weekly", day_of_week: 2 });
  });

  it("returns null for null input", () => {
    expect(parseRecurrenceRule(null)).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseRecurrenceRule("not json")).toBeNull();
  });
});

describe("expandRecurrence", () => {
  it("returns single date for non-recurring event", () => {
    const dates = expandRecurrence(
      { start_date: "2026-03-15", recurrence_rule: null },
      new Date("2026-03-01"),
      new Date("2026-03-31")
    );
    expect(dates).toHaveLength(1);
  });

  it("expands weekly recurrence within range", () => {
    const dates = expandRecurrence(
      { start_date: "2026-03-01", recurrence_rule: '{"frequency":"weekly"}' },
      new Date("2026-03-01"),
      new Date("2026-03-31")
    );
    // March 1, 8, 15, 22, 29 = 5 weeks
    expect(dates.length).toBeGreaterThanOrEqual(4);
    expect(dates.length).toBeLessThanOrEqual(5);
  });

  it("expands daily recurrence within range", () => {
    const dates = expandRecurrence(
      { start_date: "2026-03-01", recurrence_rule: '{"frequency":"daily"}' },
      new Date("2026-03-01"),
      new Date("2026-03-08")
    );
    expect(dates).toHaveLength(7);
  });

  it("expands biweekly recurrence", () => {
    const dates = expandRecurrence(
      { start_date: "2026-03-01", recurrence_rule: '{"frequency":"biweekly"}' },
      new Date("2026-03-01"),
      new Date("2026-04-30")
    );
    // Every 2 weeks from March 1: Mar 1, Mar 15, Mar 29, Apr 12, Apr 26
    expect(dates.length).toBeGreaterThanOrEqual(4);
  });

  it("expands monthly recurrence", () => {
    const dates = expandRecurrence(
      { start_date: "2026-01-15", recurrence_rule: '{"frequency":"monthly"}' },
      new Date("2026-01-01"),
      new Date("2026-06-30")
    );
    // Jan 15, Feb 15, Mar 15, Apr 15, May 15, Jun 15
    expect(dates).toHaveLength(6);
  });

  it("excludes dates before range start", () => {
    const dates = expandRecurrence(
      { start_date: "2026-01-01", recurrence_rule: '{"frequency":"weekly"}' },
      new Date("2026-03-01"),
      new Date("2026-03-31")
    );
    dates.forEach((d) => {
      expect(d.getTime()).toBeGreaterThanOrEqual(new Date("2026-03-01").getTime());
    });
  });
});

describe("formatRecurrenceRule", () => {
  it("returns empty string for null", () => {
    expect(formatRecurrenceRule(null)).toBe("");
  });

  it("formats daily", () => {
    expect(formatRecurrenceRule('{"frequency":"daily"}')).toBe("Every day");
  });

  it("formats weekly with day", () => {
    expect(formatRecurrenceRule('{"frequency":"weekly","day_of_week":2}')).toBe("Every Tuesday");
  });

  it("formats weekly without day", () => {
    expect(formatRecurrenceRule('{"frequency":"weekly"}')).toBe("Every week");
  });

  it("formats biweekly with day", () => {
    expect(formatRecurrenceRule('{"frequency":"biweekly","day_of_week":1}')).toBe("Every other Monday");
  });

  it("formats monthly with day of month", () => {
    expect(formatRecurrenceRule('{"frequency":"monthly","day_of_month":15}')).toBe("Monthly on the 15th");
  });

  it("formats monthly without day", () => {
    expect(formatRecurrenceRule('{"frequency":"monthly"}')).toBe("Every month");
  });
});
