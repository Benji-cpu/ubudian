import { describe, it, expect } from "vitest";
import { screenPendingEvent, type PendingEventRow } from "@/lib/maintenance/auto-approve";

const TODAY = "2026-08-03";

/**
 * A listing that clears every rule. Each test mutates exactly one field, so a
 * failure names the rule that broke rather than "the fixture is wrong".
 */
function publishable(overrides: Partial<PendingEventRow> = {}): PendingEventRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Ecstatic Dance at The Yoga Barn",
    description:
      "A barefoot journey through five rhythms with live percussion. Doors at 18:30, no talking on the floor.",
    short_description: null,
    category: "Dance & Movement",
    venue_name: "The Yoga Barn",
    start_date: "2026-08-14",
    end_date: null,
    is_recurring: false,
    recurrence_rule: null,
    content_flags: [],
    quality_score: 0.82,
    organizer_name: "The Yoga Barn",
    source_url: "https://theyogabarn.com/classes/ecstatic-dance/",
    ...overrides,
  };
}

describe("screenPendingEvent", () => {
  it("passes a complete, future, well-categorised listing", () => {
    expect(screenPendingEvent(publishable(), TODAY)).toEqual({ ok: true });
  });

  it("holds a listing whose description is a stub", () => {
    const result = screenPendingEvent(
      publishable({ description: "Dance night.", short_description: null }),
      TODAY,
    );
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/description too thin/);
  });

  it("accepts short_description as the body when description is a title echo", () => {
    // Several pre-parsed adapters mirror the title into `description` and put
    // the real copy in `short_description`.
    const result = screenPendingEvent(
      publishable({
        description: "Ecstatic Dance",
        short_description:
          "A barefoot journey through five rhythms with live percussion and a closing circle.",
      }),
      TODAY,
    );
    expect(result).toEqual({ ok: true });
  });

  it("holds a listing with no usable venue", () => {
    for (const venue of [null, "", "  ", "TB"]) {
      const result = screenPendingEvent(publishable({ venue_name: venue }), TODAY);
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe("no usable venue");
    }
  });

  it("holds the unclassified 'Other' fallback category", () => {
    const result = screenPendingEvent(publishable({ category: "Other" }), TODAY);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/unclassified fallback/);
  });

  it("holds a category that is not in EVENT_CATEGORIES", () => {
    const result = screenPendingEvent(publishable({ category: "Nightlife" }), TODAY);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/unknown category/);
  });

  it("holds anything the parser flagged", () => {
    const result = screenPendingEvent(publishable({ content_flags: ["spam"] }), TODAY);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/parser flags: spam/);
  });

  it("holds a low parser quality score but not a missing one", () => {
    const low = screenPendingEvent(publishable({ quality_score: 0.2 }), TODAY);
    expect(low.ok).toBe(false);
    expect(low.ok === false && low.reason).toMatch(/quality_score/);

    // Pre-parsed adapters never score; absence is not evidence of low quality.
    expect(screenPendingEvent(publishable({ quality_score: null }), TODAY)).toEqual({ ok: true });
  });

  it("holds a one-off event that has already happened", () => {
    const result = screenPendingEvent(publishable({ start_date: "2026-07-30" }), TODAY);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/already past/);
  });

  it("passes a multi-day festival that is mid-run", () => {
    const result = screenPendingEvent(
      publishable({ start_date: "2026-08-01", end_date: "2026-08-08" }),
      TODAY,
    );
    expect(result).toEqual({ ok: true });
  });

  it("passes a recurring event whose seed date is in the past", () => {
    const result = screenPendingEvent(
      publishable({
        start_date: "2026-05-02",
        is_recurring: true,
        recurrence_rule: '{"frequency":"weekly"}',
      }),
      TODAY,
    );
    expect(result).toEqual({ ok: true });
  });

  it("holds a recurring series whose end date has passed", () => {
    // Real row from production: is_recurring=true with the end smuggled into
    // the rule as free text. The series finished on 2026-06-09.
    for (const rule of ["until 2026-06-09", "RRULE:FREQ=WEEKLY;UNTIL=20260609T000000Z"]) {
      const result = screenPendingEvent(
        publishable({ start_date: "2026-05-18", is_recurring: true, recurrence_rule: rule }),
        TODAY,
      );
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toMatch(/recurrence ended 2026-06-09/);
    }
  });

  it("passes a recurring series whose end date is still ahead", () => {
    const result = screenPendingEvent(
      publishable({
        start_date: "2026-05-18",
        is_recurring: true,
        recurrence_rule: "RRULE:FREQ=WEEKLY;UNTIL=20261201T000000Z",
      }),
      TODAY,
    );
    expect(result).toEqual({ ok: true });
  });

  it("treats an is_recurring row with an unparseable rule as a one-off", () => {
    // expandRecurrence() falls back to emitting the seed date alone for these,
    // so they behave like one-offs and must face the past-date check.
    const past = screenPendingEvent(
      publishable({ start_date: "2026-05-18", is_recurring: true, recurrence_rule: "sometimes" }),
      TODAY,
    );
    expect(past.ok).toBe(false);
    expect(past.ok === false && past.reason).toMatch(/rule is unparseable/);

    const alsoHeld = screenPendingEvent(
      publishable({ start_date: "2026-09-01", is_recurring: true, recurrence_rule: null }),
      TODAY,
    );
    expect(alsoHeld.ok).toBe(false);
  });

  it("passes an event starting today", () => {
    expect(screenPendingEvent(publishable({ start_date: TODAY }), TODAY)).toEqual({ ok: true });
  });

  it("holds a listing with a one-word title", () => {
    const result = screenPendingEvent(publishable({ title: "Dance" }), TODAY);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/title too short/);
  });
});
