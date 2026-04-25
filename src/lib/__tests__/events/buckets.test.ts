import { describe, it, expect } from "vitest";
import { bucketEventsByTime } from "@/lib/events/buckets";
import { nowInBali } from "@/lib/events/bali-time";
import type { Event } from "@/types";

function makeEvent(partial: Partial<Event> & { id: string; start_date: string }): Event {
  return {
    id: partial.id,
    title: partial.title ?? "Untitled",
    slug: partial.id,
    description: "",
    short_description: null,
    cover_image_url: null,
    category: "Other",
    venue_name: null,
    venue_address: null,
    venue_map_url: null,
    start_date: partial.start_date,
    end_date: partial.end_date ?? null,
    start_time: partial.start_time ?? null,
    end_time: partial.end_time ?? null,
    is_recurring: false,
    recurrence_rule: null,
    price_info: null,
    external_ticket_url: null,
    organizer_name: null,
    organizer_contact: null,
    organizer_instagram: null,
    status: "approved",
    submitted_by_email: null,
    is_trusted_submitter: false,
    rejection_reason: null,
    is_placeholder: false,
    is_core: false,
    archetype_tags: [],
    source_id: null,
    source_event_id: null,
    source_url: null,
    content_fingerprint: null,
    raw_message_id: null,
    llm_parsed: false,
    quality_score: null,
    content_flags: [],
    latitude: null,
    longitude: null,
    ai_approved_at: null,
    moderation_reason: null,
    source_kind: null,
    raw_text_snippet: null,
    parser_version: null,
    ingested_at: null,
    created_at: "2026-04-01",
    updated_at: "2026-04-01",
  };
}

/** Build a Date whose Bali local clock is at the given hour/minute on the given date. */
function baliClock(dateStr: string, hour: number, minute = 0): Date {
  // Bali = UTC+8. A Bali wall-clock of HH:MM on YYYY-MM-DD corresponds to
  // UTC of HH-8:MM on the same/prior UTC day.
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour - 8, minute, 0));
}

// Tuesday, Apr 21 2026 — Bali time
const TUES_8AM = baliClock("2026-04-21", 8);
const TUES_11AM = baliClock("2026-04-21", 11);
const TUES_4PM = baliClock("2026-04-21", 16);
const TUES_7PM = baliClock("2026-04-21", 19);

