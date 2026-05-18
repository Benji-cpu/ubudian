import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSponsorPriceId } from "@/lib/stripe/sponsor-pricing";

const ORIGINAL = {
  patron: process.env.STRIPE_PRICE_SPONSOR_PATRON,
  partner: process.env.STRIPE_PRICE_SPONSOR_PARTNER,
  anchor: process.env.STRIPE_PRICE_SPONSOR_ANCHOR,
};

describe("getSponsorPriceId", () => {
  beforeEach(() => {
    delete process.env.STRIPE_PRICE_SPONSOR_PATRON;
    delete process.env.STRIPE_PRICE_SPONSOR_PARTNER;
    delete process.env.STRIPE_PRICE_SPONSOR_ANCHOR;
  });

  afterEach(() => {
    if (ORIGINAL.patron != null) process.env.STRIPE_PRICE_SPONSOR_PATRON = ORIGINAL.patron;
    if (ORIGINAL.partner != null) process.env.STRIPE_PRICE_SPONSOR_PARTNER = ORIGINAL.partner;
    if (ORIGINAL.anchor != null) process.env.STRIPE_PRICE_SPONSOR_ANCHOR = ORIGINAL.anchor;
  });

  it("returns null when env var is unset", () => {
    expect(getSponsorPriceId("patron")).toBeNull();
    expect(getSponsorPriceId("partner")).toBeNull();
    expect(getSponsorPriceId("anchor")).toBeNull();
  });

  it("returns env value for each tier", () => {
    process.env.STRIPE_PRICE_SPONSOR_PATRON = "price_patron_x";
    process.env.STRIPE_PRICE_SPONSOR_PARTNER = "price_partner_x";
    process.env.STRIPE_PRICE_SPONSOR_ANCHOR = "price_anchor_x";

    expect(getSponsorPriceId("patron")).toBe("price_patron_x");
    expect(getSponsorPriceId("partner")).toBe("price_partner_x");
    expect(getSponsorPriceId("anchor")).toBe("price_anchor_x");
  });

  it("trims whitespace from env values", () => {
    process.env.STRIPE_PRICE_SPONSOR_PATRON = "  price_patron_y  ";
    expect(getSponsorPriceId("patron")).toBe("price_patron_y");
  });

  it("treats whitespace-only env value as null", () => {
    process.env.STRIPE_PRICE_SPONSOR_PATRON = "   ";
    expect(getSponsorPriceId("patron")).toBeNull();
  });
});
