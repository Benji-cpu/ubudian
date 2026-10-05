import { describe, expect, it } from "vitest";
import { buildDealsBlockHtml, buildPreheader, dealBlurb, dealSourceUrl, issueNumberFor, pickWeeklyDeals } from "@/lib/email/weekly-deals";
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
    source_url: null,
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
  it("prefers the deal's own source, then the website, Instagram, Maps", () => {
    expect(dealSourceUrl(deal({ source_url: "https://venue.example/happy-hour" }))).toBe(
      "https://venue.example/happy-hour"
    );
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

  it("leaves out deals whose days we don't know", () => {
    const picked = pickWeeklyDeals([deal({ venue_name: "CP Lounge", days_stated: false })], tuesday);
    expect(picked).toHaveLength(0);
  });

  it("puts particular-day deals first, spread from the send day, then every day, happy hours last", () => {
    const picked = pickWeeklyDeals(
      [
        deal({ venue_name: "HH one", title: "Happy hour", weekdays: [] }),
        deal({ venue_name: "Every day tea", title: "Afternoon tea", weekdays: [] }),
        deal({ venue_name: "Milk & Madu", title: "2-for-1 pizza", weekdays: [0, 2] }),
        deal({ venue_name: "Kraton", title: "All you can eat", weekdays: [1, 4] }),
        deal({ venue_name: "Melali", title: "GINtastic", weekdays: [4] }),
      ],
      tuesday
    );
    expect(picked.map((d) => d.venue_name)).toEqual([
      "Milk & Madu", // Tue (today)
      "Kraton", // Thu, first of the Thu pair alphabetically
      "Melali", // Thu, second round
      "Every day tea",
      "HH one",
    ]);
  });

  it("caps plain happy hours at two", () => {
    const picked = pickWeeklyDeals(
      Array.from({ length: 5 }, (_, i) => deal({ venue_name: `Bar ${i}`, title: "Happy hour" })),
      tuesday
    );
    expect(picked).toHaveLength(2);
  });

  it("prefers a venue's distinctive deal over its happy hour", () => {
    const picked = pickWeeklyDeals(
      [
        deal({ venue_name: "Blue Door", title: "Happy hour" }),
        deal({ venue_name: "Blue Door", title: "Taco Tuesday", weekdays: [2] }),
      ],
      tuesday
    );
    expect(picked.map((d) => d.title)).toEqual(["Taco Tuesday"]);
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

describe("dealBlurb", () => {
  it("drops a description that is only the source note", () => {
    expect(dealBlurb({ title: "Happy hour", description: "Happy hour (Finn's guide, 24 Aug 2026)." })).toBeNull();
    expect(dealBlurb({ title: "Happy hour", description: "Happy hour (Finn's guide)." })).toBeNull();
  });
  it("keeps a real one", () => {
    const d = "Buy one pizza, get one free, all evening on the terrace.";
    expect(dealBlurb({ title: "2-for-1 pizza", description: d })).toBe(d);
  });
});

describe("buildPreheader", () => {
  it("names the first two deals and counts the events", () => {
    expect(
      buildPreheader(
        [
          deal({ venue_name: "Milk & Madu", title: "2-for-1 pizza", weekdays: [0, 2] }),
          deal({ venue_name: "Kraton", title: "all-you-can-eat", weekdays: [1, 4] }),
        ],
        5
      )
    ).toBe("2-for-1 pizza at Milk & Madu on Sun and Tue; all-you-can-eat at Kraton on Mon and Thu. Plus 5 things on in Ubud this week.");
  });
});

describe("buildPreheader day wording", () => {
  it("lowercases weekdays but keeps a day name's capital", () => {
    expect(buildPreheader([deal({ title: "Brunch", venue_name: "A", weekdays: [1, 2, 3, 4, 5] })], 0)).toBe("Brunch at A on weekdays.");
    expect(buildPreheader([deal({ title: "Roast", venue_name: "B", weekdays: [0] })], 0)).toBe("Roast at B on Sun.");
    expect(buildPreheader([deal({ title: "Sunday cookout", venue_name: "C", weekdays: [0] })], 2)).toBe("Sunday cookout at C. Plus 2 things on in Ubud this week.");
  });
});

describe("dealBlurb source note", () => {
  it("strips a trailing source note from a real description", () => {
    expect(
      dealBlurb({ title: "Brunch", description: "IDR 400k a person; beer and cocktail add-ons (Honeycombers, 5 Jan 2026)." })
    ).toBe("IDR 400k a person; beer and cocktail add-ons.");
  });
});

describe("buildDealsBlockHtml", () => {
  it("says once that prices often add tax and service", () => {
    const html = buildDealsBlockHtml([deal({ price_idr: 95000 }), deal({ venue_name: "B", price_idr: 80000 })], "https://theubudian.life");
    expect(html.match(/often add tax and service/g)).toHaveLength(1);
  });
  it("leaves the note out when no price is shown", () => {
    const html = buildDealsBlockHtml([deal({ title: "2-for-1 pizza", price_idr: null, description: null })], "https://theubudian.life");
    expect(html).not.toContain("tax and service");
  });

  it("is empty with no deals", () => {
    expect(buildDealsBlockHtml([], "https://theubudian.life")).toBe("");
  });

  it("shows 12-hour times, no source line, and escapes text", () => {
    const html = buildDealsBlockHtml(
      [deal({ title: "Tacos <b>2-for-1</b>", weekdays: [0, 2], price_idr: 135000 })],
      "https://theubudian.life"
    );
    expect(html).toContain("This week's deals");
    expect(html).not.toContain("checked");
    expect(html).toContain("Sun, Tue · 4 PM – 6 PM · IDR 135k");
    expect(html).not.toContain("<b>2-for-1</b>");
    expect(html).toContain("https://theubudian.life/deals");
  });
});

describe("issue rotation", () => {
  it("numbers issues from Wed 7 Oct 2026, whichever weekday the run lands", () => {
    expect(issueNumberFor("2026-10-07")).toBe(0);
    expect(issueNumberFor("2026-10-06")).toBe(0);
    expect(issueNumberFor("2026-10-14")).toBe(1);
    expect(issueNumberFor("2026-10-21")).toBe(2);
  });

  it("gives the next issue different deals when there are enough", () => {
    const pool = Array.from({ length: 12 }, (_, i) =>
      deal({ venue_name: `V${String(i).padStart(2, "0")}`, title: "Taco night", weekdays: [i % 7] })
    );
    const first = pickWeeklyDeals(pool, 3, 6, 0).map((d) => d.venue_name);
    const second = pickWeeklyDeals(pool, 3, 6, 1).map((d) => d.venue_name);
    expect(second.filter((v) => first.includes(v))).toHaveLength(0);
    expect(pickWeeklyDeals(pool, 3, 6)).toEqual(pickWeeklyDeals(pool, 3, 6, 0));
  });
});