describe("bucketEventsByTime", () => {
  it("places today's later events in the today bucket", () => {
    const event = makeEvent({ id: "a", start_date: "2026-04-21", start_time: "19:00" });
    const buckets = bucketEventsByTime([event], TUES_8AM);
    expect(buckets.today.map((e) => e.id)).toEqual(["a"]);
    expect(buckets.happening_now).toHaveLength(0);
  });

  it("flags already-started events as happening_now", () => {
    const event = makeEvent({ id: "a", start_date: "2026-04-21", start_time: "07:00" });
    const buckets = bucketEventsByTime([event], TUES_8AM);
    expect(buckets.happening_now.map((e) => e.id)).toEqual(["a"]);
    expect(buckets.today).toHaveLength(0);
  });

  it("buckets tomorrow correctly", () => {
    const event = makeEvent({ id: "a", start_date: "2026-04-22" });
    const buckets = bucketEventsByTime([event], TUES_8AM);
    expect(buckets.tomorrow.map((e) => e.id)).toEqual(["a"]);
  });

  it("buckets upcoming Saturday/Sunday as weekend", () => {
    const sat = makeEvent({ id: "sat", start_date: "2026-04-25" });
    const sun = makeEvent({ id: "sun", start_date: "2026-04-26" });
    const buckets = bucketEventsByTime([sat, sun], TUES_8AM);
    expect(buckets.weekend.map((e) => e.id).sort()).toEqual(["sat", "sun"]);
  });

  it("puts events within the next week into next_week", () => {
    // Wed after the upcoming weekend — inside 7-day window, not today/tomorrow/weekend
    const event = makeEvent({ id: "wed", start_date: "2026-04-23" });
    const buckets = bucketEventsByTime([event], TUES_8AM);
    expect(buckets.next_week.map((e) => e.id)).toEqual(["wed"]);
  });

  it("places far-future events in later", () => {
    const event = makeEvent({ id: "far", start_date: "2026-06-01" });
    const buckets = bucketEventsByTime([event], TUES_8AM);
    expect(buckets.later.map((e) => e.id)).toEqual(["far"]);
  });

  it("drops fully-past events without end_date", () => {
    const event = makeEvent({ id: "past", start_date: "2026-04-10" });
    const buckets = bucketEventsByTime([event], TUES_8AM);
    expect(Object.values(buckets).flat()).toHaveLength(0);
  });

  it("keeps multi-day ongoing events in happening_now", () => {
    const event = makeEvent({
      id: "retreat",
      start_date: "2026-04-18",
      end_date: "2026-04-24",
    });
    const buckets = bucketEventsByTime([event], TUES_8AM);
    expect(buckets.happening_now.map((e) => e.id)).toEqual(["retreat"]);
  });

  it("sorts within each bucket by start_time", () => {
    const a = makeEvent({ id: "a", start_date: "2026-04-22", start_time: "18:00" });
    const b = makeEvent({ id: "b", start_date: "2026-04-22", start_time: "09:00" });
    const buckets = bucketEventsByTime([a, b], TUES_8AM);
    expect(buckets.tomorrow.map((e) => e.id)).toEqual(["b", "a"]);
  });

  // Bali-timezone regression cases — these guard the bug the user reported.
  describe("Bali-local time anchoring", () => {
    it("a 2pm–6pm Bali event shows as 'today' at 11am Bali (not happening_now)", () => {
      const event = makeEvent({
        id: "afternoon",
        start_date: "2026-04-21",
        start_time: "14:00",
        end_time: "18:00",
      });
      const buckets = bucketEventsByTime([event], TUES_11AM);
      expect(buckets.today.map((e) => e.id)).toEqual(["afternoon"]);
      expect(buckets.happening_now).toHaveLength(0);
    });

    it("a 2pm–6pm Bali event shows as happening_now at 4pm Bali", () => {
      const event = makeEvent({
        id: "afternoon",
        start_date: "2026-04-21",
        start_time: "14:00",
        end_time: "18:00",
      });
      const buckets = bucketEventsByTime([event], TUES_4PM);
      expect(buckets.happening_now.map((e) => e.id)).toEqual(["afternoon"]);
    });

    it("a 2pm–6pm Bali event is dropped at 7pm Bali (already ended)", () => {
      const event = makeEvent({
        id: "afternoon",
        start_date: "2026-04-21",
        start_time: "14:00",
        end_time: "18:00",
      });
      const buckets = bucketEventsByTime([event], TUES_7PM);
      expect(Object.values(buckets).flat()).toHaveLength(0);
    });

    it("rolls a weekly recurring event forward to the next upcoming occurrence", () => {
      // Recurring event with start_date in the past. Today is Tue Apr 21.
      // Weekly Tuesday recurrence → next occurrence is Apr 21 itself.
      const event = makeEvent({
        id: "weekly",
        start_date: "2026-03-31", // a Tuesday
        start_time: "18:00",
        end_time: "20:00",
      });
      event.is_recurring = true;
      event.recurrence_rule = '{"frequency":"weekly"}';

      const buckets = bucketEventsByTime([event], TUES_8AM);
      const today = buckets.today[0];
      expect(today?.id).toBe("weekly");
      expect(today?.start_date).toBe("2026-04-21");
    });

    it("rolls a Monday-weekly recurring event into tomorrow when today is Sunday", () => {
      // Today = Sunday Apr 26, 10am Bali.
      const sun = baliClock("2026-04-26", 10);
      const event = makeEvent({
        id: "monday-class",
        start_date: "2026-04-13", // a Monday
        start_time: "18:00",
      });
      event.is_recurring = true;
      event.recurrence_rule = '{"frequency":"weekly"}';

      const buckets = bucketEventsByTime([event], sun);
      expect(buckets.tomorrow.map((e) => e.id)).toEqual(["monday-class"]);
      expect(buckets.tomorrow[0].start_date).toBe("2026-04-27");
    });

    it("computes Bali's today correctly when UTC is on the prior day", () => {
      // 01:00 Bali on Apr 21 = 17:00 UTC on Apr 20. Events starting today (Bali)
      // must not be treated as tomorrow or future.
      const nearMidnightBali = new Date(Date.UTC(2026, 3, 20, 17, 0, 0));
      const bali = nowInBali(nearMidnightBali);
      expect(bali.dateStr).toBe("2026-04-21");

      const event = makeEvent({ id: "morning", start_date: "2026-04-21", start_time: "08:00" });
      const buckets = bucketEventsByTime([event], nearMidnightBali);
      expect(buckets.today.map((e) => e.id)).toEqual(["morning"]);
    });
  });
});
