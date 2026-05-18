import { describe, it, expect } from "vitest";
import { format } from "date-fns";
import { nowInBali, nowInBaliDate } from "@/lib/events/bali-time";

describe("nowInBaliDate", () => {
  it("returns Bali date components even near midnight UTC", () => {
    // 23:30 UTC on 2026-05-18 → 07:30 Bali on 2026-05-19.
    const utcLateNight = new Date(Date.UTC(2026, 4, 18, 23, 30, 0));
    const bali = nowInBaliDate(utcLateNight);
    expect(format(bali, "yyyy-MM-dd")).toBe("2026-05-19");
  });

  it("agrees with nowInBali().dateStr", () => {
    const t = new Date(Date.UTC(2026, 4, 18, 23, 30, 0));
    const dateStr = nowInBali(t).dateStr;
    expect(format(nowInBaliDate(t), "yyyy-MM-dd")).toBe(dateStr);
  });

  it("matches Bali wall clock during normal daylight UTC", () => {
    // 03:00 UTC → 11:00 Bali, same day.
    const morningUTC = new Date(Date.UTC(2026, 5, 1, 3, 0, 0));
    expect(format(nowInBaliDate(morningUTC), "yyyy-MM-dd")).toBe("2026-06-01");
  });
});
