import { describe, it, expect } from "vitest";
import {
  runsOn,
  isStillOnToday,
  specialsForToday,
  formatWeekdays,
  formatHours,
  formatIdr,
  addDaysToDateStr,
} from "@/lib/specials";
import type { Special } from "@/types";

const base: Special = {
  id: "1",
  venue_name: "B",
  venue_area: null,
  venue_address: null,
  google_maps_url: null,
  instagram_handle: null,
  website_url: null,
  title: "x",
  description: null,
  price_idr: null,
  weekdays: [],
  start_time: null,
  end_time: null,
  expires_on: "2026-11-04",
  confirmed_at: "2026-10-05T00:00:00Z",
};
const tue6pm = { dateStr: "2026-10-06", dayOfWeek: 2, timeMinutes: 18 * 60 };

describe("specials helpers", () => {
  it("an empty weekday list runs every day", () => {
    expect(runsOn({ weekdays: [] }, 4)).toBe(true);
    expect(runsOn({ weekdays: [2] }, 2)).toBe(true);
    expect(runsOn({ weekdays: [2] }, 3)).toBe(false);
  });

  it("drops a special whose hours have ended, keeps one running past midnight", () => {
    expect(isStillOnToday({ weekdays: [2], end_time: "17:00:00" }, tue6pm)).toBe(false);
    expect(isStillOnToday({ weekdays: [2], end_time: "21:00:00" }, tue6pm)).toBe(true);
    expect(isStillOnToday({ weekdays: [2], end_time: "01:00:00" }, tue6pm)).toBe(true);
    expect(isStillOnToday({ weekdays: [2], end_time: null }, tue6pm)).toBe(true);
    expect(isStillOnToday({ weekdays: [3], end_time: null }, tue6pm)).toBe(false);
  });

  it("orders today's specials by start time, all-day last", () => {
    const rows = [
      { ...base, id: "all", venue_name: "A" },
      { ...base, id: "late", start_time: "20:00:00", weekdays: [2] },
      { ...base, id: "early", start_time: "17:00:00", weekdays: [2] },
      { ...base, id: "wed", weekdays: [3] },
    ];
    expect(specialsForToday(rows, tue6pm).map((s) => s.id)).toEqual(["early", "late", "all"]);
  });

  it("formats days, hours and prices", () => {
    expect(formatWeekdays([])).toBe("Every day");
    expect(formatWeekdays([1, 2, 3, 4, 5])).toBe("Weekdays");
    expect(formatWeekdays([6, 0])).toBe("Weekends");
    expect(formatWeekdays([4, 2])).toBe("Tue, Thu");
    expect(formatHours("17:00:00", "19:00:00")).toBe("17:00–19:00");
    expect(formatHours("17:00:00", null)).toBe("from 17:00");
    expect(formatHours(null, null)).toBeNull();
    expect(formatIdr(135000)).toBe("IDR 135k");
    expect(formatIdr(1500000)).toBe("IDR 1.5m");
    expect(formatIdr(null)).toBeNull();
  });

  it("adds days across a month end", () => {
    expect(addDaysToDateStr("2026-10-05", 30)).toBe("2026-11-04");
  });
});
