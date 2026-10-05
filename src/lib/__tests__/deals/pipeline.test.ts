import { describe, expect, it } from "vitest";
import { stageFor, summarise, type PipelineSpecial, type PipelineVenue } from "@/lib/deals/pipeline";

const venue = (over: Partial<PipelineVenue> = {}): PipelineVenue => ({
  id: "v1",
  name: "Warung Test",
  area: "Ubud centre",
  category: "warung",
  researched_at: null,
  next_check_on: null,
  closed_at: null,
  owner_user_id: null,
  ...over,
});
const special = (over: Partial<PipelineSpecial> = {}): PipelineSpecial => ({
  venue_id: "v1",
  status: "hidden",
  source: "seed",
  expires_on: "2026-11-05",
  ...over,
});
const today = "2026-10-06";

describe("stageFor", () => {
  it("walks the stages in order", () => {
    expect(stageFor(venue(), [], today)).toBe("not_checked");
    expect(stageFor(venue({ researched_at: "2026-10-01T00:00:00Z" }), [], today)).toBe("nothing_found");
    expect(stageFor(venue(), [special()], today)).toBe("special_found");
    expect(stageFor(venue(), [special({ status: "pending" })], today)).toBe("venue_confirmed");
    expect(stageFor(venue({ owner_user_id: "u1" }), [special()], today)).toBe("venue_confirmed");
    expect(stageFor(venue(), [special({ status: "live" })], today)).toBe("live");
  });

  it("flags a live deal within 7 days of lapsing, or already lapsed", () => {
    expect(stageFor(venue(), [special({ status: "live", expires_on: "2026-10-13" })], today)).toBe("reconfirm_due");
    expect(stageFor(venue(), [special({ status: "live", expires_on: "2026-10-01" })], today)).toBe("reconfirm_due");
    expect(stageFor(venue(), [special({ status: "live", expires_on: "2026-10-14" })], today)).toBe("live");
  });

  it("keeps a closed venue closed whatever is on file", () => {
    expect(stageFor(venue({ closed_at: "2026-10-02T00:00:00Z" }), [special({ status: "live" })], today)).toBe("closed");
  });
});

describe("summarise", () => {
  it("counts stages, checks and venues due", () => {
    const now = new Date("2026-10-06T04:00:00Z"); // 12:00 Bali
    const s = summarise(
      [
        venue({ id: "a" }),
        venue({ id: "b", researched_at: "2026-10-06T01:00:00Z", next_check_on: "2026-12-05" }),
        venue({ id: "c", researched_at: "2026-10-02T01:00:00Z", next_check_on: "2026-10-05" }),
      ],
      [special({ venue_id: "b" })],
      now
    );
    expect(s.byStage.not_checked).toBe(1);
    expect(s.byStage.special_found).toBe(1);
    expect(s.byStage.nothing_found).toBe(1);
    expect(s.checkedToday).toBe(1);
    expect(s.checkedThisWeek).toBe(2);
    expect(s.dueNow).toBe(2);
  });
});
