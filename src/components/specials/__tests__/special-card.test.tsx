import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SpecialCard } from "@/components/specials/special-card";
import type { Special } from "@/types";

const base: Special = {
  id: "1",
  venue_name: "Pesona Lounge Ubud",
  venue_area: "Padangtegal",
  venue_address: null,
  google_maps_url: null,
  instagram_handle: null,
  website_url: null,
  title: "MONDAY | Curry Cure",
  description: null,
  price_idr: null,
  normal_price_idr: null,
  weekdays: [1],
  days_stated: true,
  start_time: null,
  end_time: null,
  source: "admin",
  source_url: null,
  expires_on: "2026-12-01",
  confirmed_at: "2026-10-15T20:16:05Z",
};

// Vitest runs without globals here, so Testing Library can't clean up between tests by itself.
afterEach(cleanup);

describe("SpecialCard", () => {
  it("shows the saving under the title when both prices are known, and no price pill to repeat it", () => {
    render(<SpecialCard special={{ ...base, price_idr: 110000, normal_price_idr: 150000 }} />);
    expect(screen.getByText("IDR 110k instead of IDR 150k (save 26%)")).toBeInTheDocument();
    expect(screen.queryByText("IDR 110k")).not.toBeInTheDocument();
  });

  it("keeps the price pill when only the deal price is known", () => {
    render(<SpecialCard special={{ ...base, price_idr: 110000 }} />);
    expect(screen.getByText("IDR 110k")).toBeInTheDocument();
    expect(screen.queryByText(/instead of/)).not.toBeInTheDocument();
  });

  it("keeps the price pill when the two prices show no real saving", () => {
    render(<SpecialCard special={{ ...base, price_idr: 150000, normal_price_idr: 150000 }} />);
    expect(screen.getByText("IDR 150k")).toBeInTheDocument();
    expect(screen.queryByText(/instead of/)).not.toBeInTheDocument();
  });

  it("shows nothing for a normal price on its own", () => {
    render(<SpecialCard special={{ ...base, normal_price_idr: 125000 }} />);
    expect(screen.queryByText(/IDR/)).not.toBeInTheDocument();
  });

  it("tells the reader to ask the venue when the days aren't known", () => {
    render(<SpecialCard special={{ ...base, weekdays: [], days_stated: false, start_time: "17:00:00" }} />);
    expect(screen.getByText("Days: ask the venue · from 17:00")).toBeInTheDocument();
  });
});
