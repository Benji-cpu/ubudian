import { describe, expect, it } from "vitest";
import { buildWeeklyDigestEmailHtml } from "@/lib/email/weekly-digest-email";
import type { Event } from "@/types";

const ev = (id: string, extra: Partial<Event> = {}) =>
  ({ id, slug: id, title: `Event ${id}`, start_date: "2026-10-14", start_time: "18:00", end_time: null, venue_name: "Moksa", short_description: null, description: "", ...extra }) as Event;

const base = { archetype: null, siteUrl: "https://theubudian.life", unsubUrl: "https://x/u", weekLabel: "Week of 14 October" };

describe("weekly email with the events desk's picks", () => {
  it("keeps today's layout when there are no picks", () => {
    const html = buildWeeklyDigestEmailHtml({ ...base, events: [ev("a"), ev("b")] });
    expect(html).not.toContain("This week's picks");
    expect(html).not.toContain("Also on this week");
    expect(html).toContain("Event a");
  });

  it("shows picks with their why, then a short 'Also on' without repeats", () => {
    const events = [ev("a"), ev("b"), ev("c"), ev("d"), ev("e"), ev("f")];
    const html = buildWeeklyDigestEmailHtml({ ...base, events, picks: [{ event: events[0], why: "A rare teacher in town for one week." }] });
    expect(html).toContain("This week's picks");
    expect(html).toContain("A rare teacher in town for one week.");
    expect(html).toContain("Also on this week");
    expect(html.match(/Event a</g)).toHaveLength(1);
    expect((html.match(/href="https:\/\/theubudian.life\/events\//g) ?? []).length).toBe(4); // 1 pick + 3 also-on
  });

  it("escapes the why", () => {
    const e = ev("a");
    const html = buildWeeklyDigestEmailHtml({ ...base, events: [e], picks: [{ event: e, why: "<b>bold</b>" }] });
    expect(html).not.toContain("<b>bold</b>");
  });
});
