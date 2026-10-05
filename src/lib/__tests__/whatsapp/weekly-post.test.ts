import { describe, it, expect } from "vitest";
import { buildWeeklyPost, buildTodayPost, MAX_GATHERINGS } from "@/lib/whatsapp/weekly-post";
import type { Special } from "@/types";

const special = (over: Partial<Special>): Special => ({
  id: "1",
  venue_name: "Blue Door",
  venue_area: null,
  venue_address: null,
  google_maps_url: null,
  instagram_handle: null,
  website_url: null,
  title: "Pasta + wine",
  description: null,
  price_idr: 135000,
  weekdays: [2],
  days_stated: true,
  start_time: "17:00:00",
  end_time: "21:00:00",
  source_url: "https://thebluedoorbali.com/specials",
  expires_on: "2026-11-04",
  confirmed_at: "2026-10-05T00:00:00Z",
  ...over,
});

const event = (
  over: Partial<{ title: string; start_date: string; start_time: string | null; is_recurring: boolean; venue_name: string | null }>
) => ({
  title: "Ecstatic Dance",
  venue_name: "Paradiso",
  start_date: "2026-10-06",
  start_time: "19:00:00",
  is_recurring: false,
  ...over,
});

// Monday 5 Oct 2026, 16:00 Bali.
const now = { dateStr: "2026-10-05", dayOfWeek: 1, timeMinutes: 16 * 60 };
const base = { now, siteUrl: "https://theubudian.life" };

describe("buildWeeklyPost", () => {
  it("lists a deal with its days, hours and price, and links the site without the scheme", () => {
    const post = buildWeeklyPost({ ...base, specials: [special({})], events: [] });
    expect(post).toContain("*This week in Ubud* · Mon 5 Oct – Sun 11 Oct");
    expect(post).toContain("• *Blue Door*: Pasta + wine (IDR 135k), Tue 17:00–21:00");
    expect(post).toContain("Free. Every deal links to where we found it: theubudian.life/deals");
    expect(post).not.toContain("https://");
  });

  it("shows one deal per venue, so no venue fills the post", () => {
    const post = buildWeeklyPost({
      ...base,
      specials: [
        special({ id: "a", title: "Pasta night" }),
        special({ id: "b", title: "Burger night", weekdays: [3] }),
        special({ id: "c", venue_name: "Indus", title: "Two cocktails", weekdays: [] }),
      ],
      events: [],
    });
    expect(post.match(/\*Blue Door\*/g)).toHaveLength(1);
    expect(post).toContain("*Indus*: Two cocktails (IDR 135k), every day");
  });

  it("never prints a deal whose source gives no days, or one with no source", () => {
    const post = buildWeeklyPost({
      ...base,
      specials: [
        special({ venue_name: "Undated", weekdays: [], days_stated: false }),
        special({ venue_name: "Unsourced", source_url: null }),
      ],
      events: [],
    });
    expect(post).not.toContain("Undated");
    expect(post).not.toContain("Unsourced");
    expect(post).toContain("Nothing listed yet this week");
  });

  it("keeps only the next 7 days of gatherings, in date order", () => {
    const post = buildWeeklyPost({
      ...base,
      specials: [],
      events: [
        event({ title: "Later", start_date: "2026-10-09" }),
        event({ title: "Sooner", start_date: "2026-10-06" }),
        event({ title: "Too far", start_date: "2026-10-12" }),
      ],
    });
    expect(post.indexOf("Sooner")).toBeLessThan(post.indexOf("Later"));
    expect(post).not.toContain("Too far");
  });

  it("picks one-offs before weekly rhythms when there are too many", () => {
    const weekly = Array.from({ length: MAX_GATHERINGS }, (_, i) =>
      event({ title: `Weekly ${i}`, is_recurring: true, start_date: "2026-10-06" }),
    );
    const post = buildWeeklyPost({
      ...base,
      specials: [],
      events: [...weekly, event({ title: "Full moon ceremony", start_date: "2026-10-10" })],
    });
    expect(post).toContain("Full moon ceremony");
    expect(post).toContain("…and 1 more");
  });
});

describe("buildTodayPost", () => {
  const row = (over: Partial<Special>) =>
    special({ venue_name: "Lokal", title: "Arak shot", price_idr: null, weekdays: [1], start_time: "18:00:00", end_time: "20:00:00", ...over });

  it("keeps today's deals that haven't finished, one per venue, and gatherings you can still get to", () => {
    const post = buildTodayPost({
      ...base,
      specials: [
        row({}),
        row({ id: "2", title: "Second Lokal deal" }),
        row({ venue_name: "Tuesday Only", weekdays: [2] }),
        row({ venue_name: "Lunch", start_time: "11:00:00", end_time: "15:00:00" }),
        row({ venue_name: "Undated", weekdays: [], days_stated: false }),
      ],
      events: [
        event({ title: "Tea Ceremony", start_date: "2026-10-05", start_time: "17:00:00" }),
        event({ title: "Morning Yoga", start_date: "2026-10-05", start_time: "09:00:00" }),
        event({ title: "Tomorrow", start_date: "2026-10-06" }),
      ],
    });
    expect(post).toContain("*Ubud deals today* · Monday 5 October");
    expect(post).toContain("• *Lokal*: Arak shot, 18:00–20:00");
    expect(post).not.toContain("Second Lokal deal");
    expect(post).not.toContain("Tuesday Only");
    expect(post).not.toContain("Lunch");
    expect(post).not.toContain("Undated");
    expect(post).toContain("Tea Ceremony");
    expect(post).not.toContain("Morning Yoga");
    expect(post).not.toContain("Tomorrow");
    expect(post).toContain("Free. Every deal links to where we found it");
  });
});
