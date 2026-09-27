import { describe, it, expect } from "vitest";
import { isSpecificVenue, wayIn, contactHref, sameGathering, type SlotFields } from "@/lib/events/listing-checks";

function row(overrides: Partial<SlotFields>): SlotFields {
  return {
    id: Math.random().toString(36).slice(2),
    title: "Friday Ecstatic Dance w/ DION",
    venue_name: "The Yoga Barn",
    start_date: "2026-09-04",
    end_date: null,
    start_time: "19:15:00",
    is_recurring: true,
    recurrence_rule: '{"frequency":"weekly","day_of_week":5,"until":"2026-11-27"}',
    ...overrides,
  };
}

describe("isSpecificVenue", () => {
  it("rejects villages, districts and placeholders", () => {
    for (const v of ["Ubud", "Outside Ubud", "Penestanan", "Sayan, Bali", "Mas", "TBA", "Secret location", "Penestanan Ubud", null, ""]) {
      expect(isSpecificVenue(v), String(v)).toBe(false);
    }
  });
  it("accepts named places", () => {
    for (const v of ["The Yoga Barn", "Paradiso Ubud", "Radiantly Alive", "Sayuri Healing Food", "Pyramids of Chi"]) {
      expect(isSpecificVenue(v), v).toBe(true);
    }
  });
});

describe("wayIn", () => {
  it("prefers tickets, then the organiser, then the door", () => {
    expect(wayIn({ venue_name: "Ubud", external_ticket_url: "https://megatix.co.id/e" })?.kind).toBe("tickets");
    expect(wayIn({ venue_name: "Ubud", organizer_instagram: "@dissolve" })?.kind).toBe("organiser");
    expect(wayIn({ venue_name: "The Yoga Barn" })?.kind).toBe("walk-in");
    expect(wayIn({ venue_name: "Outside Ubud" })).toBeNull();
  });
});

describe("contactHref", () => {
  it("links phones to WhatsApp and emails to mail", () => {
    expect(contactHref("+62 812-3456-7890")).toBe("https://wa.me/6281234567890");
    expect(contactHref("0812 3456 7890")).toBe("https://wa.me/6281234567890");
    expect(contactHref("hello@example.com")).toBe("mailto:hello@example.com");
    expect(contactHref("ask at the door")).toBeNull();
  });
});

describe("sameGathering", () => {
  it("collapses todo.today's facilitator-of-the-week copies of one weekly slot", () => {
    const a = row({ title: "Friday Ecstatic Dance w/ DION" });
    const b = row({ title: "Friday Ecstatic Dance w/ Karunika", start_date: "2026-09-11" });
    const c = row({ title: "Friday Ecstatic Dance — The Yoga Barn", start_date: "2026-06-05" });
    expect(sameGathering(a, b)).toBe(true);
    expect(sameGathering(a, c)).toBe(true);
  });

  it("matches a one-off on a live series' day at the same slot", () => {
    const series = row({ title: "Dissolve :: Eros — Contact Improv", venue_name: "Paradiso Ubud", start_time: "18:00:00", recurrence_rule: '{"frequency":"weekly","day_of_week":2}' });
    const oneOff = row({ title: "Dissolve Eros w/ Tara", venue_name: "Paradiso", start_time: "18:00:00", is_recurring: false, recurrence_rule: null, start_date: "2026-09-29" });
    expect(sameGathering(oneOff, series)).toBe(true);
  });

  it("keeps different gatherings apart", () => {
    const dance = row({});
    expect(sameGathering(dance, row({ start_time: "17:00:00" }))).toBe(false); // different time
    expect(sameGathering(dance, row({ venue_name: "Radiantly Alive" }))).toBe(false); // different venue
    expect(sameGathering(dance, row({ title: "Yin Yoga", }))).toBe(false); // nothing distinctive shared
    expect(sameGathering(dance, row({ recurrence_rule: '{"frequency":"weekly","day_of_week":3}' }))).toBe(false); // different weekday
    expect(sameGathering(row({ venue_name: "Ubud" }), row({ venue_name: "Ubud" }))).toBe(false); // area, not a room
  });
});
