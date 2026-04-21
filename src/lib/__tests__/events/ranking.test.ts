import { describe, it, expect } from "vitest";
import {
  rankEvents,
  scoreEvent,
  timeComponent,
  popularityComponent,
  personalizationComponent,
} from "@/lib/events/ranking";
import type { Event } from "@/types";

function makeEvent(partial: Partial<Event> & { id: string; start_date: string }): Event {
  return {
    id: partial.id,
    title: partial.title ?? "Untitled",
    slug: partial.id,
    description: "",
    short_description: null,
    cover_image_url: null,
    category: partial.category ?? "Other",
    venue_name: null,
    venue_address: null,
    venue_map_url: null,
    start_date: partial.start_date,
    end_date: null,
    start_time: null,
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
    archetype_tags: partial.archetype_tags ?? [],
    source_id: null,
    source_event_id: null,
    source_url: null,
    content_fingerprint: null,
    raw_message_id: null,
    llm_parsed: false,
    quality_score: partial.quality_score ?? null,
    content_flags: [],
    latitude: null,
    longitude: null,
    ai_approved_at: null,
    moderation_reason: null,
    created_at: "2026-04-01",
    updated_at: "2026-04-01",
  };
}

describe("timeComponent", () => {
  const now = new Date("2026-04-21T12:00:00Z");

  it("peaks near today and tomorrow", () => {
    expect(timeComponent("2026-04-21", now)).toBeGreaterThan(0.9);
    expect(timeComponent("2026-04-22", now)).toBeGreaterThan(0.9);
  });

  it("declines as events move further out", () => {
    const soon = timeComponent("2026-04-24", now);
    const later = timeComponent("2026-05-01", now);
    const muchLater = timeComponent("2026-06-01", now);
    expect(soon).toBeGreaterThan(later);
    expect(later).toBeGreaterThan(muchLater);
  });

  it("returns tiny-but-nonzero for events running today that started earlier", () => {
    const ongoing = timeComponent("2026-04-20", now);
    expect(ongoing).toBeGreaterThan(0);
    expect(ongoing).toBeLessThan(0.6);
  });

  it("returns zero for clearly past events", () => {
    expect(timeComponent("2026-03-01", now)).toBe(0);
  });
});

describe("popularityComponent", () => {
  it("is zero for 0 saves", () => {
    expect(popularityComponent(0)).toBe(0);
  });
  it("grows logarithmically", () => {
    expect(popularityComponent(9)).toBeCloseTo(1, 1);
    expect(popularityComponent(99)).toBeCloseTo(2, 1);
  });
});

describe("personalizationComponent", () => {
  it("is zero without viewer archetypes", () => {
    expect(personalizationComponent(["seeker"], undefined)).toBe(0);
    expect(personalizationComponent(["seeker"], [])).toBe(0);
  });
  it("rewards overlap", () => {
    expect(personalizationComponent(["seeker"], ["seeker"])).toBe(1);
  });
  it("is zero with no overlap", () => {
    expect(personalizationComponent(["seeker"], ["explorer"])).toBe(0);
  });
});

describe("rankEvents", () => {
  const now = new Date("2026-04-21T12:00:00Z");

  it("sorts soon-high-quality-popular-matched events first", () => {
    const events: Event[] = [
      makeEvent({ id: "distant", start_date: "2026-06-01", quality_score: 0.9 }),
      makeEvent({
        id: "hero",
        start_date: "2026-04-21",
        quality_score: 0.9,
        archetype_tags: ["seeker"],
      }),
      makeEvent({ id: "vague", start_date: "2026-04-22", quality_score: 0.2 }),
    ];

    const ranked = rankEvents(events, { now, viewerArchetypes: ["seeker"] });
    expect(ranked[0].event.id).toBe("hero");
    expect(ranked[ranked.length - 1].event.id).toBe("distant");
  });

  it("still works without a viewer archetype", () => {
    const events: Event[] = [
      makeEvent({ id: "a", start_date: "2026-04-22", quality_score: 0.8 }),
      makeEvent({ id: "b", start_date: "2026-04-21", quality_score: 0.3 }),
    ];
    const ranked = rankEvents(events, { now });
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it("scoreEvent produces consistent component breakdowns", () => {
    const event = makeEvent({
      id: "x",
      start_date: "2026-04-22",
      quality_score: 0.5,
      archetype_tags: ["seeker"],
    });
    const s = scoreEvent(event, { now, viewerArchetypes: ["seeker"] });
    expect(s.components.time).toBeGreaterThan(0);
    expect(s.components.quality).toBe(0.5);
    expect(s.components.personalization).toBe(1);
  });
});
