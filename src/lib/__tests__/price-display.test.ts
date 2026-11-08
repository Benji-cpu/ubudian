import { describe, it, expect } from "vitest";
import { CHECK_WITH_ORGANISER, displayPrice, formatAmountRange } from "../price-display";

const show = (s: string | null) => {
  const d = displayPrice(s);
  return d.note ? `${d.label} · ${d.note}` : d.label;
};

describe("displayPrice: one amount", () => {
  it("shows every format the sources use the same way", () => {
    expect(show("IDR 170,000")).toBe("IDR 170k");
    expect(show("Rp 90K")).toBe("IDR 90k");
    expect(show("IDR 90000")).toBe("IDR 90k");
    expect(show("350,000 IDR")).toBe("IDR 350k");
    expect(show("Rp 100.000 ")).toBe("IDR 100k");
    expect(show("Rp. 150.000")).toBe("IDR 150k");
    expect(show("INVESTMENT 200K")).toBe("IDR 200k");
  });

  it("rounds odd converted amounts to the nearest 5k", () => {
    expect(show("Rp 194,174")).toBe("IDR 195k");
    expect(show("IDR 194174")).toBe("IDR 195k");
    expect(show("Rp 175,100")).toBe("IDR 175k");
    expect(show("Rp 257,500")).toBe("IDR 260k");
    // A whole-thousand price is the venue's own: left as it is.
    expect(show("Rp 206K")).toBe("IDR 206k");
  });

  it("shows millions short", () => {
    expect(show("Rp 3.5M")).toBe("IDR 3.5M");
    expect(show("IDR 12,000,000")).toBe("IDR 12M");
    expect(show("IDR 5880000")).toBe("IDR 5.88M");
    expect(show("71.490.000")).toBe("IDR 71.49M");
  });

  it("keeps other currencies as they are", () => {
    expect(show("$85")).toBe("USD 85");
    expect(show("$1,345")).toBe("USD 1,345");
    expect(show("USD 3222")).toBe("USD 3,222");
  });
});

describe("displayPrice: ranges", () => {
  it("shows a range as IDR 100-150k", () => {
    expect(show("Rp 100,000 - Rp 150,000")).toBe("IDR 100-150k");
    expect(show("Rp 100-150k")).toBe("IDR 100-150k");
    expect(show("Rp 463,500 - Rp 515,000")).toBe("IDR 465-515k");
    expect(show("Rp 900,000 - Rp 1,100,000")).toBe("IDR 900k-1.1M");
    expect(show("Rp 3,800,000 - Rp 4,200,000")).toBe("IDR 3.8-4.2M");
    expect(show("$100 - 150")).toBe("USD 100-150");
  });

  it("names the tiers in small type when each has a name", () => {
    expect(show("IDR 150,000 early bird / IDR 200,000 at the door")).toBe("IDR 150-200k · early bird / at the door");
    expect(show("Early Bird: 300K | Presale: 350K | At the door 450K")).toBe("IDR 300-450k · early bird / presale / at the door");
    expect(show("IDR 150,000 presale / IDR 180,000–200,000 at the door")).toBe("IDR 150-200k · presale / at the door");
    expect(show("IDR 150,000 (local KITAS) / IDR 200,000 (visitors)")).toBe("IDR 150-200k · local KITAS / visitors");
  });

  it("leaves the names out when one price has none, so words never describe the wrong price", () => {
    expect(show("150k, 100k before 5PM (guest list)")).toBe("IDR 100-150k");
  });

  it("leaves passes, bundles and add-ons out of the price to get in", () => {
    expect(show("Drop-in IDR 180K | 5 passes IDR 700K")).toBe("IDR 180k · drop-in");
    expect(show("IDR 150,000 drop-in / IDR 600,000 for 5-class pass")).toBe("IDR 150k · drop-in");
    expect(show("IDR 250K single session / IDR 200K KITAS. 3-Pass Bundle: IDR 650K / IDR 500K KITAS")).toBe(
      "IDR 200-250k · single session / KITAS"
    );
    expect(show("IDR 150k (Kitas) / 200k (visitors) for dance; +80k for sauna/pool/fire circle")).toBe(
      "IDR 150-200k · KITAS / visitors for dance"
    );
    expect(show("IDR 150,000 (local KITAS) / IDR 200,000 (visitors). Optional sauna + pool + fire circle +80,000.")).toBe(
      "IDR 150-200k · local KITAS / visitors"
    );
  });
});

