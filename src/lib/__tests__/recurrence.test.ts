import { describe, it, expect } from "vitest";
import { parseRecurrenceRule, expandRecurrence, formatRecurrenceRule, normalizeRecurrenceRule, recurrenceEndDate } from "../recurrence";

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

describe("series end (until)", () => {
  it("reads UNTIL from an RRULE and INTERVAL=2 as biweekly", () => {
    expect(parseRecurrenceRule("FREQ=WEEKLY;INTERVAL=2;BYDAY=WE;UNTIL=20260917")).toEqual({
      frequency: "biweekly",
      day_of_week: 3,
      until: "2026-09-17",
    });
    expect(parseRecurrenceRule("FREQ=WEEKLY;UNTIL=20260626T170000Z")).toEqual({
      frequency: "weekly",
      until: "2026-06-26",
    });
  });

  it("reads free-text forms the parsers used to emit", () => {
    expect(parseRecurrenceRule("weekly until 2026-06-30")).toEqual({ frequency: "weekly", until: "2026-06-30" });
    expect(parseRecurrenceRule("until 2026-06-09")).toEqual({ frequency: "weekly", until: "2026-06-09" });
    expect(parseRecurrenceRule("Bi-weekly (every second Saturday)")).toEqual({ frequency: "biweekly", day_of_week: 6 });
    expect(parseRecurrenceRule("every 2 weeks")).toEqual({ frequency: "biweekly" });
    expect(parseRecurrenceRule("")).toBeNull();
  });

  it("rejects JSON that is not a rule", () => {
    expect(parseRecurrenceRule('{"foo":1}')).toBeNull();
  });

  it("stops expanding at until", () => {
    const dates = expandRecurrence(
      { start_date: "2026-03-01", recurrence_rule: '{"frequency":"weekly","until":"2026-03-15"}' },
      new Date("2026-03-01"),
      new Date("2026-03-31")
    );
    expect(dates.map((d) => d.getDate())).toEqual([1, 8, 15]);
  });

  it("normalises every input to one JSON shape and folds a series end in", () => {
    expect(normalizeRecurrenceRule("FREQ=WEEKLY;BYDAY=TH", "2026-11-11")).toBe(
      '{"frequency":"weekly","day_of_week":4,"until":"2026-11-11"}'
    );
    expect(normalizeRecurrenceRule('{"frequency":"weekly","day_of_week":[2]}', null)).toBe(
      '{"frequency":"weekly","day_of_week":2}'
    );
    // A rule's own until wins over the end_date argument.
    expect(normalizeRecurrenceRule("weekly until 2026-06-30", "2026-12-31")).toBe(
      '{"frequency":"weekly","until":"2026-06-30"}'
    );
    expect(normalizeRecurrenceRule(null, "2026-12-31")).toBeNull();
    expect(normalizeRecurrenceRule("sometimes")).toBeNull();
    expect(recurrenceEndDate('{"frequency":"weekly","until":"2026-06-30"}')).toBe("2026-06-30");
  });

  it("formats the end alongside the cadence", () => {
    expect(formatRecurrenceRule('{"frequency":"weekly","day_of_week":3,"until":"2026-11-11"}')).toBe(
      "Every Wednesday · until 11 Nov"
    );
  });
});
