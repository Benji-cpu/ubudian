import { describe, it, expect } from "vitest";
import { countDeals, countReaders, countSubscribers } from "@/lib/venue/reader-numbers";

describe("the /for-venues counts", () => {
  it("counts only real, active subscribers", () => {
    const rows = [
      { email: "ana@gmail.com", status: "active" },
      { email: "ANA@gmail.com ", status: "active" }, // the same person
      { email: "left@gmail.com", status: "unsubscribed" },
      { email: "e2e@theubudian.test", status: "active" }, // our own test runs
      { email: "someone@example.com", status: "active" },
      { email: "optedout@gmail.com", status: "active" },
      { email: null, status: "active" },
    ];
    expect(countSubscribers(rows, ["OptedOut@gmail.com"])).toBe(1);
  });

  it("counts each reader once, however many taps", () => {
    expect(countReaders([{ anon_id: "a" }, { anon_id: "b" }, { anon_id: "a" }, { anon_id: null }])).toBe(2);
    expect(countReaders([])).toBe(0);
  });

  it("counts deals and the places offering them", () => {
    expect(
      countDeals([{ venue_name: "Pesona Lounge Ubud" }, { venue_name: "Pesona Lounge Ubud" }, { venue_name: "Moksa" }])
    ).toEqual({ deals: 3, places: 2 });
  });
});
