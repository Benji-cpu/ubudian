import { describe, it, expect } from "vitest";
import { baliDateTime, eventJsonLd, jsonLdScript } from "@/lib/events/event-jsonld";
import { hubListEvents } from "@/components/hubs/hub-json-ld";
import type { Event } from "@/types";

const base = {
  id: "1",
  title: "Ecstatic Dance",
  slug: "ecstatic-dance",
  short_description: "Barefoot, phone-free.",
  cover_image_url: null,
  venue_name: "Paradiso Ubud",
  venue_address: null,
  start_date: "2026-11-12",
  end_date: null,
  start_time: "19:00:00",
  end_time: "21:30:00",
  price_info: "IDR 170,000 online / walk-in",
  external_ticket_url: "https://megatix.co.id/events/dance",
  organizer_name: null,
  latitude: null,
  longitude: null,
} as unknown as Event;

describe("eventJsonLd", () => {
  it("dates the occurrence in Bali time and links its event page", () => {
    const ld = eventJsonLd(base, "https://theubudian.life");
    expect(ld).toMatchObject({
      "@type": "Event",
      name: "Ecstatic Dance",
      startDate: "2026-11-12T19:00:00+08:00",
      endDate: "2026-11-12T21:30:00+08:00",
      url: "https://theubudian.life/events/ecstatic-dance",
      location: { "@type": "Place", name: "Paradiso Ubud", address: { addressLocality: "Ubud", addressCountry: "ID" } },
      offers: { "@type": "Offer", price: 170000, priceCurrency: "IDR", url: "https://megatix.co.id/events/dance" },
    });
  });

  it("still names a location when the venue is unknown, because Google rejects an Event without one", () => {
    const ld = eventJsonLd({ ...base, venue_name: null } as unknown as Event, "https://theubudian.life");
    expect(ld.location).toMatchObject({ "@type": "Place", name: "Ubud", address: { addressLocality: "Ubud", addressCountry: "ID" } });
  });

  it("prices a range, Free and nothing the way the page does", () => {
    expect(eventJsonLd({ ...base, price_info: "Rp 300,000 - Rp 350,000" }).offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: 300000,
      highPrice: 350000,
    });
    expect(eventJsonLd({ ...base, price_info: "Free" }).offers).toMatchObject({ price: 0 });
    expect(eventJsonLd({ ...base, price_info: "TBA" }).offers).toBeUndefined();
    expect(eventJsonLd({ ...base, price_info: "By donation" }).offers).toBeUndefined();
  });

  it("ends an overnight event the next day and keeps an untimed date a date", () => {
    expect(eventJsonLd({ ...base, start_time: "22:00:00", end_time: "02:00:00" }).endDate).toBe("2026-11-13T02:00:00+08:00");
    const untimed = eventJsonLd({ ...base, start_time: null, end_time: null });
    expect(untimed.startDate).toBe("2026-11-12");
    expect(untimed.endDate).toBeUndefined();
  });

  it("writes times with seconds", () => {
    expect(baliDateTime("2026-11-12", "7:05")).toBe("2026-11-12T07:05:00+08:00");
  });
});

describe("jsonLdScript", () => {
  it("can't be closed early by a title", () => {
    const out = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

describe("hubListEvents", () => {
  it("dates a weekly class at its next occurrence, not the day it was first listed", () => {
    const weekly = {
      ...base,
      id: "2",
      slug: "sunday-kirtan",
      start_date: "2026-06-07",
      is_recurring: true,
      recurrence_rule: '{"frequency":"weekly","day_of_week":0}',
      created_at: "2026-06-01T00:00:00Z",
    } as unknown as Event;
    const oneOff = { ...base, id: "3", start_date: "2026-11-26", is_recurring: false, recurrence_rule: null, created_at: "2026-11-01T00:00:00Z" } as unknown as Event;
    // Tuesday 24 Nov 2026, midday in Bali.
    const list = hubListEvents([weekly, oneOff], new Date("2026-11-24T04:00:00Z"));
    expect(list.map((e) => `${e.slug} ${e.start_date}`)).toEqual(["ecstatic-dance 2026-11-26", "sunday-kirtan 2026-11-29"]);
  });
});
