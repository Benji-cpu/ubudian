import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dealPaths,
  eventListingPaths,
  indexNowBody,
  indexNowUrls,
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  pingIndexNow,
} from "@/lib/indexnow";

describe("the key file", () => {
  it("is in /public under the key's name, holding just the key", () => {
    const body = readFileSync(join(process.cwd(), "public", `${INDEXNOW_KEY}.txt`), "utf8");
    expect(body.trim()).toBe(INDEXNOW_KEY);
  });
});

describe("indexNowUrls", () => {
  it("makes each path an absolute theubudian.life URL, once", () => {
    expect(indexNowUrls(["/events", "/events", "https://theubudian.life/deals", "/deals#top"])).toEqual([
      "https://theubudian.life/events",
      "https://theubudian.life/deals",
    ]);
  });

  it("drops URLs on any other host", () => {
    expect(indexNowUrls(["https://example.com/events", "http://localhost:4000/deals", "/ubud-tonight"])).toEqual([
      "https://theubudian.life/ubud-tonight",
    ]);
  });
});

describe("indexNowBody", () => {
  it("names the host, the key and where the key file lives", () => {
    expect(indexNowBody(["https://theubudian.life/events"])).toEqual({
      host: "theubudian.life",
      key: INDEXNOW_KEY,
      keyLocation: `https://theubudian.life/${INDEXNOW_KEY}.txt`,
      urlList: ["https://theubudian.life/events"],
    });
  });
});

describe("the pages each change touches", () => {
  it("events: /events, both timetables and the practice hubs", () => {
    const paths = eventListingPaths();
    expect(paths.slice(0, 3)).toEqual(["/events", "/ubud-tonight", "/ubud-events-this-week"]);
    expect(paths).toContain("/ecstatic-dance-ubud");
  });

  it("deals: /deals and each venue's page", () => {
    expect(dealPaths(["Pesona Lounge Ubud", "★"])).toEqual(["/deals", "/deals/pesona-lounge-ubud"]);
  });
});

describe("pingIndexNow", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends nothing outside production", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const fetchImpl = vi.fn();
    const r = await pingIndexNow(["/events"], { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ status: null, urls: 1, skipped: "not production" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts the body in production and reports an accepted status", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    const r = await pingIndexNow(["/events", "/ubud-tonight"], { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ status: 202, urls: 2 });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(INDEXNOW_ENDPOINT);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body).urlList).toEqual(["https://theubudian.life/events", "https://theubudian.life/ubud-tonight"]);
  });

  it("returns a refusal instead of throwing", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchImpl = vi.fn().mockResolvedValue(new Response("Key not valid", { status: 403 }));
    const r = await pingIndexNow(["/events"], { force: true, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ status: 403, urls: 1, error: "Key not valid" });
  });

  it("returns a network failure instead of throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi.fn().mockRejectedValue(new Error("timeout"));
    const r = await pingIndexNow(["/events"], { force: true, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ status: null, urls: 1, error: "timeout" });
  });

  it("sends nothing when no URL is ours", async () => {
    const fetchImpl = vi.fn();
    const r = await pingIndexNow(["https://example.com/x"], { force: true, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r.skipped).toBe("no urls");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
