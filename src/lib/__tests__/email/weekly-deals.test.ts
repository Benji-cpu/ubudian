import { describe, expect, it } from "vitest";
import { buildDealsBlockHtml, dealSourceUrl, pickWeeklyDeals } from "@/lib/email/weekly-deals";
import type { Special } from "@/types";

function deal(overrides: Partial<Special>): Special {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    venue_name: "Venue",
    venue_area: "Ubud",
    venue_address: null,
    google_maps_url: null,
    instagram_handle: null,
    website_url: "https://venue.example",
    title: "2-for-1 cocktails",
    description: null,
    price_idr: null,
    weekdays: [],
    start_time: "16:00",
    end_time: "18:00",
    expires_on: "2026-11-01",
    confirmed_at: "2026-10-03T02:00:00Z",
    ...overrides,
  };
}

describe("dealSourceUrl", () => {
  it("prefers the website, then Instagram, then Maps", () => {
    expect(dealSourceUrl(deal({}))).toBe("https://venue.example");
    expect(dealSourceUrl(deal({ website_url: null, instagram_handle: "@milkmadu" }))).toBe(
      "https://www.instagram.com/milkmadu/"
    );
    expect(dealSourceUrl(deal({ website_url: null, google_maps_url: "https://maps.app/x" }))).toBe(
      "https://maps.app/x"
    );
    expect(dealSourceUrl(deal({ website_url: null }))).toBeNull();
  });
});

describe("pickWeeklyDeals", () => {
  const tuesday = 2;

  it("drops deals with no public source", () => {
    const picked = pickWeeklyDeals([deal({ website_url: null, venue_name: "No source" })], tuesday);
    expect(picked).toHaveLength(0);
  });

  it("orders soonest from the send day, every-day deals as today", () => {
    const picked = pickWeeklyDeals(
      [
        deal({ venue_name: "Monday place", weekdays: [1] }),
        deal({ venue_name: "Every day", weekdays: [] }),
        deal({ venue_name: "Thursday place", weekdays: [4] }),
        deal({ venue_name: "Tuesday place", weekdays: [2] }),
      ],
      tuesday
    );
    expect(picked.map((d) => d.venue_name)).toEqual([
      "Every day",
      "Tuesday place",
      "Thursday place",
      "Monday place",
    ]);
  });

  it("keeps one deal per venue and respects the limit", () => {
    const picked = pickWeeklyDeals(
      [
        deal({ venue_name: "Milk & Madu", title: "A" }),
        deal({ venue_name: "milk & madu ", title: "B" }),
        ...Array.from({ length: 10 }, (_, i) => deal({ venue_name: `V${i}` })),
      ],
      tuesday,
      4
    );
    expect(picked).toHaveLength(4);
    expect(picked.filter((d) => d.venue_name.trim().toLowerCase() === "milk & madu")).toHaveLength(1);
  });
});

describe("buildDealsBlockHtml", () => {
  it("is empty with no deals", () => {
    expect(buildDealsBlockHtml([], "https://theubudian.life")).toBe("");
  });

  it("shows the source link, the checked date and escapes text", () => {
    const html = buildDealsBlockHtml(
      [deal({ title: "Tacos <b>2-for-1</b>", weekdays: [0, 2], price_idr: 135000 })],
      "https://theubudian.life"
    );
    expect(html).toContain("This week's deals");
    expect(html).toContain('href="https://venue.example"');
    expect(html).toContain("checked 3 Oct");
    expect(html).toContain("Sun, Tue · 16:00–18:00 · IDR 135k");
    expect(html).not.toContain("<b>2-for-1</b>");
    expect(html).toContain("https://theubudian.life/tonight");
  });
});
