import { describe, it, expect } from "vitest";
import { filterEventsInRange } from "@/lib/events/filter-range";
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
    is_recurring: partial.is_recurring ?? false,
    recurrence_rule: partial.recurrence_rule ?? null,
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
  } as Event;
}

describe("filterEventsInRange", () => {
  it("matches a weekly Tuesday recurring event when 'Tomorrow' is a Tuesday", () => {
    // Today is Bali Monday 2026-05-18, so the Tomorrow chip sets
    // from = to = 2026-05-19 (Tuesday).
    const event = makeEvent({
      id: "tuesday-weekly",
      title: "5Rhythms",
      start_date: "2026-05-12", // seed: prior Tuesday
      is_recurring: true,
      recurrence_rule: JSON.stringify({ frequency: "weekly", day_of_week: 2 }),
    });

    const out = filterEventsInRange([event], "2026-05-19", "2026-05-19");
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("tuesday-weekly");
    expect(out[0].start_date).toBe("2026-05-19");
  });

  it("matches a daily recurring event for any day in range", () => {
    const event = makeEvent({
      id: "daily-class",
      start_date: "2026-01-01",
      is_recurring: true,
      recurrence_rule: JSON.stringify({ frequency: "daily" }),
    });

    const out = filterEventsInRange([event], "2026-05-19", "2026-05-19");
    expect(out).toHaveLength(1);
    expect(out[0].start_date).toBe("2026-05-19");
  });

  it("matches a multi-day retreat when the window falls inside the span", () => {
    const event = makeEvent({
      id: "retreat",
      start_date: "2026-05-15",
      end_date: "2026-05-22",
    });

    const out = filterEventsInRange([event], "2026-05-19", "2026-05-19");
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("retreat");
  });

  it("excludes a non-recurring event that does not overlap the window", () => {
    const event = makeEvent({
      id: "old-event",
      start_date: "2026-04-10",
    });

    const out = filterEventsInRange([event], "2026-06-01", "2026-06-30");
    expect(out).toHaveLength(0);
  });

  it("does not throw on malformed recurrence rules", () => {
    const event = makeEvent({
      id: "broken",
      start_date: "2026-04-10",
      is_recurring: true,
      recurrence_rule: "@@not-a-rule",
    });

    expect(() => filterEventsInRange([event], "2026-05-01", "2026-05-31")).not.toThrow();
  });

  it("rolls recurring events forward when no range is provided", () => {
    const event = makeEvent({
      id: "weekly-future",
      start_date: "2025-12-15",
      is_recurring: true,
      recurrence_rule: JSON.stringify({ frequency: "weekly" }),
    });

    const fixedNow = new Date("2026-05-18T10:00:00Z");
    const out = filterEventsInRange([event], null, null, fixedNow);
    expect(out).toHaveLength(1);
    // Rolled forward to a future date ≥ today; precise weekday depends on
    // the seed, but it must not still be the seed date.
    expect(out[0].start_date >= "2026-05-18").toBe(true);
  });

  it("preserves multi-day span when rolling a recurring event forward", () => {
    const event = makeEvent({
      id: "weekly-span",
      start_date: "2026-05-05", // Tue
      end_date: "2026-05-06", // Wed — 1-day span
      is_recurring: true,
      recurrence_rule: JSON.stringify({ frequency: "weekly", day_of_week: 2 }),
    });

    const out = filterEventsInRange([event], "2026-05-19", "2026-05-19");
    expect(out).toHaveLength(1);
    expect(out[0].start_date).toBe("2026-05-19");
    expect(out[0].end_date).toBe("2026-05-20");
  });

  it("hard-caps the window at MAX_WINDOW_DAYS even if `to` is far out", () => {
    const event = makeEvent({
      id: "far-future",
      start_date: "2027-01-01",
    });

    // Window beyond the 60-day clamp — the far-future event should NOT
    // match a clamped-to-60-day window starting today.
    const out = filterEventsInRange([event], "2026-05-19", "2027-12-31");
    expect(out).toHaveLength(0);
  });
});
