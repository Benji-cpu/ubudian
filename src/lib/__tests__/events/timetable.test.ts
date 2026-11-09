import { describe, it, expect } from "vitest";
import {
  baliWeek,
  eventCount,
  eventMapHref,
  matchesArchetype,
  nextForArchetype,
  occurrencesBetween,
  outboundLink,
  stillAheadToday,
  thisWeekByDay,
  tonightTitle,
  updatedLine,
  weekAhead,
  weekTitle,
  yourWeekHeading,
} from "@/lib/events/timetable";
import type { Event } from "@/types";

function ev(partial: Partial<Event> & { id: string; start_date: string }): Event {
  return {
    title: partial.id,
    slug: partial.id,
    description: "",
    short_description: null,
    cover_image_url: null,
    category: "Other",
    venue_name: "Yoga Barn",
    venue_address: null,
    venue_map_url: null,
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
    is_core: false,
    event_tier: "core",
    is_spotlight: false,
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
    created_at: "2026-10-01",
    updated_at: "2026-10-01",
    ...partial,
  };
}

// Monday 9 Nov 2026, 7pm in Bali (UTC+8).
const MON_7PM = new Date("2026-11-09T11:00:00Z");
const ids = (events: Event[]) => events.map((e) => e.id);

describe("stillAheadToday (the homepage's rule)", () => {
  const events = [
    ev({ id: "started-20-min-ago", start_date: "2026-11-09", start_time: "18:40:00" }),
    ev({ id: "started-40-min-ago", start_date: "2026-11-09", start_time: "18:20:00" }),
    ev({ id: "later-tonight", start_date: "2026-11-09", start_time: "20:00:00" }),
    ev({ id: "no-time", start_date: "2026-11-09" }),
    ev({ id: "over", start_date: "2026-11-09", start_time: "16:00:00", end_time: "18:00:00" }),
    ev({ id: "festival-day-1", start_date: "2026-11-09", end_date: "2026-11-11", start_time: "10:00:00" }),
    ev({ id: "tomorrow", start_date: "2026-11-10", start_time: "19:00:00" }),
  ];

  it("keeps what you can still get to, with 30 minutes' grace after a start", () => {
    expect(ids(stillAheadToday(events, MON_7PM)).sort()).toEqual(
      ["festival-day-1", "later-tonight", "no-time", "started-20-min-ago"].sort()
    );
  });
});

describe("occurrencesBetween", () => {
  it("puts a weekly class on each of its days and a one-off on its first day", () => {
    const events = [
      ev({ id: "mon-thu", start_date: "2026-10-05", is_recurring: true, recurrence_rule: '{"frequency":"weekly","day_of_week":[1,4]}' }),
      ev({ id: "retreat", start_date: "2026-11-10", end_date: "2026-11-14" }),
      ev({ id: "next-week", start_date: "2026-11-16" }),
    ];
    const got = occurrencesBetween(events, "2026-11-10", "2026-11-15").map((e) => `${e.id}@${e.start_date}`);
    expect(got.sort()).toEqual(["mon-thu@2026-11-12", "retreat@2026-11-10"]);
  });

  it("stops a series at its end and reads an unreadable rule as a one-off", () => {
    const events = [
      ev({ id: "ended", start_date: "2026-10-07", is_recurring: true, recurrence_rule: '{"frequency":"weekly","day_of_week":3,"until":"2026-11-04"}' }),
      ev({ id: "no-rule", start_date: "2026-11-12", is_recurring: true, recurrence_rule: "sometimes" }),
    ];
    expect(ids(occurrencesBetween(events, "2026-11-10", "2026-11-15"))).toEqual(["no-rule"]);
  });
});

