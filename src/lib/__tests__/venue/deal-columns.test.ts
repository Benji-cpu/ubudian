import { describe, expect, it } from "vitest";
import { dealColumns, EDITABLE_DEAL_FIELDS } from "@/lib/venue/schema";

describe("normal price on a venue deal", () => {
  it("is stored, and null when left empty", () => {
    const base = { title: "2-for-1 pizza", weekdays: [2, 0] };
    expect(dealColumns({ ...base, price_idr: 95000, normal_price_idr: 190000 }).normal_price_idr).toBe(190000);
    expect(dealColumns(base).normal_price_idr).toBeNull();
  });
  it("is editable, so an owner's edit can carry it", () => {
    expect(EDITABLE_DEAL_FIELDS).toContain("normal_price_idr");
  });
});