describe("displayPrice: small print", () => {
  it("lets text such as online / walk-in follow the price", () => {
    expect(displayPrice("IDR 170,000 online / walk-in")).toEqual({
      kind: "amount",
      label: "IDR 170k",
      note: "online / walk-in",
      amount: { min: 170_000, max: 170_000, currency: "IDR" },
    });
    expect(show("IDR 150k (cash only)")).toBe("IDR 150k · cash only");
    expect(show("500,000 IDR per couple (advance booking)")).toBe("IDR 500k · per couple (advance booking)");
  });

  it("says when the listing only gives an estimate", () => {
    expect(show("IDR 400,000 approx. — confirm and book ahead at pyramidsofchi.com (sells out monthly)")).toBe("About IDR 400k");
    expect(show("Approx IDR 150,000–250,000 (venue drop-in rate; confirm at door)")).toBe(
      "About IDR 150-250k · venue drop-in rate; confirm at door"
    );
  });

  it("drops filler and anything that runs on", () => {
    expect(show("IDR 400,000 per person — advance booking essential, sells out monthly")).toBe("IDR 400k");
    expect(show("IDR 200k early bird / IDR 250k presale / IDR 300k at door — available at Dragon Tea Temple and Megatix")).toBe(
      "IDR 200-300k · early bird / presale / at door"
    );
  });
});

describe("displayPrice: donation and free", () => {
  it("calls every pay-what-you-like price By donation", () => {
    for (const s of ["Donation", "By donation", "donation-based", "Pay what you feel", "pay what you can", "Pay what you want"]) {
      expect(displayPrice(s)).toEqual({ kind: "donation", label: "By donation", note: null });
    }
  });

  it("keeps a suggested or minimum amount as small print", () => {
    expect(show("Donation · Suggested Rp 100K")).toBe("By donation · suggested IDR 100k");
    expect(show("Donation · Min. Rp 100K")).toBe("By donation · at least IDR 100k");
  });

  it("does not read a facilitator's name as a price", () => {
    // "Karunika" is the DJ who runs two dances; the only price text naming her was a promo code.
    expect(displayPrice("Discount 10% promo: KARUNIKA").label).toBe(CHECK_WITH_ORGANISER);
  });

  it("keeps Free as Free", () => {
    expect(displayPrice("Free")).toEqual({ kind: "free", label: "Free", note: null });
    expect(displayPrice("Free entry").label).toBe("Free");
    expect(displayPrice("gratis").label).toBe("Free");
  });

  it("is not free when it costs something, or when free is part of another word", () => {
    expect(show("Free for locals / IDR 100k visitors")).toBe("IDR 100k · free for locals / visitors");
    expect(displayPrice("phone-free dance, IDR 150k").kind).toBe("amount");
    expect(displayPrice("gluten-free lunch included").kind).toBe("unknown");
  });
});

describe("displayPrice: anything else", () => {
  it("falls back to Check with the organiser and never shows the raw string", () => {
    for (const s of [null, "", "  ", "TBA", "20% OFF", "Early bird tickets available", "Early contribution price for first 10 people", "Karunika"]) {
      expect(displayPrice(s)).toEqual({ kind: "unknown", label: CHECK_WITH_ORGANISER, note: null });
    }
  });

  it("treats an amount no event could cost as unknown", () => {
    expect(displayPrice("Rp 1.2K").label).toBe(CHECK_WITH_ORGANISER);
    expect(displayPrice("Rp 100M").label).toBe(CHECK_WITH_ORGANISER);
  });
});

describe("formatAmountRange", () => {
  it("writes one amount once", () => {
    expect(formatAmountRange(150_000, 150_000)).toBe("IDR 150k");
    expect(formatAmountRange(150_000, 152_000)).toBe("IDR 150-152k");
  });
});

describe("the amounts behind the label", () => {
  it("are the rounded amounts the reader sees, for structured data", () => {
    expect(displayPrice("Rp 194,174").amount).toEqual({ min: 195_000, max: 195_000, currency: "IDR" });
    expect(displayPrice("Rp 300,000 - Rp 350,000").amount).toEqual({ min: 300_000, max: 350_000, currency: "IDR" });
    expect(displayPrice("$85").amount).toEqual({ min: 85, max: 85, currency: "USD" });
    expect(displayPrice("By donation").amount).toBeUndefined();
  });
});
