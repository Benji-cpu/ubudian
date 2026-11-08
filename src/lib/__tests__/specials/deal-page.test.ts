import { describe, it, expect } from "vitest";
import {
  venueSlug,
  venuePath,
  dealsForVenue,
  venuePages,
  savingPercent,
  savingText,
  leadDeal,
  soonestFirst,
  venueInUbud,
  offerLine,
  dealPageTitle,
  dealPageDescription,
  fromTheVenue,
  checkedLine,
  sharedCheckedLine,
  redemptionLine,
  howToUse,
  moreDeals,
  mapsHref,
} from "@/lib/specials/deal-page";
import { PUBLIC_SPECIAL_COLUMNS } from "@/lib/specials";
import type { Special } from "@/types";

describe("public columns", () => {
  it("carry the normal price and origin but never the private columns", () => {
    const cols = PUBLIC_SPECIAL_COLUMNS.split(",").map((c) => c.trim());
    const isPrivate = (c: string) => c.startsWith("contact_") || ["confirm_token", "review_note", "research_note"].includes(c);
    expect(cols.filter(isPrivate)).toEqual([]);
    expect(cols).toEqual(expect.arrayContaining(["normal_price_idr", "source", "confirmed_at"]));
  });
});

const base: Special = {
  id: "1",
  venue_name: "Pesona Lounge Ubud",
  venue_area: "Padangtegal",
  venue_address: null,
  google_maps_url: null,
  instagram_handle: null,
  website_url: null,
  title: "x",
  description: null,
  price_idr: null,
  normal_price_idr: null,
  weekdays: [],
  days_stated: true,
  start_time: null,
  end_time: null,
  source: "form",
  source_url: null,
  expires_on: "2026-12-01",
  confirmed_at: "2026-10-15T20:16:05Z",
};

const samosa = { ...base, id: "s", title: "TUESDAY | Samosa Double-Dip", price_idr: 35000, normal_price_idr: 70000, weekdays: [2] };
const curry = { ...base, id: "c", title: "MONDAY | Curry Cure", price_idr: 110000, normal_price_idr: 150000, weekdays: [1] };
const kids = { ...base, id: "k", title: "SUNDAY | Little Guests, Big Smiles", weekdays: [0] };

describe("venue slugs", () => {
  it("comes from the venue name", () => {
    expect(venueSlug("Taman Dukuh Bali Farm Cooking School")).toBe("taman-dukuh-bali-farm-cooking-school");
    expect(venueSlug("RB Warung Coffee & Eatery")).toBe("rb-warung-coffee-eatery");
    expect(venueSlug("Kaveri Spa (The Udaya)")).toBe("kaveri-spa-the-udaya");
  });

  it("folds accents instead of dropping the letter", () => {
    expect(venueSlug("Café Séjour")).toBe("cafe-sejour");
  });

  it("has no path for a name with nothing to slug", () => {
    expect(venuePath("Moksa")).toBe("/deals/moksa");
    expect(venuePath("★ ☆")).toBeNull();
  });

  it("finds every deal at the venue and nothing for an unknown slug", () => {
    const other = { ...base, id: "o", venue_name: "Moksa" };
    const rows = [samosa, other, curry];
    expect(dealsForVenue(rows, "pesona-lounge-ubud").map((d) => d.id)).toEqual(["s", "c"]);
    expect(dealsForVenue(rows, "nowhere")).toEqual([]);
    expect(dealsForVenue(rows, "")).toEqual([]);
  });

  it("lists each venue once for the sitemap, dated by its newest check", () => {
    const rows = [
      { ...samosa, confirmed_at: "2026-10-15T00:00:00Z" },
      { ...curry, confirmed_at: "2026-11-01T00:00:00Z" },
      { ...base, id: "m", venue_name: "Moksa", confirmed_at: "2026-10-27T00:00:00Z" },
    ];
    expect(venuePages(rows)).toEqual([
      { slug: "pesona-lounge-ubud", lastChecked: "2026-11-01T00:00:00Z" },
      { slug: "moksa", lastChecked: "2026-10-27T00:00:00Z" },
    ]);
  });
});

