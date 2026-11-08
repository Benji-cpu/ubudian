import { describe, it, expect } from "vitest";
import { format } from "date-fns";
import { baliCalendarDate, eventStartsWhen, nowInBali, nowInBaliDate } from "@/lib/events/bali-time";

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

describe("baliCalendarDate", () => {
  // The original `nowInBaliDate` returned a Date whose UTC components match
  // Bali — fine for UTC test envs, broken when date-fns reads local
  // components on a non-UTC machine (e.g. an actual Bali user's browser),
  // which double-shifts the day forward by 8 h. `baliCalendarDate` anchors
  // the date in local components so `format()` round-trips correctly.

  it("formats to the Bali wall date when called near Bali midnight from UTC", () => {
    // 16:30 UTC = 00:30 Bali (next day).
    const t = new Date(Date.UTC(2026, 4, 18, 16, 30, 0));
    expect(format(baliCalendarDate(t), "yyyy-MM-dd")).toBe("2026-05-19");
  });

  it("formats to today during normal Bali hours", () => {
    // 05:00 UTC = 13:00 Bali, same day.
    const t = new Date(Date.UTC(2026, 4, 19, 5, 0, 0));
    expect(format(baliCalendarDate(t), "yyyy-MM-dd")).toBe("2026-05-19");
  });

  it("matches nowInBali().dateStr exactly", () => {
    const t = new Date(Date.UTC(2026, 4, 19, 13, 9, 0));
    expect(format(baliCalendarDate(t), "yyyy-MM-dd")).toBe(nowInBali(t).dateStr);
  });
});

describe("eventStartsWhen", () => {
  // 02:00 UTC on 9 Nov = 10:00 Bali, Monday 9 Nov.
  const mondayMorning = nowInBali(new Date(Date.UTC(2026, 10, 9, 2, 0, 0)));

  it("is tonight for an event today from 16:00 Bali", () => {
    expect(eventStartsWhen({ start_date: "2026-11-09", start_time: "16:00:00" }, mondayMorning)).toBe("tonight");
    expect(eventStartsWhen({ start_date: "2026-11-09", start_time: "19:30" }, mondayMorning)).toBe("tonight");
  });

  it("is today for an event today before 16:00, or with no start time", () => {
    expect(eventStartsWhen({ start_date: "2026-11-09", start_time: "15:59:00" }, mondayMorning)).toBe("today");
    expect(eventStartsWhen({ start_date: "2026-11-09", start_time: "08:00:00" }, mondayMorning)).toBe("today");
    expect(eventStartsWhen({ start_date: "2026-11-09", start_time: null }, mondayMorning)).toBe("today");
  });

  it("is another day for any other date, by Bali's calendar not the server's", () => {
    expect(eventStartsWhen({ start_date: "2026-11-10", start_time: "19:00:00" }, mondayMorning)).toBe("another-day");
    expect(eventStartsWhen({ start_date: "2026-11-08", start_time: "19:00:00" }, mondayMorning)).toBe("another-day");
    // 17:00 UTC on 8 Nov is already 01:00 on 9 Nov in Bali.
    const lateSundayUtc = nowInBali(new Date(Date.UTC(2026, 10, 8, 17, 0, 0)));
    expect(eventStartsWhen({ start_date: "2026-11-09", start_time: "19:00:00" }, lateSundayUtc)).toBe("tonight");
    expect(eventStartsWhen({ start_date: "2026-11-08", start_time: "19:00:00" }, lateSundayUtc)).toBe("another-day");
  });
});