describe("the Bali week", () => {
  it("runs Monday to Sunday on the Bali calendar, not the server's", () => {
    // 01:00 on Monday in Bali is still Sunday in UTC.
    expect(baliWeek(new Date("2026-11-08T17:00:00Z"))).toMatchObject({ monday: "2026-11-09", sunday: "2026-11-15" });
    // 23:00 on Sunday in Bali belongs to the week before.
    expect(baliWeek(new Date("2026-11-08T15:00:00Z"))).toMatchObject({ monday: "2026-11-02", sunday: "2026-11-08" });
  });

  it("groups the rest of the week by day, today first", () => {
    const events = [
      ev({ id: "weekly-thu", start_date: "2026-10-01", is_recurring: true, recurrence_rule: '{"frequency":"weekly","day_of_week":4}', start_time: "18:00:00" }),
      ev({ id: "tonight", start_date: "2026-11-09", start_time: "20:00:00" }),
      ev({ id: "this-morning", start_date: "2026-11-09", start_time: "08:00:00" }),
      ev({ id: "sat-late", start_date: "2026-11-14", start_time: "21:00:00" }),
      ev({ id: "sat-early", start_date: "2026-11-14", start_time: "09:00:00" }),
      ev({ id: "sat-untimed", start_date: "2026-11-14" }),
      ev({ id: "next-monday", start_date: "2026-11-16" }),
    ];
    const days = thisWeekByDay(events, MON_7PM);
    expect(days.map((d) => d.date)).toEqual(["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"]);
    expect(days[0].label).toBe("Today · Monday 9 Nov");
    expect(days[1].label).toBe("Tomorrow · Tuesday 10 Nov");
    expect(days[2].label).toBe("Wednesday 11 Nov");
    expect(ids(days[0].events)).toEqual(["tonight"]);
    expect(ids(days[3].events)).toEqual(["weekly-thu"]);
    expect(ids(days[5].events)).toEqual(["sat-early", "sat-late", "sat-untimed"]);
    expect(days.flatMap((d) => ids(d.events))).not.toContain("next-monday");
  });

  it("leaves out the days already over", () => {
    const thursday = new Date("2026-11-12T02:00:00Z"); // Thu 10am Bali
    expect(thisWeekByDay([], thursday).map((d) => d.date)).toEqual(["2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"]);
  });
});

describe("titles", () => {
  it("dates both pages", () => {
    expect(tonightTitle("2026-11-09")).toBe("Things to do in Ubud tonight (Mon 9 Nov)");
    expect(weekTitle("2026-11-09", "2026-11-15")).toBe("Ubud events this week (9–15 Nov)");
    expect(weekTitle("2026-11-30", "2026-12-06")).toBe("Ubud events this week (30 Nov–6 Dec)");
  });

  it("says when the listings were last updated, in Bali time", () => {
    expect(updatedLine("2026-11-08T22:30:00Z", MON_7PM)).toBe("Updated today at 6:30 AM Bali time");
    expect(updatedLine("2026-11-08T11:00:00Z", MON_7PM)).toBe("Updated yesterday at 7 PM Bali time");
    expect(updatedLine("2026-11-06T02:00:00Z", MON_7PM)).toBe("Updated Fri 6 Nov at 10 AM Bali time");
  });

  it("counts events, not gatherings", () => {
    expect(eventCount(1)).toBe("1 event");
    expect(eventCount(14)).toBe("14 events");
  });
});

