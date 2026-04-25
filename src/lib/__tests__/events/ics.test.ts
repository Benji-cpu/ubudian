import { describe, it, expect } from "vitest";
import { buildICS } from "@/lib/events/ics";
import type { Event } from "@/types";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Morning Yoga",
    slug: "morning-yoga",
    description: "A calm start to the day.",
    short_description: "Calm start",
    cover_image_url: null,
    category: "Yoga & Meditation",
    venue_name: "Yoga Barn",
    venue_address: "Jl. Hanoman, Ubud",
    venue_map_url: null,
    start_date: "2026-05-01",
    end_date: null,
    start_time: "08:00:00",
    end_time: "09:30:00",
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
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

const OPTIONS = {
  calendarName: "My Ubudian Agenda",
  calendarUrl: "https://ubudian-v1.vercel.app",
};

describe("buildICS", () => {
  it("produces a valid VCALENDAR wrapper", () => {
    const ics = buildICS([makeEvent()], OPTIONS);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//The Ubudian//Events//EN");
  });

  it("uses CRLF line endings throughout", () => {
    const ics = buildICS([makeEvent()], OPTIONS);
    // Must not contain lone LFs (other than after a CR)
    const lfOnly = ics.split("").filter((ch, i) => ch === "\n" && ics[i - 1] !== "\r");
    expect(lfOnly.length).toBe(0);
  });

  it("emits one VEVENT per event with required fields", () => {
    const events = [
      makeEvent({ id: "a", slug: "a" }),
      makeEvent({ id: "b", slug: "b", title: "Cacao Ceremony" }),
    ];
    const ics = buildICS(events, OPTIONS);
    const matches = ics.match(/BEGIN:VEVENT/g);
    expect(matches?.length).toBe(2);
    expect(ics).toContain("UID:a@ubudian-v1.vercel.app");
    expect(ics).toContain("UID:b@ubudian-v1.vercel.app");
    expect(ics).toContain("SUMMARY:Morning Yoga");
    expect(ics).toContain("SUMMARY:Cacao Ceremony");
    expect(ics).toContain("URL:https://ubudian-v1.vercel.app/events/a");
    expect(ics).toContain("DTSTAMP:");
  });

  it("converts Bali-local times to UTC DTSTART/DTEND", () => {
    // 08:00 WITA (UTC+8) -> 00:00 UTC
    const ics = buildICS(
      [makeEvent({ start_date: "2026-05-01", start_time: "08:00:00", end_time: "09:30:00" })],
      OPTIONS
    );
    expect(ics).toContain("DTSTART:20260501T000000Z");
    expect(ics).toContain("DTEND:20260501T013000Z");
  });

  it("renders all-day events with VALUE=DATE and exclusive DTEND", () => {
    const ics = buildICS(
      [makeEvent({ start_time: null, end_time: null, start_date: "2026-05-01" })],
      OPTIONS
    );
    expect(ics).toContain("DTSTART;VALUE=DATE:20260501");
    // DTEND exclusive = next day
    expect(ics).toContain("DTEND;VALUE=DATE:20260502");
  });

  it("escapes commas, semicolons, backslashes and newlines in text fields", () => {
    const ics = buildICS(
      [
        makeEvent({
          title: "Tantra, Breath; Connection",
          short_description: "Line one\nLine two\\ends",
          venue_name: "Space; One",
          venue_address: null,
        }),
      ],
      OPTIONS
    );
    expect(ics).toContain("SUMMARY:Tantra\\, Breath\\; Connection");
    expect(ics).toContain("DESCRIPTION:Line one\\nLine two\\\\ends");
    expect(ics).toContain("LOCATION:Space\\; One");
  });

  it("falls back to truncated description when short_description is null", () => {
    const longDesc = "word ".repeat(200).trim();
    const ics = buildICS([makeEvent({ short_description: null, description: longDesc })], OPTIONS);
    // Unfold continuation lines (RFC 5545: CRLF + space is a fold)
    const unfolded = ics.replace(/\r\n /g, "");
    const descLine = unfolded
      .split("\r\n")
      .find((line) => line.startsWith("DESCRIPTION:"));
    expect(descLine).toBeDefined();
    // Should be truncated (less than the full input) and end with ellipsis
    expect(descLine!.length).toBeLessThan(longDesc.length);
    expect(descLine!).toMatch(/…$/);
  });

  it("joins venue name + address in LOCATION", () => {
    const ics = buildICS(
      [makeEvent({ venue_name: "Yoga Barn", venue_address: "Jl. Hanoman, Ubud" })],
      OPTIONS
    );
    // comma in address gets escaped
    expect(ics).toContain("LOCATION:Yoga Barn\\, Jl. Hanoman\\, Ubud");
  });

  it("omits LOCATION when no venue info is available", () => {
    const ics = buildICS([makeEvent({ venue_name: null, venue_address: null })], OPTIONS);
    expect(ics).not.toContain("LOCATION:");
  });

  it("produces zero VEVENTs when given an empty list", () => {
    const ics = buildICS([], OPTIONS);
    expect(ics).not.toContain("BEGIN:VEVENT");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("folds long lines at 75 octets", () => {
    const longTitle = "A".repeat(200);
    const ics = buildICS([makeEvent({ title: longTitle })], OPTIONS);
    const lines = ics.split("\r\n");
    for (const line of lines) {
      // Folded continuation lines start with a space — the raw line itself
      // should never exceed 75 octets
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});
