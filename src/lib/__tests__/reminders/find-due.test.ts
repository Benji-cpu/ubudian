import { describe, expect, it } from "vitest";
import { eventOccursOn, findDueReminders, type ReminderEvent, type SaveRow } from "@/lib/reminders/find-due";

function ev(overrides: Partial<ReminderEvent>): ReminderEvent {
  return {
    id: "e1",
    status: "approved",
    start_date: "2026-06-11",
    end_date: null,
    is_recurring: false,
    recurrence_rule: null,
    ...overrides,
  };
}

describe("eventOccursOn", () => {
  it("matches a one-off event on its start date", () => {
    expect(eventOccursOn(ev({}), "2026-06-11")).toBe(true);
    expect(eventOccursOn(ev({}), "2026-06-12")).toBe(false);
  });

  it("does not remind mid-way through a multi-day event", () => {
    const festival = ev({ start_date: "2026-06-11", end_date: "2026-06-14" });
    expect(eventOccursOn(festival, "2026-06-11")).toBe(true);
    expect(eventOccursOn(festival, "2026-06-12")).toBe(false);
  });

  it("ignores non-approved events", () => {
    expect(eventOccursOn(ev({ status: "archived" }), "2026-06-11")).toBe(false);
    expect(eventOccursOn(ev({ status: "pending" }), "2026-06-11")).toBe(false);
  });

  it("matches a weekly recurring event landing on the target weekday", () => {
    // 2026-06-11 is a Thursday (day_of_week 4)
    const weekly = ev({
      start_date: "2026-01-01",
      is_recurring: true,
      recurrence_rule: '{"frequency":"weekly","day_of_week":4}',
    });
    expect(eventOccursOn(weekly, "2026-06-11")).toBe(true);
    expect(eventOccursOn(weekly, "2026-06-12")).toBe(false);
  });

  it("does not match a recurring event before its seed date", () => {
    const weekly = ev({
      start_date: "2026-07-01",
      is_recurring: true,
      recurrence_rule: '{"frequency":"weekly","day_of_week":4}',
    });
    expect(eventOccursOn(weekly, "2026-06-11")).toBe(false);
  });

  it("caps a series with a natural-language until date", () => {
    // expandRecurrence has no until-cap of its own — this guards the
    // "Spirituality on The Dance Floor" failure mode (daily series that
    // ended Jun 4 but kept rolling forward).
    const capped = ev({
      start_date: "2026-06-02",
      is_recurring: true,
      recurrence_rule: "weekly until 2026-06-30",
    });
    expect(eventOccursOn(capped, "2026-07-07")).toBe(false);
  });

  it("matches daily recurrences every day", () => {
    const daily = ev({
      start_date: "2026-06-01",
      is_recurring: true,
      recurrence_rule: "daily",
    });
    expect(eventOccursOn(daily, "2026-06-11")).toBe(true);
  });
});

describe("findDueReminders", () => {
  const baseSave: SaveRow = {
    profileId: "p1",
    email: "a@b.com",
    emailOptOut: false,
    event: ev({}),
  };

  it("emits a reminder with a deterministic dedupe key", () => {
    const due = findDueReminders([baseSave], "2026-06-11");
    expect(due).toHaveLength(1);
    expect(due[0].dedupeKey).toBe("reminder:p1:e1:2026-06-11");
  });

  it("skips opted-out and email-less profiles", () => {
    const due = findDueReminders(
      [
        { ...baseSave, emailOptOut: true },
        { ...baseSave, profileId: "p2", email: null },
      ],
      "2026-06-11"
    );
    expect(due).toHaveLength(0);
  });

  it("skips saves whose event is not due", () => {
    const due = findDueReminders(
      [{ ...baseSave, event: ev({ start_date: "2026-06-20" }) }],
      "2026-06-11"
    );
    expect(due).toHaveLength(0);
  });
});
