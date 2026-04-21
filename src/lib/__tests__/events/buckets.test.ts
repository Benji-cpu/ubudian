import { describe, it, expect } from "vitest";
import { bucketEventsByTime } from "@/lib/events/buckets";
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
    end_time: null,
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
    created_at: "2026-04-01",
    updated_at: "2026-04-01",
  };
}

// Tuesday
const NOW = new Date("2026-04-21T08:00:00");

describe("bucketEventsByTime", () => {
  it("places today's later events in the today bucket", () => {
    const event = makeEvent({ id: "a", start_date: "2026-04-21", start_time: "19:00" });
    const buckets = bucketEventsByTime([event], NOW);
    expect(buckets.today.map((e) => e.id)).toEqual(["a"]);
    expect(buckets.happening_now).toHaveLength(0);
  });

  it("flags already-started events as happening_now", () => {
    const event = makeEvent({ id: "a", start_date: "2026-04-21", start_time: "07:00" });
    const buckets = bucketEventsByTime([event], NOW);
    expect(buckets.happening_now.map((e) => e.id)).toEqual(["a"]);
    expect(buckets.today).toHaveLength(0);
  });

  it("buckets tomorrow correctly", () => {
    const event = makeEvent({ id: "a", start_date: "2026-04-22" });
    const buckets = bucketEventsByTime([event], NOW);
    expect(buckets.tomorrow.map((e) => e.id)).toEqual(["a"]);
  });

  it("buckets upcoming Saturday/Sunday as weekend", () => {
    const sat = makeEvent({ id: "sat", start_date: "2026-04-25" });
    const sun = makeEvent({ id: "sun", start_date: "2026-04-26" });
    const buckets = bucketEventsByTime([sat, sun], NOW);
    expect(buckets.weekend.map((e) => e.id).sort()).toEqual(["sat", "sun"]);
  });

  it("puts events within the next week into next_week", () => {
    // Wed after the upcoming weekend — inside 7-day window, not today/tomorrow/weekend
    const event = makeEvent({ id: "wed", start_date: "2026-04-23" });
    const buckets = bucketEventsByTime([event], NOW);
    expect(buckets.next_week.map((e) => e.id)).toEqual(["wed"]);
  });

  it("places far-future events in later", () => {
    const event = makeEvent({ id: "far", start_date: "2026-06-01" });
    const buckets = bucketEventsByTime([event], NOW);
    expect(buckets.later.map((e) => e.id)).toEqual(["far"]);
  });

  it("drops fully-past events without end_date", () => {
    const event = makeEvent({ id: "past", start_date: "2026-04-10" });
    const buckets = bucketEventsByTime([event], NOW);
    expect(Object.values(buckets).flat()).toHaveLength(0);
  });

  it("keeps multi-day ongoing events in happening_now", () => {
    const event = makeEvent({
      id: "retreat",
      start_date: "2026-04-18",
      end_date: "2026-04-24",
    });
    const buckets = bucketEventsByTime([event], NOW);
    expect(buckets.happening_now.map((e) => e.id)).toEqual(["retreat"]);
  });

  it("sorts within each bucket by start_time", () => {
    const a = makeEvent({ id: "a", start_date: "2026-04-22", start_time: "18:00" });
    const b = makeEvent({ id: "b", start_date: "2026-04-22", start_time: "09:00" });
    const buckets = bucketEventsByTime([a, b], NOW);
    expect(buckets.tomorrow.map((e) => e.id)).toEqual(["b", "a"]);
  });
});