describe("the saving", () => {
  it("rounds down, so we never claim more than the prices say", () => {
    expect(savingPercent(35000, 70000)).toBe(50);
    expect(savingPercent(110000, 150000)).toBe(26);
  });

  it("is no saving without both prices or when the deal costs as much", () => {
    expect(savingPercent(null, 70000)).toBeNull();
    expect(savingPercent(35000, null)).toBeNull();
    expect(savingPercent(70000, 70000)).toBeNull();
    expect(savingPercent(80000, 70000)).toBeNull();
    expect(savingPercent(69900, 70000)).toBeNull();
  });

  it("reads as price vs normal price, or what is known", () => {
    expect(savingText(samosa)).toBe("IDR 35k instead of IDR 70k (save 50%)");
    expect(savingText({ price_idr: 110000, normal_price_idr: null })).toBe("IDR 110k");
    expect(savingText({ price_idr: null, normal_price_idr: 125000 })).toBe("Normally IDR 125k");
    expect(savingText({ price_idr: null, normal_price_idr: null })).toBeNull();
  });
});

describe("which deal leads", () => {
  it("leads with the biggest stated saving, never row order", () => {
    expect(leadDeal([kids, curry, samosa])?.id).toBe("s");
    expect(leadDeal([samosa, kids, curry])?.id).toBe("s");
  });

  it("counts an 'N% off' title as a stated saving", () => {
    const pct = { ...base, id: "p", title: "30% off all spa treatments" };
    expect(leadDeal([kids, pct])?.id).toBe("p");
  });

  it("orders a venue's deals from today on, unknown days last", () => {
    const unknown = { ...base, id: "u", title: "A", days_stated: false };
    const everyDay = { ...base, id: "e", title: "B" };
    // Monday: Monday's curry and the every-day deal, then Tuesday, then Sunday.
    expect(soonestFirst([unknown, kids, samosa, everyDay, curry], 1).map((d) => d.id)).toEqual(["e", "c", "s", "k", "u"]);
  });
});

describe("titles and descriptions", () => {
  it("adds Ubud only when the name doesn't say it", () => {
    expect(venueInUbud("Moksa")).toBe("Moksa, Ubud");
    expect(venueInUbud("Hita Spa Ubud")).toBe("Hita Spa Ubud");
  });

  it("names the offer, dropping the venue's day label", () => {
    expect(offerLine([curry])).toBe("Curry Cure");
    expect(offerLine([kids, curry, samosa])).toBe("Samosa Double-Dip and 2 more deals");
    expect(offerLine([curry, kids])).toBe("Curry Cure and 1 more deal");
  });

  it("titles the page '<offer> at <venue>, Ubud'", () => {
    const moksa = { ...base, venue_name: "Moksa", title: "Free dessert with every main course" };
    expect(dealPageTitle([moksa])).toBe("Free dessert with every main course at Moksa, Ubud");
    expect(dealPageTitle([samosa, curry])).toBe("Samosa Double-Dip and 1 more deal at Pesona Lounge Ubud");
  });

  it("describes the page with the lead deal's own words, clipped", () => {
    expect(dealPageDescription([{ ...curry, description: "Vegetarian curries for less." }])).toBe("Vegetarian curries for less.");
    expect(dealPageDescription([curry])).toBe("Curry Cure");
    const long = dealPageDescription([{ ...curry, description: "word ".repeat(60) }]);
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long.endsWith("…")).toBe(true);
  });
});

