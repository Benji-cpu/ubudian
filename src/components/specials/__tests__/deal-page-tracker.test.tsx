import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DealPageTracker } from "@/components/specials/deal-page-tracker";

const beacon = vi.fn<(url: string, data?: BodyInit | null) => boolean>(() => true);

/** The kinds sent so far, read back out of the beacon bodies. */
async function sentKinds(): Promise<string[]> {
  const calls = beacon.mock.calls as unknown as [string, Blob][];
  return Promise.all(calls.map(async ([, blob]) => JSON.parse(await blob.text()).kind as string));
}

function page() {
  return render(
    <div>
      <DealPageTracker slug="moksa" />
      <a href="https://maps.example/moksa" data-deal-track="map" onClick={(e) => e.preventDefault()}>
        Map <span>and directions</span>
      </a>
      <a href="https://example.com/elsewhere" onClick={(e) => e.preventDefault()}>
        All deals
      </a>
    </div>
  );
}

describe("DealPageTracker", () => {
  beforeEach(() => {
    beacon.mockClear();
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.history.replaceState(null, "", "/deals/moksa");
  });
  afterEach(cleanup);

  it("sends one view per venue per session, however often the page renders", async () => {
    page();
    cleanup();
    page();
    expect(await sentKinds()).toEqual(["view"]);
    expect(beacon.mock.calls[0][0]).toBe("/api/deals/track");
  });

  it("counts a tap on a marked link, including on its inner text, and ignores unmarked links", async () => {
    page();
    fireEvent.click(screen.getByText("and directions"));
    fireEvent.click(screen.getByText("All deals"));
    expect(await sentKinds()).toEqual(["view", "map"]);
  });

  it("counts nothing when localStorage.ubu_nocount is 1", async () => {
    window.localStorage.setItem("ubu_nocount", "1");
    page();
    fireEvent.click(screen.getByText("and directions"));
    expect(beacon).not.toHaveBeenCalled();
  });

  it("?nocount=1 opts this browser out and remembers it", () => {
    window.history.replaceState(null, "", "/deals/moksa?nocount=1");
    page();
    expect(beacon).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("ubu_nocount")).toBe("1");
  });

  it("falls back to fetch keepalive when there's no beacon", async () => {
    Object.defineProperty(navigator, "sendBeacon", { value: undefined, configurable: true });
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchMock);
    page();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/deals/track");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body as string)).toEqual({ slug: "moksa", kind: "view" });
    vi.unstubAllGlobals();
  });
});
