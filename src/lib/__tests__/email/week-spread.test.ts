import { describe, expect, it } from "vitest";
import { spreadAcrossWeek } from "@/lib/email/week-spread";
import type { Event } from "@/types";

const ev = (id: string, start_date: string) => ({ id, start_date }) as Event;

describe("spreadAcrossWeek", () => {
  it("takes one per day before a second from any day", () => {
    const events = [
      ev("w1", "2026-10-07"), ev("w2", "2026-10-07"), ev("w3", "2026-10-07"),
      ev("w4", "2026-10-07"), ev("w5", "2026-10-07"),
      ev("f1", "2026-10-09"), ev("s1", "2026-10-10"),
    ];
    expect(spreadAcrossWeek(events, 5).map((e) => e.id)).toEqual(["w1", "w2", "w3", "f1", "s1"]);
  });

  it("never repeats a recurring event that runs on several days", () => {
    const events = [ev("yoga", "2026-10-07"), ev("yoga", "2026-10-08"), ev("dance", "2026-10-08")];
    expect(spreadAcrossWeek(events, 5).map((e) => e.id)).toEqual(["yoga", "dance"]);
  });

  it("returns fewer when there aren't enough", () => {
    expect(spreadAcrossWeek([ev("a", "2026-10-07")], 5)).toHaveLength(1);
    expect(spreadAcrossWeek([], 5)).toHaveLength(0);
  });
});