describe("what we can say about the check", () => {
  it("says 'checked with the venue' only when the venue gave or agreed the deal", () => {
    expect(fromTheVenue({ source: "form" })).toBe(true);
    expect(fromTheVenue({ source: "admin" })).toBe(true);
    expect(fromTheVenue({ source: "seed" })).toBe(false);
    expect(fromTheVenue({ source: "scout" })).toBe(false);
    expect(fromTheVenue({})).toBe(false);
  });

  it("dates the check in Bali time", () => {
    expect(checkedLine({ source: "form", confirmed_at: "2026-11-08T17:30:00Z" })).toBe("Checked with the venue on 9 Nov");
    expect(checkedLine({ source: "seed", confirmed_at: "2026-10-29T20:24:24Z" })).toBe(
      "From the venue's own page, checked on 30 Oct"
    );
  });

  it("says it once when every deal shares it, else each deal says its own", () => {
    expect(sharedCheckedLine([samosa, curry, kids])).toBe("Checked with the venue on 16 Oct");
    expect(sharedCheckedLine([samosa, { ...curry, confirmed_at: "2026-11-01T00:00:00Z" }])).toBeNull();
    expect(sharedCheckedLine([samosa, { ...curry, source: "seed" }])).toBeNull();
  });
});

describe("how to use it", () => {
  it("is the first sentence that mentions The Ubudian, this page or a booking code", () => {
    expect(
      redemptionLine(
        "Order any burrito bowl and get loaded fries free. Dine-in only: mention The Ubudian or show this page when you order. Wet burritos and a vegan menu."
      )
    ).toBe("Dine-in only: mention The Ubudian or show this page when you order.");
    expect(redemptionLine("Book with code UTS11. Valid until the end of November 2026.")).toBe("Book with code UTS11.");
    expect(redemptionLine("Show this page at the counter.")).toBe("Show this page at the counter.");
    expect(redemptionLine("Book on their website with code KAV30; paid in full in advance.")).toBe(
      "Book on their website with code KAV30; paid in full in advance."
    );
    expect(redemptionLine("Say the ubudian sent you. Then order.")).toBe("Say the ubudian sent you.");
  });

  it("keeps a sentence whole across prices, brackets and street abbreviations", () => {
    expect(
      redemptionLine(
        "Mention The Ubudian when you book and pay USD 33.75 per person instead of USD 45. Balinese cooking classes with a market tour."
      )
    ).toBe("Mention The Ubudian when you book and pay USD 33.75 per person instead of USD 45.");
    expect(
      redemptionLine("Mention The Ubudian when you order and get a dessert free (normally IDR 20,000 each). Rice field view.")
    ).toBe("Mention The Ubudian when you order and get a dessert free (normally IDR 20,000 each).");
    expect(redemptionLine("Open daily on Jl. Raya Pengosekan No. 12. Show this page at the till.")).toBe("Show this page at the till.");
    expect(redemptionLine("Show this page at our Jl. Raya Ubud shop. Open daily.")).toBe("Show this page at our Jl. Raya Ubud shop.");
    expect(redemptionLine("Free dessert.\nMention The Ubudian when you order")).toBe("Mention The Ubudian when you order");
  });

  it("is null when the deal never says how to claim it through us", () => {
    expect(redemptionLine("Vegetarian curries for IDR 110k plus tax and service (normally IDR 150k), on Mondays.")).toBeNull();
    expect(redemptionLine("Free cheese fries for children on Sundays. Ask the staff how it works when you order.")).toBeNull();
    expect(redemptionLine("Smart casual dress code applies. Free dessert with every main.")).toBeNull();
    expect(redemptionLine("A true Ubudian favourite.")).toBeNull();
    expect(redemptionLine("")).toBeNull();
    expect(redemptionLine(null)).toBeNull();
    expect(redemptionLine(undefined)).toBeNull();
  });

  const cilantro = {
    ...base,
    venue_name: "Cilantro Mexican Restaurant",
    title: "Free loaded fries with any burrito bowl",
    description: "Order any burrito bowl and get loaded fries free. Dine-in only: mention The Ubudian or show this page when you order.",
    source: "admin",
  };

  it("says the deal's own line, once, and nothing when no deal has one", () => {
    expect(howToUse([cilantro])).toEqual([
      { deal: null, line: "Dine-in only: mention The Ubudian or show this page when you order." },
    ]);
    // Pesona agreed no mention: none of its deals says how to claim it through us.
    const pesona = [
      { ...curry, description: "Vegetarian curries for IDR 110k plus tax and service (normally IDR 150k), on Mondays." },
      { ...samosa, description: "Buy one order of samosas and get a second one free, on Tuesdays." },
      { ...kids, description: "Free cheese fries for children on Sundays. Ask the staff how it works when you order." },
    ];
    expect(howToUse(pesona)).toEqual([]);
    expect(howToUse([{ ...cilantro, description: null }])).toEqual([]);
  });

  it("never gives a box to a deal read off the venue's own page, whatever its text says", () => {
    const kaveri = { ...base, title: "30% off spa treatments", description: "Book on their website with code KAV30.", source: "seed" };
    expect(howToUse([kaveri])).toEqual([]);
    expect(howToUse([{ ...cilantro, source: "scout" }])).toEqual([]);
    expect(howToUse([{ ...cilantro, source: "instagram" }])).toEqual([]);
  });

  it("names each deal when a venue's deals don't all say the same", () => {
    const mention = "Mention The Ubudian when you order.";
    const withLine = { ...samosa, description: `Buy one, get one free. ${mention}` };
    expect(howToUse([withLine, { ...curry, description: mention }])).toEqual([{ deal: null, line: mention }]);
    expect(howToUse([withLine, curry])).toEqual([{ deal: "Samosa Double-Dip", line: mention }]);
    expect(howToUse([withLine, { ...curry, description: "Book with code CURRY20." }])).toEqual([
      { deal: "Samosa Double-Dip", line: mention },
      { deal: "Curry Cure", line: "Book with code CURRY20." },
    ]);
  });
});

