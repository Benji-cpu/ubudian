import { describe, it, expect } from "vitest";
import { groupEventsByDate } from "@/lib/events/group-by-date";
import type { Event } from "@/types";

function makeEvent(
  partial: Partial<Event> & { id: string; start_date: string }
): Event {
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
    is_members_only: false,
    members_only_teaser: null,
    archetype_tags: [],
    intent_tags: [],
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
    ...partial,
  } as Event;
}

/** Build a Date whose Bali local clock is at the given hour on the given date. */
function baliClock(dateStr: string, hour: number, minute = 0): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour - 8, minute, 0));
}

// Tuesday, Apr 21 2026 — Bali time, 8am.
const TUES_8AM = baliClock("2026-04-21", 8);

describe("groupEventsByDate", () => {
  it("returns [] for empty input", () => {
    expect(groupEventsByDate([], TUES_8AM)).toEqual([]);
  });

  it("labels today and tomorrow with a weekday+date suffix", () => {
    const today = makeEvent({ id: "t", start_date: "2026-04-21" });
    const tomorrow = makeEvent({ id: "tm", start_date: "2026-04-22" });
    const groups = groupEventsByDate([tomorrow, today], TUES_8AM);

    expect(groups.map((g) => g.dateKey)).toEqual(["2026-04-21", "2026-04-22"]);
    expect(groups[0].label).toBe("Today · Tue 21 Apr");
    expect(groups[1].label).toBe("Tomorrow · Wed 22 Apr");
  });

  it("labels further-out dates as weekday + date only", () => {
    const sat = makeEvent({ id: "s", start_date: "2026-04-25" });
    const groups = groupEventsByDate([sat], TUES_8AM);
    expect(groups[0].label).toBe("Sat 25 Apr");
  });

  it("orders groups chronologically", () => {
    const far = makeEvent({ id: "far", start_date: "2026-06-01" });
    const soon = makeEvent({ id: "soon", start_date: "2026-04-23" });
    const today = makeEvent({ id: "today", start_date: "2026-04-21" });
    const groups = groupEventsByDate([far, soon, today], TUES_8AM);
    expect(groups.map((g) => g.dateKey)).toEqual([
      "2026-04-21",
      "2026-04-23",
      "2026-06-01",
    ]);
  });

  it("sorts events within a group by start time", () => {
    const evening = makeEvent({ id: "pm", start_date: "2026-04-25", start_time: "19:00" });
    const morning = makeEvent({ id: "am", start_date: "2026-04-25", start_time: "08:00" });
    const groups = groupEventsByDate([evening, morning], TUES_8AM);
    expect(groups[0].events.map((e) => e.id)).toEqual(["am", "pm"]);
  });

  it("pins a multi-day event still in its span under Today", () => {
    const retreat = makeEvent({
      id: "retreat",
      start_date: "2026-04-19", // started two days ago
      end_date: "2026-04-24", // still running
    });
    const groups = groupEventsByDate([retreat], TUES_8AM);
    expect(groups).toHaveLength(1);
    expect(groups[0].dateKey).toBe("2026-04-21");
    expect(groups[0].label).toBe("Today · Tue 21 Apr");
  });

  it("drops events whose span has fully ended", () => {
    const past = makeEvent({
      id: "past",
      start_date: "2026-04-10",
      end_date: "2026-04-12",
    });
    expect(groupEventsByDate([past], TUES_8AM)).toEqual([]);
  });
});