describe("the quiz's week", () => {
  const events = [
    ev({ id: "sound-thu", start_date: "2026-11-12", start_time: "19:00:00", category: "Ceremony & Sound" }),
    ev({ id: "tagged-wed", start_date: "2026-11-11", start_time: "10:00:00", archetype_tags: ["seeker"] }),
    ev({ id: "dance-tonight", start_date: "2026-11-09", start_time: "20:00:00", category: "Dance & Movement" }),
    ev({ id: "yoga-daily", start_date: "2026-10-01", is_recurring: true, recurrence_rule: '{"frequency":"daily"}', start_time: "07:00:00", category: "Yoga & Meditation" }),
    ev({ id: "far-off", start_date: "2026-11-20", category: "Ceremony & Sound" }),
  ];

  it("matches by tag or by the archetype's categories", () => {
    expect(matchesArchetype(events[0], "seeker")).toBe(true);
    expect(matchesArchetype(events[1], "seeker")).toBe(true);
    expect(matchesArchetype(events[2], "seeker")).toBe(false);
  });

  it("lists the next matches over seven days, soonest first, each listing once", () => {
    const week = weekAhead(events, MON_7PM);
    expect(ids(nextForArchetype(week, "seeker", 5, MON_7PM))).toEqual(["yoga-daily", "tagged-wed", "sound-thu"]);
    expect(ids(nextForArchetype(week, "seeker", 2, MON_7PM))).toEqual(["yoga-daily", "tagged-wed"]);
    expect(ids(week)).not.toContain("far-off");
  });

  it("spreads the picks over the week, at most two a day", () => {
    const sound = (id: string, start_date: string, start_time: string) =>
      ev({ id, start_date, start_time, category: "Ceremony & Sound" });
    const crowded = [
      sound("mon-a", "2026-11-09", "19:15:00"),
      sound("mon-b", "2026-11-09", "20:00:00"),
      sound("mon-c", "2026-11-09", "21:00:00"),
      sound("tue-a", "2026-11-10", "09:00:00"),
      sound("tue-b", "2026-11-10", "18:00:00"),
      sound("sat-a", "2026-11-14", "10:00:00"),
    ];
    const picks = nextForArchetype(weekAhead(crowded, MON_7PM), "seeker", 5, MON_7PM);
    // One per day first (Mon, Tue, Sat), then a second on the soonest days.
    expect(ids(picks)).toEqual(["mon-a", "mon-b", "tue-a", "tue-b", "sat-a"]);
    expect(yourWeekHeading(picks, MON_7PM).title).toBe("Your week in Ubud");
  });

  it("says \"Next up for you\" when every pick is on one day, and drops what has ended", () => {
    const tonight = [
      ev({ id: "ended", start_date: "2026-11-09", start_time: "18:00:00", end_time: "18:45:00", category: "Ceremony & Sound" }),
      ev({ id: "started-20-min-ago", start_date: "2026-11-09", start_time: "18:40:00", category: "Ceremony & Sound" }),
      ev({ id: "later", start_date: "2026-11-09", start_time: "21:00:00", category: "Ceremony & Sound" }),
      ev({ id: "too-late-to-join", start_date: "2026-11-09", start_time: "18:00:00", category: "Ceremony & Sound" }),
    ];
    const picks = nextForArchetype(weekAhead(tonight, MON_7PM), "seeker", 5, MON_7PM);
    expect(ids(picks)).toEqual(["started-20-min-ago", "later"]);
    expect(yourWeekHeading(picks, MON_7PM)).toEqual({ title: "Next up for you", line: "Events that suit you, still to come today." });
    expect(yourWeekHeading([ev({ id: "thu", start_date: "2026-11-12" })], MON_7PM).line).toBe("Events that suit you, on Thursday 12 Nov.");
    expect(yourWeekHeading([], MON_7PM).title).toBe("Your week in Ubud");
  });
});

describe("row links", () => {
  it("links the map, the ticket and where we found the listing", () => {
    expect(eventMapHref({ venue_map_url: "https://maps.app.goo.gl/abc", venue_name: "Yoga Barn", venue_address: null })).toBe(
      "https://maps.app.goo.gl/abc"
    );
    expect(eventMapHref({ venue_map_url: null, venue_name: "Yoga Barn", venue_address: null })).toBe(
      "https://www.google.com/maps/search/?api=1&query=Yoga%20Barn%2C%20Ubud"
    );
    expect(eventMapHref({ venue_map_url: null, venue_name: null, venue_address: null })).toBeNull();
    expect(outboundLink({ external_ticket_url: "https://megatix.co.id/x", source_url: null })).toEqual({ href: "https://megatix.co.id/x", label: "Tickets" });
    expect(outboundLink({ external_ticket_url: null, source_url: "https://www.instagram.com/p/abc/" })?.label).toBe("Instagram post");
    expect(outboundLink({ external_ticket_url: "javascript:alert(1)", source_url: null })).toBeNull();
  });
});