describe("more deals", () => {
  const venues = ["Bam Bam", "Cilantro", "Hita Spa", "Moksa", "RB Warung"].map((v, i) => ({
    ...base,
    id: `v${i}`,
    venue_name: v,
  }));

  it("shows up to three other venues, one deal each, never this one", () => {
    const rows = [...venues, samosa, curry, { ...venues[1], id: "v1b", title: "50% off lunch" }];
    const picked = moreDeals(rows, "moksa");
    expect(picked).toHaveLength(3);
    expect(picked.map((d) => d.venue_name)).not.toContain("Moksa");
    expect(new Set(picked.map((d) => d.venue_name)).size).toBe(3);
    // A venue with two deals shows its lead one.
    const cilantro = moreDeals(rows, "x", 10).find((d) => d.venue_name === "Cilantro");
    expect(cilantro?.id).toBe("v1b");
  });

  it("is the same list for one page and a different start for another", () => {
    expect(moreDeals(venues, "moksa")).toEqual(moreDeals([...venues].reverse(), "moksa"));
    const starts = new Set(["a", "b", "c", "d", "e", "f"].map((s) => moreDeals(venues, s)[0].venue_name));
    expect(starts.size).toBeGreaterThan(1);
  });

  it("is empty when this is the only venue", () => {
    expect(moreDeals([samosa, curry], "pesona-lounge-ubud")).toEqual([]);
  });
});

describe("directions", () => {
  it("uses the venue's own Maps link, else a search, and never an unsafe link", () => {
    expect(mapsHref({ ...base, google_maps_url: "https://maps.app.goo.gl/abc" })).toBe("https://maps.app.goo.gl/abc");
    expect(mapsHref({ ...base, google_maps_url: "javascript:alert(1)" })).toContain("google.com/maps/search");
    expect(mapsHref(base)).toBe(
      "https://www.google.com/maps/search/?api=1&query=Pesona%20Lounge%20Ubud%2C%20Padangtegal%2C%20Ubud"
    );
  });
});
